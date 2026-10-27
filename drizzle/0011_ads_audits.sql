-- LOT J — Audits publicité / Ads AxiSolver.
-- Détection trackers, consentement cookies, visibilité SERP sponsorisée,
-- infrastructure remarketing. Audit mensuel + manuel.

CREATE TYPE "audit_ads_statut" AS ENUM ('en_cours', 'termine', 'echec');
CREATE TYPE "audit_ads_declencheur" AS ENUM ('manuel', 'auto_mensuel', 'api');

CREATE TABLE "ads_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "url_auditee" text NOT NULL,
  "declencheur" "audit_ads_declencheur" NOT NULL DEFAULT 'manuel',
  "statut" "audit_ads_statut" NOT NULL DEFAULT 'en_cours',
  "score_global" integer,
  "score_trackers" integer,
  "score_consentement" integer,
  "score_visibilite" integer,
  "score_remarketing" integer,
  "trackers_detectes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "annonces_concurrentes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "findings" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "recommandations" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "mots_cles_testes" text[] NOT NULL DEFAULT '{}',
  "duree_ms" integer,
  "erreur" text,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "termine_le" timestamptz
);

CREATE INDEX "idx_ads_audits_site_id" ON "ads_audits" ("site_id");
CREATE INDEX "idx_ads_audits_cree_le" ON "ads_audits" ("cree_le" DESC);

ALTER TABLE "ads_audits" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ads_audits_select_proprietaire" ON "ads_audits"
  FOR SELECT USING (user_a_acces_site("site_id"));

CREATE POLICY "ads_audits_insert_proprietaire" ON "ads_audits"
  FOR INSERT WITH CHECK (user_a_acces_site("site_id"));

CREATE POLICY "ads_audits_update_proprietaire" ON "ads_audits"
  FOR UPDATE USING (user_a_acces_site("site_id"))
  WITH CHECK (user_a_acces_site("site_id"));

CREATE POLICY "ads_audits_delete_proprietaire" ON "ads_audits"
  FOR DELETE USING (user_a_acces_site("site_id"));
