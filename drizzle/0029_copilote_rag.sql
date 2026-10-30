-- LOT COPILOTE V2 — Mémoire longue durée (RAG + résumés).
--
-- Enrichit `copilote_messages` d'embeddings pgvector pour permettre
-- à AXI de retrouver sémantiquement n'importe quel détail d'il y a
-- plusieurs mois (« rappelle-toi ce qu'on a dit sur le mot-clé Intel
-- il y a 3 semaines »). Les 60 derniers messages restent envoyés en
-- clair à Claude ; les plus anciens sont repêchés par similarité
-- cosinus sur demande.
--
-- Prérequis : extension `vector` déjà activée (base de connaissances
-- AxiSolver utilise déjà pgvector pour les chunks).
--
-- IDEMPOTENT.

CREATE EXTENSION IF NOT EXISTS vector;

/* ─── Colonne embedding ───────────────────────────────────────── */

ALTER TABLE "copilote_messages"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

/* Index ivfflat pour similarité cosinus — lists=100 adapté à des
   dizaines de milliers de messages. À monter si on dépasse 500k. */
CREATE INDEX IF NOT EXISTS "idx_copilote_messages_embedding"
  ON "copilote_messages"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);

/* ─── RPC : recherche sémantique dans l'historique ────────────── */

CREATE OR REPLACE FUNCTION "copilote_rag_messages_pertinents"(
  p_conversation_id uuid,
  p_user_id uuid,
  p_embedding_requete vector(1536),
  p_limite integer DEFAULT 5,
  p_seuil_similarite float DEFAULT 0.65,
  p_exclure_recents_count integer DEFAULT 60
)
RETURNS TABLE (
  message_id uuid,
  conversation_id uuid,
  role text,
  contenu text,
  cree_le timestamptz,
  similarite float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- On exclut les N derniers messages du fil courant (déjà envoyés
  -- à Claude dans la fenêtre contexte). On cherche dans TOUT
  -- l'historique de l'utilisateur (tous ses fils, tous sites)
  -- pour qu'AXI puisse se souvenir des échanges globaux.
  RETURN QUERY
  WITH exclus AS (
    SELECT m.id
    FROM copilote_messages m
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.cree_le DESC
    LIMIT p_exclure_recents_count
  )
  SELECT
    m.id,
    m.conversation_id,
    m.role,
    m.contenu,
    m.cree_le,
    1 - (m.embedding <=> p_embedding_requete) AS similarite
  FROM copilote_messages m
  JOIN copilote_conversations c ON c.id = m.conversation_id
  WHERE c.user_id = p_user_id
    AND m.embedding IS NOT NULL
    AND m.id NOT IN (SELECT id FROM exclus)
    AND (1 - (m.embedding <=> p_embedding_requete)) >= p_seuil_similarite
  ORDER BY m.embedding <=> p_embedding_requete
  LIMIT p_limite;
END;
$$;
