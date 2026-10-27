-- ─────────────────────────────────────────────────────────────────
-- AxiSolver — post-init Supabase (triggers, extensions, RLS)
--
-- À appliquer MANUELLEMENT dans le SQL Editor Supabase APRÈS la
-- migration `0000_init_multi_tenant.sql`. Drizzle ne gère ni les
-- extensions, ni les triggers sur `auth.*`, ni les policies RLS.
--
-- Ordre à respecter :
--   1. Appliquer 0000_init_multi_tenant.sql (via drizzle-kit push)
--   2. Appliquer CE fichier dans le SQL Editor Supabase
--
-- Idempotent — safe à ré-exécuter.
-- ─────────────────────────────────────────────────────────────────

-- ─── Extensions ───
-- pgvector préparé pour LOT B (embeddings base de connaissances)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Trigger : copie auth.users → public.users ───
-- Chaque nouvel utilisateur créé via Supabase Auth (OAuth ou email)
-- déclenche l'insertion d'une shadow row dans public.users, pour
-- permettre les FK depuis sites.owner_user_id et site_membres.user_id.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, nom_affiche, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nom_affiche = COALESCE(public.users.nom_affiche, EXCLUDED.nom_affiche),
    avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url),
    maj_le = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ─── RLS — Row Level Security ───
-- Activée partout. Policy owner-only + membres.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_options_accueil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_connaissance_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_membres ENABLE ROW LEVEL SECURITY;

-- Helper function : l'utilisateur a-t-il accès au site ?
CREATE OR REPLACE FUNCTION public.user_a_acces_site(p_site_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sites
    WHERE id = p_site_id AND owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.site_membres
    WHERE site_id = p_site_id AND user_id = auth.uid()
  );
$$;

-- Users : chacun ne voit que sa propre row
DROP POLICY IF EXISTS "users_select_self" ON public.users;
CREATE POLICY "users_select_self" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "users_update_self" ON public.users;
CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Sites : owner + membres
DROP POLICY IF EXISTS "sites_select_owner_ou_membre" ON public.sites;
CREATE POLICY "sites_select_owner_ou_membre" ON public.sites
  FOR SELECT USING (
    owner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.site_membres
      WHERE site_id = sites.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "sites_insert_owner" ON public.sites;
CREATE POLICY "sites_insert_owner" ON public.sites
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "sites_update_owner" ON public.sites;
CREATE POLICY "sites_update_owner" ON public.sites
  FOR UPDATE USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "sites_delete_owner" ON public.sites;
CREATE POLICY "sites_delete_owner" ON public.sites
  FOR DELETE USING (owner_user_id = auth.uid());

-- Site configs : tout accès via user_a_acces_site
DROP POLICY IF EXISTS "site_configs_tout" ON public.site_configs;
CREATE POLICY "site_configs_tout" ON public.site_configs
  FOR ALL USING (public.user_a_acces_site(site_id))
  WITH CHECK (public.user_a_acces_site(site_id));

DROP POLICY IF EXISTS "site_options_accueil_tout" ON public.site_options_accueil;
CREATE POLICY "site_options_accueil_tout" ON public.site_options_accueil
  FOR ALL USING (public.user_a_acces_site(site_id))
  WITH CHECK (public.user_a_acces_site(site_id));

DROP POLICY IF EXISTS "site_connaissance_sources_tout" ON public.site_connaissance_sources;
CREATE POLICY "site_connaissance_sources_tout" ON public.site_connaissance_sources
  FOR ALL USING (public.user_a_acces_site(site_id))
  WITH CHECK (public.user_a_acces_site(site_id));

-- Membres : visible aux membres du site
DROP POLICY IF EXISTS "site_membres_tout" ON public.site_membres;
CREATE POLICY "site_membres_tout" ON public.site_membres
  FOR ALL USING (public.user_a_acces_site(site_id))
  WITH CHECK (public.user_a_acces_site(site_id));
