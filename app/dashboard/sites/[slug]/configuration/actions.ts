"use server";

import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, siteConfigs, type BrandingConfig } from "@/lib/db/schema";

export type EtatConfiguration = {
  erreur: string | null;
  ok?: boolean;
};

const TONS_VALIDES = new Set([
  "professionnel_chaleureux",
  "institutionnel",
  "convivial",
  "expert",
]);
const VOIX_MODES_VALIDES = new Set([
  "texte_seul",
  "navigateur",
  "premium_elevenlabs",
]);
const LANGUES_VALIDES = new Set([
  "fr",
  "en",
  "es",
  "de",
  "it",
  "pt",
  "nl",
  "ar",
]);

function nettoyerDomaines(brut: string): string[] {
  return brut
    .split(/[\n,]/g)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && /^[a-z0-9.-]+$/i.test(s));
}

export async function sauverConfigurationAction(
  _prev: EtatConfiguration,
  formData: FormData,
): Promise<EtatConfiguration> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { erreur: "slug manquant" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable." };

  const nomAssistant = String(formData.get("nomAssistant") ?? "").trim();
  const ton = String(formData.get("ton") ?? "").trim();
  const voixMode = String(formData.get("voixMode") ?? "").trim();
  const voixId = String(formData.get("voixId") ?? "").trim();
  const langueDefaut = String(formData.get("langueDefaut") ?? "").trim();
  const languesActives = formData.getAll("languesActives").map(String);
  const couleurPrincipale = String(formData.get("couleurPrincipale") ?? "").trim();
  const couleurSecondaire = String(formData.get("couleurSecondaire") ?? "").trim();
  const afficherPropulsePar = formData.get("afficherPropulsePar") === "on";
  const domainesAutorisesBrut = String(
    formData.get("domainesAutorises") ?? "",
  );
  const domainesAutorises = nettoyerDomaines(domainesAutorisesBrut);

  if (!nomAssistant || nomAssistant.length < 1 || nomAssistant.length > 40) {
    return { erreur: "Nom de l'assistant invalide (1-40 caractères)." };
  }
  if (!TONS_VALIDES.has(ton)) {
    return { erreur: "Ton invalide." };
  }
  if (!VOIX_MODES_VALIDES.has(voixMode)) {
    return { erreur: "Mode voix invalide." };
  }
  if (!LANGUES_VALIDES.has(langueDefaut)) {
    return { erreur: "Langue par défaut invalide." };
  }
  const languesFiltrees = languesActives
    .map((l) => l.toLowerCase())
    .filter((l) => LANGUES_VALIDES.has(l));
  if (languesFiltrees.length === 0) {
    return { erreur: "Au moins une langue active requise." };
  }
  if (!languesFiltrees.includes(langueDefaut)) {
    return {
      erreur:
        "La langue par défaut doit faire partie des langues actives.",
    };
  }
  if (!/^#[0-9a-f]{6}$/i.test(couleurPrincipale)) {
    return { erreur: "Couleur principale invalide (format #RRGGBB)." };
  }
  if (!/^#[0-9a-f]{6}$/i.test(couleurSecondaire)) {
    return { erreur: "Couleur secondaire invalide (format #RRGGBB)." };
  }
  if (domainesAutorises.length === 0) {
    return {
      erreur:
        "Au moins un domaine autorisé requis (sinon le widget ne pourra être installé nulle part).",
    };
  }

  const branding: BrandingConfig = {
    couleurPrincipale,
    couleurSecondaire,
    logoUrl: null,
    position: "bas-droite",
    afficherPropulsePar,
  };

  const maintenant = new Date();

  try {
    await db
      .update(siteConfigs)
      .set({
        nomAssistant,
        ton,
        voixMode: voixMode as "texte_seul" | "navigateur" | "premium_elevenlabs",
        voixId: voixId || null,
        langueDefaut,
        languesActives: languesFiltrees,
        branding,
        majLe: maintenant,
      })
      .where(eq(siteConfigs.siteId, site.id));

    await db
      .update(sites)
      .set({
        domainesAutorises,
        majLe: maintenant,
      })
      .where(eq(sites.id, site.id));

    revalidatePath(`/dashboard/sites/${slug}`);
    revalidatePath(`/dashboard/sites/${slug}/configuration`);
    revalidatePath(`/embed/${slug}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[configuration]", msg);
    return { erreur: `Erreur à l'enregistrement : ${msg}` };
  }

  return { erreur: null, ok: true };
}

export type EtatGaugista = {
  erreur: string | null;
  ok?: boolean;
};

/**
 * Enregistre la configuration Gaugista du site (slug entreprise +
 * flag d'activation). Le POST sur gaugista.com se fait côté serveur
 * uniquement, via GAUGISTA_API_KEY (jamais exposée au navigateur).
 */
export async function enregistrerGaugistaAction(
  _prev: EtatGaugista,
  formData: FormData,
): Promise<EtatGaugista> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { erreur: "slug manquant" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable." };

  const gaugistaSlugBrut = String(formData.get("gaugistaSlug") ?? "").trim();
  const gaugistaActif = formData.get("gaugistaActif") === "on";

  // Nettoyage du slug : minuscules + tirets autorisés uniquement.
  const gaugistaSlug = gaugistaSlugBrut.toLowerCase().replace(/\s+/g, "-");
  if (gaugistaSlug && !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(gaugistaSlug)) {
    return {
      erreur:
        "Slug Gaugista invalide (lettres minuscules, chiffres, tirets ; ex: axisolver-demo).",
    };
  }
  if (gaugistaActif && !gaugistaSlug) {
    return {
      erreur:
        "Pour activer la notation, renseigne d'abord le slug de l'entreprise Gaugista.",
    };
  }

  try {
    await db
      .update(siteConfigs)
      .set({
        gaugistaSlug: gaugistaSlug || null,
        gaugistaActif,
        majLe: new Date(),
      })
      .where(eq(siteConfigs.siteId, site.id));
    revalidatePath(`/dashboard/sites/${slug}/configuration`);
    revalidatePath(`/embed/${slug}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[configuration-gaugista]", msg);
    return { erreur: `Erreur à l'enregistrement : ${msg}` };
  }

  return { erreur: null, ok: true };
}
