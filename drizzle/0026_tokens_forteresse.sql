-- LOT SUPER-ADMIN — Tokens API Forteresse Ataraxis.
--
-- La Forteresse Ataraxis (hub central qui centralise tous les sites et
-- activités du groupe) consomme un endpoint JSON exposé par AxiSolver :
-- GET /api/forteresse/snapshot. L'authentification se fait via un
-- Bearer token stocké en hash SHA-256 (on ne garde JAMAIS le token clair
-- en base).
--
-- Chaque token a un nom (ex: "forteresse-prod"), une date de création,
-- une date de dernière utilisation (observabilité), et peut être
-- révoqué (soft delete via révoque_le).
--
-- IDEMPOTENT.

CREATE TABLE IF NOT EXISTS "tokens_api_forteresse" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nom" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "cree_par_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "derniere_utilisation_le" timestamptz,
  "revoque_le" timestamptz
);

CREATE INDEX IF NOT EXISTS "idx_tokens_forteresse_hash"
  ON "tokens_api_forteresse" ("token_hash");

/* ─── RLS : super_admin uniquement ──────────────────────────────── */

ALTER TABLE "tokens_api_forteresse" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tokens_forteresse_super_admin"
  ON "tokens_api_forteresse";
CREATE POLICY "tokens_forteresse_super_admin"
  ON "tokens_api_forteresse"
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
