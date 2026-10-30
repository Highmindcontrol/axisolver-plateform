import { NextResponse } from "next/server";

import { lireFilsParSite } from "@/lib/services/copilote-memoire";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/chat/fils?siteSlug=X
 *
 * Liste les fils copilote d'un user, filtrés par site (null = fil
 * global). Enrichi avec nb messages + premier message user pour
 * affichage dans le journal des conversations.
 */
export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erreur: "non_authentifie" }, { status: 401 });
  }

  const url = new URL(req.url);
  const siteSlug = url.searchParams.get("siteSlug")?.trim() || null;

  try {
    const fils = await lireFilsParSite(user.id, siteSlug);
    return NextResponse.json({
      fils: fils.map((f) => ({
        id: f.id,
        titre: f.titre,
        siteSlug: f.siteSlug,
        creeLe: f.creeLe.toISOString(),
        derniereActiviteLe: f.derniereActiviteLe.toISOString(),
        nbMessages: f.nbMessages,
        premierMessage: f.premierMessage,
      })),
    });
  } catch (e) {
    console.error("[dashboard/chat/fils] erreur", e);
    return NextResponse.json({ fils: [] }, { status: 200 });
  }
}
