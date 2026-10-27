import "server-only";

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sites,
  siteConfigs,
  siteOptionsAccueil,
  type BrandingConfig,
} from "@/lib/db/schema";

/**
 * Charge la config complète d'un site AxiSolver à partir de son slug.
 *
 * Lecture optimisée : on récupère sites + site_configs + options en
 * 2 requêtes au lieu d'un gros JOIN (DB plus lisible pour debugger).
 *
 * Retourne `null` si le site n'existe pas ou n'est pas actif. Dans
 * ce cas, la route /api/chat retombe sur le prompt vitrine legacy
 * d'axisolver.app pour ne pas casser l'app actuelle.
 */

export type ConfigSiteChargee = {
  siteId: string;
  slug: string;
  nomEntreprise: string;
  domainePrincipal: string;
  domainesAutorises: string[];
  plan: string;
  proprieteVerifiee: boolean;

  config: {
    nomAssistant: string;
    secteur: string | null;
    ton: string;
    modePrompt: "vitrine_axisolver" | "au_service_du_site_hote" | string;
    languesActives: string[];
    langueDefaut: string;
    voixMode: "texte_seul" | "navigateur" | "premium_elevenlabs" | string;
    voixId: string | null;
    branding: BrandingConfig;
    mentionsLegalesUrl: string | null;
    politiqueConfUrl: string | null;
  };

  optionsAccueil: Array<{ id: string; libelle: string }>;
};

export async function chargerConfigSite(
  slug: string,
): Promise<ConfigSiteChargee | null> {
  const [siteRow] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), eq(sites.actif, true)))
    .limit(1);

  if (!siteRow) return null;

  const [configRow] = await db
    .select()
    .from(siteConfigs)
    .where(eq(siteConfigs.siteId, siteRow.id))
    .limit(1);

  if (!configRow) return null;

  const options = await db
    .select()
    .from(siteOptionsAccueil)
    .where(
      and(
        eq(siteOptionsAccueil.siteId, siteRow.id),
        eq(siteOptionsAccueil.actif, true),
      ),
    )
    .orderBy(siteOptionsAccueil.ordre);

  return {
    siteId: siteRow.id,
    slug: siteRow.slug,
    nomEntreprise: siteRow.nomEntreprise,
    domainePrincipal: siteRow.domainePrincipal,
    domainesAutorises: siteRow.domainesAutorises,
    plan: siteRow.plan,
    proprieteVerifiee: siteRow.proprieteVerifieeLe !== null,
    config: {
      nomAssistant: configRow.nomAssistant,
      secteur: configRow.secteur,
      ton: configRow.ton,
      modePrompt: configRow.modePrompt,
      languesActives: configRow.languesActives,
      langueDefaut: configRow.langueDefaut,
      voixMode: configRow.voixMode,
      voixId: configRow.voixId,
      branding: configRow.branding,
      mentionsLegalesUrl: configRow.mentionsLegalesUrl,
      politiqueConfUrl: configRow.politiqueConfUrl,
    },
    optionsAccueil: options.map((o) => ({ id: o.id, libelle: o.libelle })),
  };
}
