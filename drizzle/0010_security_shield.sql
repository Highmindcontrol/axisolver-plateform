-- LOT I — AxiSolver Shield : audits sécurité, incidents, monitoring, rate limiting.
-- Chaque site actif est audité 1× par mois, monitoré toutes les 6h,
-- et son widget /api/chat est protégé par rate limiting + anti prompt injection.

/* ─── Audits sécurité ───────────────────────────────────────────── */

CREATE TYPE "audit_security_statut" AS ENUM ('en_cours', 'termine', 'echec');
CREATE TYPE "audit_security_declencheur" AS ENUM (
  'manuel',
  'auto_mensuel',
  'api',
  'monitoring'
);

CREATE TABLE "security_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "url_auditee" text NOT NULL,
  "declencheur" "audit_security_declencheur" NOT NULL DEFAULT 'manuel',
  "statut" "audit_security_statut" NOT NULL DEFAULT 'en_cours',
  "score_global" integer,
  "score_headers" integer,
  "score_tls" integer,
  "score_exposition" integer,
  "score_cookies" integer,
  "score_contenu" integer,
  "score_reputation" integer,
  "findings" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "recommandations" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "certificat_ssl_expiree_le" timestamptz,
  "duree_ms" integer,
  "erreur" text,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "termine_le" timestamptz
);

CREATE INDEX "idx_security_audits_site_id" ON "security_audits" ("site_id");
CREATE INDEX "idx_security_audits_cree_le" ON "security_audits" ("cree_le" DESC);

ALTER TABLE "security_audits" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_audits_select_proprietaire" ON "security_audits"
  FOR SELECT USING (user_a_acces_site("site_id"));

CREATE POLICY "security_audits_insert_proprietaire" ON "security_audits"
  FOR INSERT WITH CHECK (user_a_acces_site("site_id"));

CREATE POLICY "security_audits_update_proprietaire" ON "security_audits"
  FOR UPDATE USING (user_a_acces_site("site_id"))
  WITH CHECK (user_a_acces_site("site_id"));

CREATE POLICY "security_audits_delete_proprietaire" ON "security_audits"
  FOR DELETE USING (user_a_acces_site("site_id"));

/* ─── Incidents sécurité ────────────────────────────────────────── */

CREATE TYPE "incident_security_type" AS ENUM (
  'ssl_expiration_proche',
  'ssl_expiree',
  'site_indisponible',
  'hash_html_change',
  'noindex_apparu',
  'redirection_suspecte',
  'cert_invalide'
);
CREATE TYPE "incident_security_statut" AS ENUM ('ouvert', 'resolu', 'ignore');
CREATE TYPE "incident_security_severite" AS ENUM (
  'critique',
  'haute',
  'moyenne',
  'basse'
);

CREATE TABLE "security_incidents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "type" "incident_security_type" NOT NULL,
  "severite" "incident_security_severite" NOT NULL,
  "statut" "incident_security_statut" NOT NULL DEFAULT 'ouvert',
  "message" text NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb,
  "detecte_le" timestamptz NOT NULL DEFAULT now(),
  "resolu_le" timestamptz,
  "notifie_le" timestamptz
);

CREATE INDEX "idx_security_incidents_site_id" ON "security_incidents" ("site_id");
CREATE INDEX "idx_security_incidents_statut" ON "security_incidents" ("statut");
CREATE INDEX "idx_security_incidents_detecte_le" ON "security_incidents" ("detecte_le" DESC);

ALTER TABLE "security_incidents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_incidents_select_proprietaire" ON "security_incidents"
  FOR SELECT USING (user_a_acces_site("site_id"));

CREATE POLICY "security_incidents_insert_proprietaire" ON "security_incidents"
  FOR INSERT WITH CHECK (user_a_acces_site("site_id"));

CREATE POLICY "security_incidents_update_proprietaire" ON "security_incidents"
  FOR UPDATE USING (user_a_acces_site("site_id"))
  WITH CHECK (user_a_acces_site("site_id"));

CREATE POLICY "security_incidents_delete_proprietaire" ON "security_incidents"
  FOR DELETE USING (user_a_acces_site("site_id"));

/* ─── Monitoring périodique (snapshots) ─────────────────────────── */

CREATE TABLE "security_monitorings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "status_http" integer,
  "hash_html" text,
  "certificat_expiree_le" timestamptz,
  "certificat_emetteur" text,
  "temps_reponse_ms" integer,
  "erreur" text,
  "mesure_le" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "idx_security_monitorings_site_id" ON "security_monitorings" ("site_id");
CREATE INDEX "idx_security_monitorings_mesure_le" ON "security_monitorings" ("mesure_le" DESC);

ALTER TABLE "security_monitorings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_monitorings_select_proprietaire" ON "security_monitorings"
  FOR SELECT USING (user_a_acces_site("site_id"));

-- Les monitorings sont écrits par le cron en service_role (bypass RLS).
-- Pas de policies INSERT/UPDATE/DELETE côté propriétaire : lecture seule.

/* ─── Rate limiting /api/chat (shield widget) ───────────────────── */

CREATE TABLE "rate_limits_chat" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "visiteur_cle" text NOT NULL,
  "bucket_minute" text NOT NULL,
  "bucket_jour" text NOT NULL,
  "nb_msgs_minute" integer NOT NULL DEFAULT 0,
  "nb_msgs_jour" integer NOT NULL DEFAULT 0,
  "bloque_jusqua" timestamptz,
  "derniere_activite_le" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "idx_rate_limits_chat_site_visiteur" ON "rate_limits_chat" ("site_id", "visiteur_cle");
CREATE INDEX "idx_rate_limits_chat_bucket_jour" ON "rate_limits_chat" ("bucket_jour");

-- Table purement serveur, pas de RLS visiteur : lecture bloquée par défaut.
ALTER TABLE "rate_limits_chat" ENABLE ROW LEVEL SECURITY;
