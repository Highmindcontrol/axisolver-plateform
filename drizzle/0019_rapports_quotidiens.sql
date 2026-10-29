-- Archivage des rapports quotidiens AxiSolver.
--
-- Chaque envoi par Brevo (via le cron ou le bouton manuel) est persisté
-- ici pour que l'admin puisse re-consulter l'historique depuis le
-- dashboard avec une vue par onglets (Vue d'ensemble / Ads / SEO /
-- Sécurité). Le HTML est stocké tel qu'envoyé (reproductibilité) et le
-- payload JSON permet un rendu riche côté site si on souhaite plus que
-- l'affichage brut.
--
-- IDEMPOTENT.

CREATE TABLE IF NOT EXISTS "rapports_quotidiens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "periode_debut" timestamptz NOT NULL,
  "periode_fin" timestamptz NOT NULL,
  "stats" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "opportunite" jsonb,
  "html" text NOT NULL,
  "destinataire_principal" text,
  "nb_destinataires_supp" integer NOT NULL DEFAULT 0,
  "statut_envoi" text NOT NULL DEFAULT 'envoye',
  "mode" text NOT NULL DEFAULT 'auto'
);

CREATE INDEX IF NOT EXISTS "idx_rapports_quotidiens_site"
  ON "rapports_quotidiens" ("site_id");

CREATE INDEX IF NOT EXISTS "idx_rapports_quotidiens_cree_le"
  ON "rapports_quotidiens" ("cree_le" DESC);

ALTER TABLE "rapports_quotidiens" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rapports_quotidiens_tout" ON "rapports_quotidiens";
CREATE POLICY "rapports_quotidiens_tout"
  ON "rapports_quotidiens"
  FOR ALL
  USING (user_a_acces_site("site_id"))
  WITH CHECK (user_a_acces_site("site_id"));
