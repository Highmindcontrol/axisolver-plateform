-- LOT WORKSPACE — Multi-administrateurs AxiSolver.
--
-- Introduction du modèle « workspace » (compte client AxiSolver qui
-- peut avoir plusieurs administrateurs). Chaque user existant devient
-- l'admin principal d'un workspace personnel. Les sites sont rattachés
-- au workspace plutôt qu'à un user, ce qui permet à tous les membres
-- du workspace d'y accéder avec les mêmes droits.
--
-- Doctrine : tout membre « admin » d'un workspace a strictement les
-- mêmes droits que le créateur (gestion sites, base de connaissances,
-- audits, facturation, invitation d'autres admins).

/* ─── Table workspaces ──────────────────────────────────────────── */

CREATE TABLE "workspaces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nom" text NOT NULL,
  "cree_par_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "maj_le" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "idx_workspaces_cree_par" ON "workspaces" ("cree_par_user_id");

/* ─── Table workspace_members ───────────────────────────────────── */

CREATE TYPE "workspace_role" AS ENUM ('admin');
-- Un seul rôle 'admin' pour V1 — doctrine « égalité stricte entre
-- co-administrateurs ». Un rôle 'viewer' pourra être ajouté plus tard
-- sans migration coûteuse (ALTER TYPE ADD VALUE).

CREATE TABLE "workspace_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "workspace_role" NOT NULL DEFAULT 'admin',
  "ajoute_le" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("workspace_id", "user_id")
);

CREATE INDEX "idx_workspace_members_user" ON "workspace_members" ("user_id");
CREATE INDEX "idx_workspace_members_workspace" ON "workspace_members" ("workspace_id");

/* ─── Table workspace_invitations ───────────────────────────────── */

CREATE TYPE "workspace_invitation_statut" AS ENUM (
  'en_attente',
  'acceptee',
  'expiree',
  'revoquee'
);

CREATE TABLE "workspace_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "prenom" text,
  "nom" text,
  "token" text NOT NULL UNIQUE,
  "statut" "workspace_invitation_statut" NOT NULL DEFAULT 'en_attente',
  "cree_par_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE SET NULL,
  "expire_le" timestamptz NOT NULL,
  "accepte_par_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "accepte_le" timestamptz,
  "cree_le" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "idx_workspace_invitations_token" ON "workspace_invitations" ("token");
CREATE INDEX "idx_workspace_invitations_workspace" ON "workspace_invitations" ("workspace_id");
CREATE INDEX "idx_workspace_invitations_email" ON "workspace_invitations" ("email");

/* ─── Sites : workspace_id ──────────────────────────────────────── */

ALTER TABLE "sites" ADD COLUMN "workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE CASCADE;
CREATE INDEX "idx_sites_workspace_id" ON "sites" ("workspace_id");

/* ─── Backfill ──────────────────────────────────────────────────── */
--
-- Pour chaque user existant avec au moins un site, on crée un
-- workspace personnel, on l'ajoute comme admin principal, puis on
-- associe tous ses sites à ce workspace.

DO $$
DECLARE
  user_record RECORD;
  new_workspace_id uuid;
BEGIN
  FOR user_record IN
    SELECT DISTINCT u.id, COALESCE(u.email, 'Compte AxiSolver') AS email
    FROM "users" u
    WHERE EXISTS (SELECT 1 FROM "sites" s WHERE s."owner_user_id" = u.id)
  LOOP
    INSERT INTO "workspaces" ("nom", "cree_par_user_id")
    VALUES (user_record.email || ' — compte', user_record.id)
    RETURNING "id" INTO new_workspace_id;

    INSERT INTO "workspace_members" ("workspace_id", "user_id", "role")
    VALUES (new_workspace_id, user_record.id, 'admin');

    UPDATE "sites"
    SET "workspace_id" = new_workspace_id
    WHERE "owner_user_id" = user_record.id;
  END LOOP;
END $$;

/* ─── RLS ───────────────────────────────────────────────────────── */

ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_invitations" ENABLE ROW LEVEL SECURITY;

-- Un user voit les workspaces dont il est membre.
CREATE POLICY "workspaces_select_membre" ON "workspaces"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "workspace_members" m
      WHERE m."workspace_id" = "workspaces"."id"
        AND m."user_id" = auth.uid()
    )
  );

-- Un user voit ses propres membreships + ceux des workspaces où il
-- est lui-même admin (pour afficher la liste des co-admins).
CREATE POLICY "workspace_members_select_membre" ON "workspace_members"
  FOR SELECT USING (
    "user_id" = auth.uid()
    OR EXISTS (
      SELECT 1 FROM "workspace_members" m2
      WHERE m2."workspace_id" = "workspace_members"."workspace_id"
        AND m2."user_id" = auth.uid()
    )
  );

-- Les invitations sont visibles aux membres du workspace cible.
CREATE POLICY "workspace_invitations_select_membre" ON "workspace_invitations"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "workspace_members" m
      WHERE m."workspace_id" = "workspace_invitations"."workspace_id"
        AND m."user_id" = auth.uid()
    )
  );

-- Les écritures passent par service_role dans les server actions
-- (vérif permissions côté application avec ownership strict).

/* ─── Helper SQL : user_a_acces_site ────────────────────────────── */
--
-- Fonction utilitaire pour les futures RLS sites/configs/… qui
-- veulent vérifier qu'un user a accès à un site via son workspace.
-- Compatibilité : garde aussi la voie legacy via owner_user_id tant
-- que la migration n'est pas totalement propagée.

CREATE OR REPLACE FUNCTION user_a_acces_site(site_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM sites s
    LEFT JOIN workspace_members wm
      ON wm.workspace_id = s.workspace_id
     AND wm.user_id = auth.uid()
    WHERE s.id = site_id_param
      AND (
        s.owner_user_id = auth.uid()
        OR wm.user_id IS NOT NULL
      )
  );
$$;
