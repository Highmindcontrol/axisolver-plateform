import { NextResponse } from "next/server";

import {
  chargerOuCreerFil,
  lireHistoriqueComplet,
} from "@/lib/services/copilote-memoire";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/chat/fil?siteSlug=...
 *
 * Charge l'historique complet du fil copilote de l'admin pour un
 * site donné (ou le fil global si siteSlug absent/vide). Appelé par
 * le composant client au mount pour reconstituer la conversation
 * exactement là où on l'avait laissée.
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

  const fil = await chargerOuCreerFil(user.id, siteSlug);
  const messages = await lireHistoriqueComplet(fil.id);

  return NextResponse.json({
    filId: fil.id,
    titre: fil.titre,
    siteSlug: fil.siteSlug,
    creeLe: fil.creeLe.toISOString(),
    derniereActiviteLe: fil.derniereActiviteLe.toISOString(),
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role === "assistant" ? "axi" : m.role === "system" ? "systeme" : "visiteur",
      contenu: m.contenu,
      horodatage: m.creeLe.toISOString(),
    })),
  });
}
