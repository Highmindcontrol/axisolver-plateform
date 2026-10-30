import { NextResponse } from "next/server";

import { creerNouveauFil } from "@/lib/services/copilote-memoire";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/dashboard/chat/fil/nouveau
 *
 * Crée explicitement un nouveau fil copilote pour (user, site).
 * Body : { siteSlug: string | null }
 *
 * L'ancien fil reste intact en base (jamais supprimé). Celui-ci
 * devient simplement le fil le plus récent et sera chargé au
 * prochain mount (chargerOuCreerFil tri par derniere_activite_le).
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erreur: "non_authentifie" }, { status: 401 });
  }

  let body: { siteSlug?: string | null } = {};
  try {
    body = (await req.json()) as { siteSlug?: string | null };
  } catch {
    // ignore
  }
  const siteSlug =
    typeof body.siteSlug === "string" && body.siteSlug.length > 0
      ? body.siteSlug
      : null;

  const fil = await creerNouveauFil(user.id, siteSlug);

  return NextResponse.json({
    filId: fil.id,
    titre: fil.titre,
    siteSlug: fil.siteSlug,
    creeLe: fil.creeLe.toISOString(),
  });
}
