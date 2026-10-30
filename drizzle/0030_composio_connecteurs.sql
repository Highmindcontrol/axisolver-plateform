-- LOT COMPOSIO V1 — Fondations managed connectors.
--
-- Permet à AXI (widget visiteur + copilote admin) d'agir dans les
-- vrais outils SaaS du client (CRM, support, e-commerce, email,
-- agenda) via Composio (composio.dev). Pattern copié de Viktor
-- (viktor.com, 9800+ outils). Décision François 30 oct 2026.
--
-- Deux tables :
--  - composio_connections : une ligne par (user, site, connecteur).
--    OAuth status + scopes + tokens stockés chez Composio (jamais chez
--    nous). On garde juste la référence `composio_connection_id`.
--  - composio_usage_mensuel : metering mensuel par (user, site,
--    connecteur) pour facturation overage + alertes de dépassement.
--
-- IDEMPOTENT.

/* ─── Table composio_connections ─────────────────────────────── */

CREATE TABLE IF NOT EXISTS "composio_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "site_id" uuid REFERENCES "sites"("id") ON DELETE CASCADE,
  "pack_slug" text NOT NULL,
  "connector_slug" text NOT NULL,
  "composio_connection_id" text NOT NULL,
  "oauth_status" text NOT NULL DEFAULT 'pending'
    CHECK ("oauth_status" IN ('pending', 'active', 'revoked', 'expired', 'erreur')),
  "scopes" text[] NOT NULL DEFAULT '{}',
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "connecte_le" timestamptz,
  "expire_le" timestamptz,
  "derniere_erreur" text
);

CREATE INDEX IF NOT EXISTS "idx_composio_connections_user_site"
  ON "composio_connections" ("user_id", "site_id");
CREATE INDEX IF NOT EXISTS "idx_composio_connections_status"
  ON "composio_connections" ("oauth_status");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_composio_connections_user_site_connector"
  ON "composio_connections" ("user_id", COALESCE("site_id", '00000000-0000-0000-0000-000000000000'::uuid), "connector_slug");

/* ─── Table composio_usage_mensuel ───────────────────────────── */

CREATE TABLE IF NOT EXISTS "composio_usage_mensuel" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "site_id" uuid REFERENCES "sites"("id") ON DELETE CASCADE,
  "pack_slug" text NOT NULL,
  "connector_slug" text NOT NULL,
  "bucket_mois" text NOT NULL,
  "nb_tool_calls" integer NOT NULL DEFAULT 0,
  "nb_triggers" integer NOT NULL DEFAULT 0,
  "cout_estime_cents" integer NOT NULL DEFAULT 0,
  "maj_le" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_composio_usage_user_bucket"
  ON "composio_usage_mensuel" ("user_id", "bucket_mois");
CREATE INDEX IF NOT EXISTS "idx_composio_usage_site_bucket"
  ON "composio_usage_mensuel" ("site_id", "bucket_mois");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_composio_usage_bucket"
  ON "composio_usage_mensuel"
  ("user_id", COALESCE("site_id", '00000000-0000-0000-0000-000000000000'::uuid), "pack_slug", "connector_slug", "bucket_mois");

/* ─── RLS ────────────────────────────────────────────────────── */

ALTER TABLE "composio_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "composio_usage_mensuel" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "composio_connections_owner_all" ON "composio_connections";
CREATE POLICY "composio_connections_owner_all"
  ON "composio_connections"
  FOR ALL
  USING ("user_id" = auth.uid())
  WITH CHECK ("user_id" = auth.uid());

DROP POLICY IF EXISTS "composio_usage_owner_read" ON "composio_usage_mensuel";
CREATE POLICY "composio_usage_owner_read"
  ON "composio_usage_mensuel"
  FOR SELECT
  USING ("user_id" = auth.uid());

/* service_role bypass pour les routes serveur */
GRANT ALL ON "composio_connections" TO service_role;
GRANT ALL ON "composio_usage_mensuel" TO service_role;
