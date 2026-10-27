"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  sites,
  siteConfigs,
  siteOptionsAccueil,
} from "@/lib/db/schema";
import { getSecteur } from "@/lib/axi-solver/catalogue-secteurs";

export type EtatOptions = {
  erreur: string | null;
  ok?: boolean;
};

async function sitePossede(slug: string, userId: string) {
  const [s] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, userId)))
    .limit(1);
  return s ?? null;
}

export async function sauverOptionsAction(
  _prev: EtatOptions,
  formData: FormData,
): Promise<EtatOptions> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { erreur: "slug manquant" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  const site = await sitePossede(slug, user.id);
  if (!site) return { erreur: "Site introuvable." };

  // Récupère toutes les options du formulaire (option_0, option_1, …)
  const libelles: string[] = [];
  for (let i = 0; i < 20; i++) {
    const raw = String(formData.get(`option_${i}`) ?? "").trim();
    if (raw) libelles.push(raw);
  }

  if (libelles.length > 6) {
    return {
      erreur: "6 options maximum (lisibilité de l'ailette gauche).",
    };
  }

  try {
    // Remplace l'ensemble des options par le nouvel ordre
    await db
      .delete(siteOptionsAccueil)
      .where(eq(siteOptionsAccueil.siteId, site.id));
    if (libelles.length > 0) {
      await db.insert(siteOptionsAccueil).values(
        libelles.map((libelle, i) => ({
          siteId: site.id,
          ordre: i,
          libelle,
          actif: true,
        })),
      );
    }
    revalidatePath(`/dashboard/sites/${slug}/options-accueil`);
    revalidatePath(`/embed/${slug}`);
    return { erreur: null, ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[options-accueil]", msg);
    return { erreur: `Erreur à l'enregistrement : ${msg}` };
  }
}

export async function chargerTemplateSecteurAction(
  slug: string,
): Promise<{ erreur: string | null; libelles?: string[] }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non connecté" };

  const site = await sitePossede(slug, user.id);
  if (!site) return { erreur: "Site introuvable" };

  const [config] = await db
    .select({ secteur: siteConfigs.secteur })
    .from(siteConfigs)
    .where(eq(siteConfigs.siteId, site.id))
    .limit(1);

  if (!config?.secteur) {
    return { erreur: "Secteur non défini pour ce site." };
  }
  const secteur = getSecteur(config.secteur);
  if (!secteur) {
    return { erreur: `Secteur "${config.secteur}" introuvable au catalogue.` };
  }
  return { erreur: null, libelles: [...secteur.optionsAccueil] };
}
