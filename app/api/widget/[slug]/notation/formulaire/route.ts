import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { chargerConfigSite } from "@/lib/axi-solver/charger-config-site";
import { verifierOrigine } from "@/lib/axi-solver/verifier-origine";
import { db } from "@/lib/db";
import { siteConfigs, sites } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Proxy AxiSolver → Gaugista pour récupérer le formulaire actif
 * d'une entreprise Gaugista (lecture).
 *
 * Objectif : le widget AxiSolver interroge cette route au moment
 * d'afficher le modal de notation, et récupère la liste des catégories
 * et questions définies dans Gaugista. Chaque question devient une
 * jauge dans l'UI.
 *
 * Transforme la structure Gaugista :
 *   { formulaire: { categories_json: [{ nom, questions: [{ slug, label }] }] } }
 * en liste plate de jauges :
 *   [{ cle, libelle, question }]
 *
 * Préconditions : gaugistaActif = true + gaugistaSlug renseigné.
 * La clé API Gaugista est posée en env serveur (GAUGISTA_API_KEY).
 */

const CORS_BASE: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    // DB inaccessible
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

type JaugeFront = {
  cle: string;
  libelle: string;
  question?: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const origine = req.headers.get("origin");
  const cors = await headersCors(origine, slug);
  const rep = (body: unknown, status: number) =>
    NextResponse.json(body, { status, headers: cors });

  const [config] = await db
    .select({
      gaugistaSlug: siteConfigs.gaugistaSlug,
      gaugistaActif: siteConfigs.gaugistaActif,
    })
    .from(siteConfigs)
    .innerJoin(sites, eq(sites.id, siteConfigs.siteId))
    .where(eq(sites.slug, slug))
    .limit(1);

  if (!config) return rep({ erreur: "site_inconnu" }, 404);
  if (!config.gaugistaActif || !config.gaugistaSlug) {
    return rep({ erreur: "notation_desactivee" }, 403);
  }

  const cleApi = process.env.GAUGISTA_API_KEY;
  if (!cleApi) {
    return rep({ erreur: "config_serveur_manquante" }, 500);
  }
  const urlBase = process.env.GAUGISTA_API_URL ?? "https://gaugista.com";

  try {
    const resp = await fetch(
      `${urlBase}/api/v1/entreprises/${encodeURIComponent(config.gaugistaSlug)}`,
      {
        headers: { Authorization: `Bearer ${cleApi}` },
      },
    );
    if (!resp.ok) {
      return rep(
        { erreur: "gaugista_indisponible", status: resp.status },
        502,
      );
    }
    const data = (await resp.json()) as {
      entreprise?: { nom: string };
      formulaire?: {
        categories_json?: Array<{
          slug: string;
          nom: string;
          questions: Array<{ slug: string; label: string }>;
        }>;
      };
    };

    if (!data.formulaire?.categories_json) {
      return rep({ erreur: "formulaire_absent" }, 404);
    }

    // Transformation : chaque question devient une jauge, préfixée par
    // le nom de la catégorie en texte secondaire pour le contexte.
    const jauges: JaugeFront[] = [];
    for (const cat of data.formulaire.categories_json) {
      for (const q of cat.questions) {
        jauges.push({
          cle: q.slug,
          libelle: q.label,
          question: cat.nom,
        });
      }
    }

    return rep(
      {
        ok: true,
        nomEntreprise: data.entreprise?.nom ?? null,
        jauges,
      },
      200,
    );
  } catch (e) {
    console.error("[gaugista-formulaire] erreur relais", e);
    return rep({ erreur: "erreur_relais" }, 500);
  }
}
