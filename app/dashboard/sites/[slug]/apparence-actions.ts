"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { sites, siteConfigs, type BrandingConfig } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EtatModifApparence = {
  erreur: string | null;
  succes: boolean;
};

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
const PICTO_REGEX = /^[a-z0-9-]{1,32}$/;
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/;

/**
 * Met à jour la couleur et le picto d'un site existant dans son
 * siteConfigs.branding. Vérifie ownership (owner_user_id) avant tout.
 */
export async function modifierApparenceAction(
  _prev: EtatModifApparence,
  formData: FormData,
): Promise<EtatModifApparence> {
  const slug = String(formData.get("slug") ?? "").trim();
  const couleurBrute = String(formData.get("couleur") ?? "").trim();
  const pictoBrut = String(formData.get("picto") ?? "").trim();

  if (!SLUG_REGEX.test(slug)) {
    return { erreur: "Site invalide.", succes: false };
  }
  const couleur = HEX_REGEX.test(couleurBrute) ? couleurBrute : null;
  const picto = PICTO_REGEX.test(pictoBrut) ? pictoBrut : null;
  if (!couleur || !picto) {
    return {
      erreur: "Couleur ou picto invalide. Essayez à nouveau.",
      succes: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié.", succes: false };

  const [siteCible] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, user.id)))
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
    couleurPrincipale: couleur,
    couleurSecondaire:
      configActuelle?.branding?.couleurSecondaire ?? "#8b5cf6",
    logoUrl: configActuelle?.branding?.logoUrl ?? null,
    position: configActuelle?.branding?.position ?? "bas-droite",
    afficherPropulsePar:
      configActuelle?.branding?.afficherPropulsePar ?? true,
    picto,
  };

  try {
    await db
      .update(siteConfigs)
      .set({ branding: nouveauBranding, majLe: new Date() })
      .where(eq(siteConfigs.siteId, siteCible.id));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[modifier-apparence]", msg);
    return { erreur: `Impossible d'enregistrer : ${msg}`, succes: false };
  }

  revalidatePath(`/dashboard/sites/${slug}`, "layout");
  revalidatePath("/dashboard", "page");

  return { erreur: null, succes: true };
}
