-- LOT K — Facturation Stripe AxiSolver.
-- Table des abonnements Stripe (1 user = 1 abonnement actif) + usage
-- metering conversations pour enforcement des quotas par plan.
--
-- IDEMPOTENT : peut être relancé plusieurs fois sans erreur. Ignore
-- ce qui est déjà en place.

/* ─── Users : stripe_customer_id ─────────────────────────────────── */

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;
  END IF;
END $$;

/* ─── Enums ──────────────────────────────────────────────────────── */

DO $$ BEGIN
  CREATE TYPE "plan_abonnement" AS ENUM ('starter', 'pro', 'business');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "statut_abonnement" AS ENUM (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'incomplete',
    'incomplete_expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

/* ─── Abonnements Stripe ────────────────────────────────────────── */

CREATE TABLE IF NOT EXISTS "stripe_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "stripe_customer_id" text NOT NULL,
  "stripe_subscription_id" text NOT NULL UNIQUE,
  "stripe_price_id" text NOT NULL,
  "plan" "plan_abonnement" NOT NULL,
  "statut" "statut_abonnement" NOT NULL,
  "periode_fin_le" timestamptz,
  "annule_fin_de_periode" boolean NOT NULL DEFAULT false,
  "essai_fin_le" timestamptz,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "maj_le" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_stripe_subscriptions_user_id"
  ON "stripe_subscriptions" ("user_id");

ALTER TABLE "stripe_subscriptions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stripe_subscriptions_select_own" ON "stripe_subscriptions";
CREATE POLICY "stripe_subscriptions_select_own" ON "stripe_subscriptions"
  FOR SELECT USING (auth.uid() = "user_id");

-- Les écritures sont faites par le webhook Stripe en service_role
-- (bypass RLS). Pas de policies INSERT/UPDATE/DELETE côté user.

/* ─── Usage conversations (metering mensuel) ────────────────────── */

CREATE TABLE IF NOT EXISTS "usage_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bucket_mois" text NOT NULL,
  "nb_conversations" integer NOT NULL DEFAULT 0,
  "nb_messages" integer NOT NULL DEFAULT 0,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "maj_le" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_usage_conversations_user_bucket"
  ON "usage_conversations" ("user_id", "bucket_mois");
CREATE INDEX IF NOT EXISTS "idx_usage_conversations_site_bucket"
  ON "usage_conversations" ("site_id", "bucket_mois");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_usage_conversations_site_mois"
  ON "usage_conversations" ("site_id", "bucket_mois");

ALTER TABLE "usage_conversations" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usage_conversations_select_proprietaire"
  ON "usage_conversations";
CREATE POLICY "usage_conversations_select_proprietaire" ON "usage_conversations"
  FOR SELECT USING (user_a_acces_site("site_id"));

-- Écritures via service_role dans /api/chat (bypass RLS).
