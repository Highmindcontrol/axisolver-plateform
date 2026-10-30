import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { composioConnections } from "@/lib/db/schema";
import { revoquerConnexion } from "@/lib/services/composio/connexions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/dashboard/composio/connexions/[id]
 *
 * Révoque une connexion Composio : appel API Composio pour couper
 * côté tiers + passage de la ligne locale en status 'revoked'.
 */
export async function DELETE(
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

  // Vérifie que la connexion appartient bien à l'utilisateur
  const [fil] = await db
    .select({ userId: composioConnections.userId })
    .from(composioConnections)
    .where(eq(composioConnections.id, id))
    .limit(1);
  if (!fil || fil.userId !== user.id) {
    return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  }

  await revoquerConnexion(id);
  return NextResponse.json({ ok: true });
}
