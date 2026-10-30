import { NextResponse } from "next/server";

import {
  lireFilParId,
  lireHistoriqueComplet,
  majTitreFil,
} from "@/lib/services/copilote-memoire";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/chat/fil/[id]
 *
 * Charge l'historique complet d'un fil spécifique (après vérif
 * ownership). Utilisé par le journal pour basculer sur une
 * conversation passée.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erreur: "non_authentifie" }, { status: 401 });
  }

  const fil = await lireFilParId(id, user.id);
  if (!fil) {
    return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  }

  const messages = await lireHistoriqueComplet(fil.id);
  return NextResponse.json({
    filId: fil.id,
    titre: fil.titre,
    siteSlug: fil.siteSlug,
    creeLe: fil.creeLe.toISOString(),
    derniereActiviteLe: fil.derniereActiviteLe.toISOString(),
    messages: messages.map((m) => ({
      id: m.id,
      role:
        m.role === "assistant"
          ? "axi"
          : m.role === "system"
            ? "systeme"
            : "visiteur",
      contenu: m.contenu,
      horodatage: m.creeLe.toISOString(),
    })),
  });
}

/**
 * PATCH /api/dashboard/chat/fil/[id]
 *
 * Renomme un fil. Body : { titre: string }.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erreur: "non_authentifie" }, { status: 401 });
  }

  let body: { titre?: string } = {};
  try {
    body = (await req.json()) as { titre?: string };
  } catch {
    return NextResponse.json({ erreur: "body_invalide" }, { status: 400 });
  }
  const titre = typeof body.titre === "string" ? body.titre : "";
  if (!titre.trim()) {
    return NextResponse.json({ erreur: "titre_vide" }, { status: 400 });
  }

  const ok = await majTitreFil(id, user.id, titre);
  if (!ok) {
    return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, titre: titre.trim().slice(0, 200) });
}
