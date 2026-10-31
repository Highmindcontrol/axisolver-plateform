-- LOT MULTISITE — AxiSolver V2 : 3 sites inclus par abonnement.
-- Doctrine François 31 oct 2026 (project_axisolver_multisite_doctrine) :
--   • 1 abonnement = 3 sites inclus (quota conversations partagé)
--   • 4e site et + : 29 €/mois chacun, +100 conv cumulées au quota
--   • Co-admin : scope mono-site OU multi-sites, « lecture seule »
--     si son site assigné est supprimé.
--
-- Migration non-breaking : ajoute des colonnes et une nouvelle fonction
-- SQL sans toucher aux existantes. Le code applicatif continue de
-- fonctionner tel quel jusqu'à ce qu'on bascule explicitement sur les
-- nouvelles colonnes.
--
-- IDEMPOTENT.

/* ─── 1. stripe_subscriptions : lien vers workspace ────────────── */

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stripe_subscriptions'
      AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE "stripe_subscriptions"
      ADD COLUMN "workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_stripe_subscriptions_workspace_id"
  ON "stripe_subscriptions" ("workspace_id");

/* ─── 2. stripe_subscriptions : sites_supplementaires + bonus conv ─ */

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stripe_subscriptions'
      AND column_name = 'sites_supplementaires'
  ) THEN
    ALTER TABLE "stripe_subscriptions"
      ADD COLUMN "sites_supplementaires" integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stripe_subscriptions'
      AND column_name = 'bonus_conversations'
  ) THEN
    ALTER TABLE "stripe_subscriptions"
      ADD COLUMN "bonus_conversations" integer NOT NULL DEFAULT 0;
  END IF;
END $$;

COMMENT ON COLUMN "stripe_subscriptions"."sites_supplementaires" IS
  'Nombre de sites au-delà des 3 inclus. Chaque unité = +29 €/mois + 100 conv au quota.';
COMMENT ON COLUMN "stripe_subscriptions"."bonus_conversations" IS
  'Conversations supplémentaires cumulées via sites 4+ (= sites_supplementaires * 100).';

/* ─── 3. workspace_members : scope mono-site ou multi-sites ────── */

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workspace_members'
      AND column_name = 'sites_accessibles'
  ) THEN
    ALTER TABLE "workspace_members"
      ADD COLUMN "sites_accessibles" jsonb;
  END IF;
END $$;

COMMENT ON COLUMN "workspace_members"."sites_accessibles" IS
  'Scope d''accès du co-admin : NULL = tous sites du workspace (full access), [] = aucun (lecture seule, cas site supprimé), [uuid1, uuid2, …] = scope limité.';

CREATE INDEX IF NOT EXISTS "idx_workspace_members_sites_accessibles"
  ON "workspace_members" USING gin ("sites_accessibles");

/* ─── 4. Fonction SQL user_a_acces_site v3 (respecte scope) ────── */

CREATE OR REPLACE FUNCTION "user_a_acces_site"(p_site_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM sites s
    LEFT JOIN workspace_members wm
      ON wm.workspace_id = s.workspace_id
      AND wm.user_id = auth.uid()
    LEFT JOIN site_membres sm
      ON sm.site_id = s.id
      AND sm.user_id = auth.uid()
    WHERE s.id = p_site_id
      AND (
        -- Legacy : propriétaire direct
        s.owner_user_id = auth.uid()
        -- Legacy : site_membres
        OR sm.user_id IS NOT NULL
        -- V3 : workspace_members avec respect du scope sites_accessibles
        OR (
          wm.user_id IS NOT NULL
          AND (
            -- Full access (NULL = tous sites)
            wm.sites_accessibles IS NULL
            -- Scope limité : le site doit être dans la liste
            OR wm.sites_accessibles @> jsonb_build_array(p_site_id::text)
          )
        )
      )
  );
$$;

/* ─── 5. Helper : sites accessibles d'un user dans un workspace ── */

CREATE OR REPLACE FUNCTION "sites_accessibles_user_workspace"(
  p_user_id uuid,
  p_workspace_id uuid
) RETURNS SETOF uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scope jsonb;
BEGIN
  SELECT wm.sites_accessibles INTO v_scope
  FROM workspace_members wm
  WHERE wm.workspace_id = p_workspace_id
    AND wm.user_id = p_user_id
  LIMIT 1;

  -- User pas membre du workspace → rien
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Full access : tous les sites du workspace
  IF v_scope IS NULL THEN
    RETURN QUERY
      SELECT s.id FROM sites s WHERE s.workspace_id = p_workspace_id;
    RETURN;
  END IF;

  -- Scope limité : les sites de la liste qui existent toujours
  RETURN QUERY
    SELECT s.id FROM sites s
    WHERE s.workspace_id = p_workspace_id
      AND s.id::text IN (
        SELECT jsonb_array_elements_text(v_scope)
      );
END;
$$;

/* ─── 6. Grants ──────────────────────────────────────────────────── */

GRANT EXECUTE ON FUNCTION "user_a_acces_site"(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION "sites_accessibles_user_workspace"(uuid, uuid) TO authenticated, service_role;
