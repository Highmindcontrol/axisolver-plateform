import { NextResponse } from "next/server";

import { finaliserConnexion } from "@/lib/services/composio/connexions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/composio/oauth/callback?connexionId=X&status=...
 *
 * Point de retour après autorisation Composio. On lit l'état de la
 * connexion côté Composio et on met à jour notre ligne locale, puis
 * on redirige l'admin vers son dashboard de connecteurs avec un flag
 * de résultat.
 */
export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/connexion", req.url));
  }

  const url = new URL(req.url);
  const connexionId = url.searchParams.get("connexionId");
  if (!connexionId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const retour = new URL("/dashboard", req.url);
  try {
    await finaliserConnexion(connexionId);
    retour.searchParams.set("composio", "connecte");
  } catch (e) {
    console.warn("[composio/oauth/callback] finalisation échouée", e);
    retour.searchParams.set("composio", "erreur");
  }
  return NextResponse.redirect(retour);
}
