-- LOT SUPER-ADMIN — Rôle plateforme AxiSolver.
--
-- Introduction d'un rôle « plateforme » distinct des rôles workspace :
--   · super_admin        — accès total au back-office AxiSolver
--                          (métriques globales, gestion users, coûts,
--                          export Forteresse Ataraxis)
--   · admin_plateforme   — admin de 2nd rang (consultation + support,
--                          pas de modif structurelle)
--   · contributeur       — rédaction contenu (blog, guide, FAQ)
--
-- Doctrine : ce rôle ne touche PAS aux droits workspace (gestion des
-- sites clients). Un super_admin reste admin de son propre workspace,
-- indépendamment. Les deux systèmes de permissions sont orthogonaux.
--
-- Table dédiée profils_plateforme (plutôt qu'un champ sur users) pour
-- garder l'absence de ligne = utilisateur standard (défaut sécurisé).
--
-- IDEMPOTENT.

/* ─── Enum role_plateforme ──────────────────────────────────────── */

DO $$ BEGIN
  CREATE TYPE "role_plateforme" AS ENUM (
    'super_admin',
    'admin_plateforme',
    'contributeur'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

/* ─── Table profils_plateforme ──────────────────────────────────── */

CREATE TABLE IF NOT EXISTS "profils_plateforme" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "role_plateforme" NOT NULL,
  "notes" text,
  "cree_par_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "maj_le" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_profils_plateforme_role"
  ON "profils_plateforme" ("role");

/* ─── Initialisation : François = super_admin ───────────────────── */

INSERT INTO "profils_plateforme" ("user_id", "role", "notes")
SELECT u."id", 'super_admin', 'Fondateur Ataraxis Group'
FROM "users" u
JOIN "auth"."users" au ON au."id" = u."id"
WHERE au."email" = 'flemoing@gmail.com'
ON CONFLICT ("user_id") DO NOTHING;

/* ─── RLS : seuls les super_admin voient/modifient la table ─────── */

ALTER TABLE "profils_plateforme" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profils_plateforme_lecture_super_admin"
  ON "profils_plateforme";
CREATE POLICY "profils_plateforme_lecture_super_admin"
  ON "profils_plateforme"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "profils_plateforme" p
      WHERE p."user_id" = auth.uid()
        AND p."role" = 'super_admin'
    )
    OR "user_id" = auth.uid()
  );

DROP POLICY IF EXISTS "profils_plateforme_ecriture_super_admin"
  ON "profils_plateforme";
CREATE POLICY "profils_plateforme_ecriture_super_admin"
  ON "profils_plateforme"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "profils_plateforme" p
      WHERE p."user_id" = auth.uid()
        AND p."role" = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "profils_plateforme" p
      WHERE p."user_id" = auth.uid()
        AND p."role" = 'super_admin'
    )
  );
