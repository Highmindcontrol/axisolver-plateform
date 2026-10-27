-- LOT H.1 — Audits SEO AxiSolver
-- Historisation des audits SEO lancés manuellement ou mensuellement par cron.
-- Un enregistrement = un audit à un instant t, avec scores par pilier,
-- findings détaillés, recommandations priorisées.

CREATE TYPE "audit_seo_statut" AS ENUM ('en_cours', 'termine', 'echec');
CREATE TYPE "audit_seo_declencheur" AS ENUM ('manuel', 'auto_mensuel', 'api');

CREATE TABLE "seo_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "url_auditee" text NOT NULL,
  "declencheur" "audit_seo_declencheur" NOT NULL DEFAULT 'manuel',
  "statut" "audit_seo_statut" NOT NULL DEFAULT 'en_cours',
  "score_global" integer,
  "score_technique" integer,
  "score_contenu" integer,
  "score_mots_cles" integer,
  "score_performance" integer,
  "score_mobile" integer,
  "findings" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "recommandations" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "mots_cles_testes" text[] NOT NULL DEFAULT '{}',
  "duree_ms" integer,
  "erreur" text,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "termine_le" timestamptz
);

CREATE INDEX "idx_seo_audits_site_id" ON "seo_audits" ("site_id");
CREATE INDEX "idx_seo_audits_cree_le" ON "seo_audits" ("cree_le" DESC);

-- RLS : le propriétaire du site peut tout voir, les autres rien.
ALTER TABLE "seo_audits" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo_audits_select_proprietaire" ON "seo_audits"
  FOR SELECT USING (user_a_acces_site("site_id"));

CREATE POLICY "seo_audits_insert_proprietaire" ON "seo_audits"
  FOR INSERT WITH CHECK (user_a_acces_site("site_id"));

CREATE POLICY "seo_audits_update_proprietaire" ON "seo_audits"
  FOR UPDATE USING (user_a_acces_site("site_id"))
  WITH CHECK (user_a_acces_site("site_id"));

CREATE POLICY "seo_audits_delete_proprietaire" ON "seo_audits"
  FOR DELETE USING (user_a_acces_site("site_id"));
