import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { listerConnexions } from "@/lib/services/composio/connexions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/composio/connexions?siteSlug=X
 *
 * Liste les connexions Composio pour (user, site). Si siteSlug est
 * absent, retourne les connexions globales (sans site). Alimente
 * l'UI de la page /dashboard/sites/[slug]/connecteurs.
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

  const fils = await listerConnexions(user.id, siteId);
  return NextResponse.json({
    connexions: fils.map((f) => ({
      id: f.id,
      connectorSlug: f.connectorSlug,
      packSlug: f.packSlug,
      oauthStatus: f.oauthStatus,
      scopes: f.scopes,
      creeLe: f.creeLe.toISOString(),
      connecteLe: f.connecteLe?.toISOString() ?? null,
      expireLe: f.expireLe?.toISOString() ?? null,
      derniereErreur: f.derniereErreur,
    })),
  });
}
