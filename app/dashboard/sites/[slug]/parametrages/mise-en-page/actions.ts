"use server";

import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { sites, siteConfigs, type BrandingConfig } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CATALOGUE_ARCHETYPES,
  type ArchetypeLayoutSlug,
} from "@/lib/axi-solver/archetypes-layout";

export type EtatMiseEnPage = {
  erreur: string | null;
  succes: boolean;
};

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/;
const SLUGS_ARCHETYPES = CATALOGUE_ARCHETYPES.map((a) => a.slug);

/**
 * Change l'archétype de mise en page du widget pour un site existant.
 * Stocké dans siteConfigs.branding.archetypeLayout. Vérifie ownership.
 */
export async function modifierMiseEnPageAction(
  _prev: EtatMiseEnPage,
  formData: FormData,
): Promise<EtatMiseEnPage> {
  const slug = String(formData.get("slug") ?? "").trim();
  const archetypeBrut = String(formData.get("archetype") ?? "").trim();

  if (!SLUG_REGEX.test(slug)) {
    return { erreur: "Site invalide.", succes: false };
  }
  if (!SLUGS_ARCHETYPES.includes(archetypeBrut as ArchetypeLayoutSlug)) {
    return { erreur: "Archétype invalide.", succes: false };
  }
  const archetype = archetypeBrut as ArchetypeLayoutSlug;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié.", succes: false };

  const [siteCible] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!siteCible) {
    return { erreur: "Site introuvable.", succes: false };
  }

  const [configActuelle] = await db
    .select({ branding: siteConfigs.branding })
    .from(siteConfigs)
    .where(eq(siteConfigs.siteId, siteCible.id))
    .limit(1);

  const nouveauBranding: BrandingConfig = {
    couleurPrincipale:
      configActuelle?.branding?.couleurPrincipale ?? "#4f46e5",
    couleurSecondaire:
      configActuelle?.branding?.couleurSecondaire ?? "#8b5cf6",
    logoUrl: configActuelle?.branding?.logoUrl ?? null,
    position: configActuelle?.branding?.position ?? "bas-droite",
    afficherPropulsePar:
      configActuelle?.branding?.afficherPropulsePar ?? true,
    picto: configActuelle?.branding?.picto ?? "globe",
    archetypeLayout: archetype,
  };

  try {
    await db
      .update(siteConfigs)
      .set({ branding: nouveauBranding, majLe: new Date() })
      .where(eq(siteConfigs.siteId, siteCible.id));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[modifier-mise-en-page]", msg);
    return { erreur: `Impossible d'enregistrer : ${msg}`, succes: false };
  }

  revalidatePath(`/dashboard/sites/${slug}`, "layout");
  revalidatePath(`/embed/${slug}`);

  return { erreur: null, succes: true };
}
