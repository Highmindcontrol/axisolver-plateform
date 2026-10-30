import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { demarrerConnexion } from "@/lib/services/composio/connexions";
import { trouverConnecteur } from "@/lib/services/composio/catalogue";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/dashboard/composio/oauth/start
 *
 * Démarre un flow OAuth Composio pour connecter un outil tiers
 * (ex: HubSpot) à un site AxiSolver donné. L'admin est redirigé
 * vers Composio qui redirige lui-même vers le provider (HubSpot,
 * Salesforce, …), puis retour callback.
 *
 * Body : { connectorSlug: string, siteSlug: string, packSlug?: string }
 * Retour : { redirectUrl: string, connexionId: string }
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erreur: "non_authentifie" }, { status: 401 });
  }

  type Body = {
    connectorSlug?: string;
    siteSlug?: string;
    packSlug?: string;
  };
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ erreur: "body_invalide" }, { status: 400 });
  }

  const connectorSlug = (body.connectorSlug ?? "").trim();
  const siteSlug = (body.siteSlug ?? "").trim();
  const packSlug = (body.packSlug ?? "default").trim();

  if (!connectorSlug) {
    return NextResponse.json(
      { erreur: "connector_manquant" },
      { status: 400 },
    );
  }
  const connecteur = trouverConnecteur(connectorSlug);
  if (!connecteur || !connecteur.disponible) {
    return NextResponse.json(
      { erreur: "connector_inconnu" },
      { status: 404 },
    );
  }

  // Vérifie l'accès au site (RLS applicatif)
  let siteId: string | null = null;
  if (siteSlug) {
    const [row] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.slug, siteSlug), await filtreSitesAccessibles(user.id)))
      .limit(1);
    if (!row) {
      return NextResponse.json({ erreur: "site_inaccessible" }, { status: 403 });
    }
    siteId = row.id;
  }

  // URL de callback — Composio redirigera ici après autorisation
  const origine = new URL(req.url).origin;
  const redirectUri = `${origine}/api/dashboard/composio/oauth/callback`;

  try {
    const { redirectUrl, connexionId } = await demarrerConnexion({
      userId: user.id,
      siteId,
      packSlug,
      connectorSlug,
      redirectUri,
    });
    return NextResponse.json({ redirectUrl, connexionId });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[composio/oauth/start]", detail);
    return NextResponse.json(
      { erreur: "composio_erreur", message: detail.slice(0, 300) },
      { status: 502 },
    );
  }
}
