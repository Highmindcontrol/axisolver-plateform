-- LOT COPILOTE — Mémoire persistante AXI dans l'admin AxiSolver.
--
-- Pattern repris d'AxiHub (`admin_ia_conversations` / `admin_ia_messages`
-- / trigger `touch_conversation_activite`) et adapté à AxiSolver :
--
--   · Un fil par (user_id, site_slug nullable). Un admin peut avoir
--     plusieurs sites, et donc plusieurs fils distincts qui
--     coexistent (un fil par site + un fil global si aucun site
--     courant).
--   · Granularité : UN message = UNE ligne (jamais JSONB), condition
--     obligatoire pour audit, embeddings futurs (RAG V2) et longévité.
--   · Historique brut persisté intégralement, SANS tronquage, SANS
--     TTL. Promesse : « AXI se souvient depuis le premier jour,
--     dans les moindres détails. »
--   · Trigger auto-maj `derniere_activite_le` à chaque message pour
--     retrouver le fil courant au mount du composant.
--   · RLS stricte : chaque admin ne voit que SES propres fils.
--
-- IDEMPOTENT.

/* ─── Table fils de conversation ──────────────────────────────── */

CREATE TABLE IF NOT EXISTS "copilote_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "site_slug" text,
  "titre" text NOT NULL DEFAULT 'Nouvelle conversation',
  "memoire_longue" text,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "derniere_activite_le" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_copilote_conv_user_site_activite"
  ON "copilote_conversations" ("user_id", "site_slug", "derniere_activite_le" DESC);

/* ─── Table messages (1 par ligne) ────────────────────────────── */

CREATE TABLE IF NOT EXISTS "copilote_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL REFERENCES "copilote_conversations"("id") ON DELETE CASCADE,
  "role" text NOT NULL CHECK ("role" IN ('user', 'assistant', 'system')),
  "contenu" text NOT NULL,
  "tokens_input" integer NOT NULL DEFAULT 0,
  "tokens_output" integer NOT NULL DEFAULT 0,
  "cree_le" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_copilote_messages_conversation"
  ON "copilote_messages" ("conversation_id", "cree_le");

/* ─── RLS ─────────────────────────────────────────────────────── */

ALTER TABLE "copilote_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "copilote_messages" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "copilote_conv_owner_all" ON "copilote_conversations";
CREATE POLICY "copilote_conv_owner_all"
  ON "copilote_conversations"
  FOR ALL
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

DROP POLICY IF EXISTS "copilote_messages_via_conv" ON "copilote_messages";
CREATE POLICY "copilote_messages_via_conv"
  ON "copilote_messages"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "copilote_conversations" c
      WHERE c."id" = "copilote_messages"."conversation_id"
        AND c."user_id" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "copilote_conversations" c
      WHERE c."id" = "copilote_messages"."conversation_id"
        AND c."user_id" = auth.uid()
    )
  );

/* ─── Trigger touch derniere_activite_le ──────────────────────── */

CREATE OR REPLACE FUNCTION "touch_copilote_conversation_activite"()
RETURNS trigger AS $$
BEGIN
  UPDATE "copilote_conversations"
  SET "derniere_activite_le" = now()
  WHERE "id" = NEW."conversation_id";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS "trg_touch_copilote_conv_activite" ON "copilote_messages";
CREATE TRIGGER "trg_touch_copilote_conv_activite"
  AFTER INSERT ON "copilote_messages"
  FOR EACH ROW
  EXECUTE FUNCTION "touch_copilote_conversation_activite"();
