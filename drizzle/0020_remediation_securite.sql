-- AXI Security Shield — Système de remédiation.
--
-- Ajoute 2 structures :
-- 1. site_configs.mode_remediation_securite : mode choisi par l'admin
--    (desactive = AXI n'intervient pas, validation = AXI propose et attend
--    approbation, automatique = AXI exécute dès qu'il peut).
-- 2. Table securite_interventions : journal des actions AXI Security
--    Shield. Chaque proposition / exécution / échec est tracé.
--
-- IDEMPOTENT.

-- ─── 1. Mode de remédiation sur site_configs ─────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'remediation_securite_mode'
  ) THEN
    CREATE TYPE remediation_securite_mode AS ENUM (
      'desactive',
      'validation',
      'automatique'
    );
  END IF;
END$$;

ALTER TABLE "site_configs"
  ADD COLUMN IF NOT EXISTS "mode_remediation_securite"
    remediation_securite_mode NOT NULL DEFAULT 'desactive';

-- ─── 2. Table securite_interventions ─────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'intervention_securite_statut'
  ) THEN
    CREATE TYPE intervention_securite_statut AS ENUM (
      'en_attente_validation',
      'programmee',
      'en_cours',
      'terminee',
      'echec',
      'refusee',
      'annulee'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "securite_interventions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "audit_id" uuid REFERENCES "security_audits"("id") ON DELETE SET NULL,
  "finding_code" text NOT NULL,
  "pilier" text NOT NULL,
  "titre" text NOT NULL,
  "description_action" text NOT NULL,
  "statut" intervention_securite_statut NOT NULL DEFAULT 'en_attente_validation',
  "mode_declenche" remediation_securite_mode NOT NULL DEFAULT 'validation',
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "programmee_pour" timestamptz,
  "execute_le" timestamptz,
  "termine_le" timestamptz,
  "resultat" jsonb,
  "erreur" text,
  "valide_par_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "valide_le" timestamptz
);

CREATE INDEX IF NOT EXISTS "idx_securite_interventions_site"
  ON "securite_interventions" ("site_id");
CREATE INDEX IF NOT EXISTS "idx_securite_interventions_statut"
  ON "securite_interventions" ("statut");
CREATE INDEX IF NOT EXISTS "idx_securite_interventions_cree_le"
  ON "securite_interventions" ("cree_le" DESC);

ALTER TABLE "securite_interventions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "securite_interventions_tout" ON "securite_interventions";
CREATE POLICY "securite_interventions_tout"
  ON "securite_interventions"
  FOR ALL
  USING (user_a_acces_site("site_id"))
  WITH CHECK (user_a_acces_site("site_id"));
