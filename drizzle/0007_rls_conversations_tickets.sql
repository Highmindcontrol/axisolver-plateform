-- ─────────────────────────────────────────────────────────────────
-- RLS sur conversations et tickets
-- Appliquer après 0006_conversations_tickets.sql
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_tout" ON public.conversations;
CREATE POLICY "conversations_tout" ON public.conversations
  FOR ALL USING (public.user_a_acces_site(site_id))
  WITH CHECK (public.user_a_acces_site(site_id));

DROP POLICY IF EXISTS "tickets_tout" ON public.tickets;
CREATE POLICY "tickets_tout" ON public.tickets
  FOR ALL USING (public.user_a_acces_site(site_id))
  WITH CHECK (public.user_a_acces_site(site_id));
