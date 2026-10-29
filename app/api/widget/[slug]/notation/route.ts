import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { chargerConfigSite } from "@/lib/axi-solver/charger-config-site";
import { verifierOrigine } from "@/lib/axi-solver/verifier-origine";
import { db } from "@/lib/db";
import { siteConfigs, sites } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORS_BASE: Record<string, string> = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

async function headersCors(
  origine: string | null,
  slug: string,
): Promise<Record<string, string>> {
  const h = { ...CORS_BASE };
  if (!origine) return h;
  try {
    const config = await chargerConfigSite(slug);
    if (!config) return h;
    if (verifierOrigine(origine, config).autorise) {
      h["Access-Control-Allow-Origin"] = origine;
      h["Access-Control-Allow-Credentials"] = "true";
    }
  } catch {
    // DB inaccessible — pas de CORS, requête bloquée côté navigateur.
  }
  return h;
}

export async function OPTIONS(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const origine = req.headers.get("origin");
  return new Response(null, { status: 204, headers: await headersCors(origine, slug) });
}

/**
 * Proxy AxiSolver → Gaugista pour la notation fin de conversation.
 *
 * Reçoit du widget :
 *   POST /api/widget/[slug]/notation
 *   { notes: {utile, claire, rapide, recommanderait}, commentaire?,
 *     sourceRef?, sourceUrl? }
 *
 * Relaie vers gaugista.com/api/v1/notations en injectant la clé API
 * serveur (jamais exposée au navigateur) et en y ajoutant les champs
 * de traçabilité source.
 *
 * Préconditions côté site_configs :
 *   - gaugistaActif = true
 *   - gaugistaSlug  = slug de l'entreprise sur gaugista.com
 *
 * Variables d'env :
 *   - GAUGISTA_API_URL  (défaut: https://gaugista.com)
 *   - GAUGISTA_API_KEY  (obligatoire)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const origine = req.headers.get("origin");
  const cors = await headersCors(origine, slug);

  const [config] = await db
    .select({
      siteId: siteConfigs.siteId,
      gaugistaSlug: siteConfigs.gaugistaSlug,
      gaugistaActif: siteConfigs.gaugistaActif,
    })
    .from(siteConfigs)
    .innerJoin(sites, eq(sites.id, siteConfigs.siteId))
    .where(eq(sites.slug, slug))
    .limit(1);

  const rep = (body: unknown, status: number) =>
    NextResponse.json(body, { status, headers: cors });

  if (!config) return rep({ erreur: "site_inconnu" }, 404);
  if (!config.gaugistaActif || !config.gaugistaSlug) {
    return rep({ erreur: "notation_desactivee" }, 403);
  }

  const cleApi = process.env.GAUGISTA_API_KEY;
  if (!cleApi) {
    console.error("[gaugista] GAUGISTA_API_KEY non configurée");
    return rep({ erreur: "config_serveur_manquante" }, 500);
  }
  const urlBase = process.env.GAUGISTA_API_URL ?? "https://gaugista.com";

  const body = (await req.json().catch(() => null)) as {
    notes?: Record<string, number>;
    commentaire?: string;
    sourceRef?: string;
    sourceUrl?: string;
  } | null;

  if (!body?.notes || typeof body.notes !== "object") {
    return rep({ erreur: "notes_requises" }, 400);
  }

  const notesPropres: Record<string, number> = {};
  for (const [cle, val] of Object.entries(body.notes)) {
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0 || n > 10) {
      return rep({ erreur: "note_hors_bornes", cle }, 400);
    }
    notesPropres[cle] = Math.round(n);
  }

  const commentaires: Record<string, string> = {};
  if (body.commentaire?.trim()) {
    commentaires._global = body.commentaire.trim().slice(0, 1000);
  }

  try {
    const resp = await fetch(`${urlBase}/api/v1/notations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cleApi}`,
      },
      body: JSON.stringify({
        entreprise_slug: config.gaugistaSlug,
        notes: notesPropres,
        commentaires,
        source_externe: "axisolver",
        source_ref: body.sourceRef ?? null,
        source_url: body.sourceUrl ?? null,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error(
        "[gaugista] relais échoué",
        resp.status,
        detail.slice(0, 300),
      );
      return rep({ erreur: "gaugista_indisponible", status: resp.status }, 502);
    }

    const data = (await resp.json().catch(() => ({}))) as {
      ok?: boolean;
      notation?: { id: string; note_moyenne: number };
    };

    return rep(
      {
        ok: true,
        notationId: data.notation?.id ?? null,
        noteMoyenne: data.notation?.note_moyenne ?? null,
      },
      200,
    );
  } catch (e) {
    console.error("[gaugista] erreur relais", e);
    return rep({ erreur: "erreur_relais" }, 500);
  }
}
