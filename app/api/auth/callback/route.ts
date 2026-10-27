import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Callback OAuth — Supabase renvoie ici après authentification
 * d'un provider externe (Google, LinkedIn, Facebook, Apple).
 *
 * Flow :
 *   1. Provider → Supabase → /api/auth/callback?code=XXX&next=/
 *   2. On échange le code contre une session (cookies posés via
 *      createSupabaseServerClient + exchangeCodeForSession)
 *   3. Le trigger on_auth_user_created copie automatiquement
 *      l'utilisateur dans public.users (pas de bootstrap manuel)
 *   4. Redirect vers next (ou /dashboard par défaut)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/connexion?erreur=code_manquant", url.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error(
      "[auth/callback] exchangeCodeForSession a échoué :",
      error.message,
    );
    return NextResponse.redirect(
      new URL("/connexion?erreur=echange_oauth", url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
