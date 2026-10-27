"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase côté navigateur — clé anon, RLS appliquée.
 * À utiliser dans les composants client (formulaires auth, OAuth).
 *
 * Vérification des env vars faite dans la fonction au lieu du
 * module-level pour que le build Next ne crashe pas si les env
 * vars ne sont pas encore configurées côté Vercel.
 */
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
