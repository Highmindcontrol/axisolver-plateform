import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Confirmation email — appelé par Supabase quand l'utilisateur
 * clique sur un lien reçu par email :
 *   · type=recovery  — réinitialisation de mot de passe
 *   · type=signup    — confirmation de création de compte
 *   · type=magiclink — connexion sans mot de passe
 *   · type=invite    — invitation
 *
 * On vérifie l'OTP, puis on redirige vers `next` (par défaut
 * /dashboard). Pour recovery, next = /reinitialiser-mot-de-passe.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      new URL("/connexion?erreur=lien_invalide", url.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "recovery" | "signup" | "magiclink" | "invite" | "email_change" | "email",
  });

  if (error) {
    console.error("[auth/confirm]", error.message);
    return NextResponse.redirect(
      new URL("/connexion?erreur=lien_expire", url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
