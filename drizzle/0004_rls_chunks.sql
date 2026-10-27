-- ─────────────────────────────────────────────────────────────────
-- RLS sur base_connaissance_chunks + fonction de recherche sémantique
-- Appliquer après 0003_chunks_pgvector.sql
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.base_connaissance_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "base_connaissance_chunks_tout" ON public.base_connaissance_chunks;
CREATE POLICY "base_connaissance_chunks_tout" ON public.base_connaissance_chunks
  FOR ALL USING (public.user_a_acces_site(site_id))
  WITH CHECK (public.user_a_acces_site(site_id));

-- Fonction de recherche sémantique : trouve les N chunks les plus
-- proches d'une requête vectorisée pour un site donné.
-- Appelée côté serveur avec service_role (bypass RLS) pour le tool
-- call /api/chat qui n'a pas forcément de user context.
CREATE OR REPLACE FUNCTION public.chercher_chunks_proches(
  p_site_id uuid,
  p_embedding vector(1536),
  p_limite int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  texte text,
  meta jsonb,
  distance float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.texte,
    c.meta,
    1 - (c.embedding <=> p_embedding) AS distance
  FROM public.base_connaissance_chunks c
  WHERE c.site_id = p_site_id
  ORDER BY c.embedding <=> p_embedding
  LIMIT p_limite;
$$;
