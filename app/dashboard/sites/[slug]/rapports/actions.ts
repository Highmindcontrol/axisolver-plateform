"use server";

import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { siteRapportDestinataires, sites } from "@/lib/db/schema";
import { envoyerRapportQuotidien } from "@/lib/axi-solver/rapport/envoyer";

export type EtatEnvoiManuel = {
  erreur: string | null;
  ok?: boolean;
  destinataire?: string;
};

export type EtatAjoutDestinataire = {
  erreur: string | null;
  succes: boolean;
};

export type EtatRetraitDestinataire = {
  erreur: string | null;
  succes: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function renvoyerRapportMaintenantAction(
  _prev: EtatEnvoiManuel,
  formData: FormData,
): Promise<EtatEnvoiManuel> {
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

  const resultat = await envoyerRapportQuotidien({ siteId: site.id });
  if (resultat.ok) {
    return { erreur: null, ok: true, destinataire: resultat.destinataire };
  }
  return { erreur: resultat.raison };
}

/**
 * Ajoute un destinataire supplémentaire au rapport quotidien du site.
 */
export async function ajouterDestinataireRapportAction(
  _prev: EtatAjoutDestinataire,
  formData: FormData,
): Promise<EtatAjoutDestinataire> {
  const slug = String(formData.get("slug") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 160);
  const prenom = String(formData.get("prenom") ?? "")
    .trim()
    .slice(0, 60);

  if (!EMAIL_REGEX.test(email)) {
    return { erreur: "Adresse email invalide.", succes: false };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié.", succes: false };

  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable.", succes: false };

  try {
    await db
      .insert(siteRapportDestinataires)
      .values({
        siteId: site.id,
        email,
        prenom: prenom || null,
        ajouteParUserId: user.id,
      })
      .onConflictDoNothing();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("relation") &&
      msg.includes("site_rapport_destinataires") &&
      msg.includes("does not exist")
    ) {
      return {
        erreur:
          "Fonctionnalité pas encore activée en production (migration à appliquer).",
        succes: false,
      };
    }
    return { erreur: `Impossible d'enregistrer : ${msg}`, succes: false };
  }

  revalidatePath(`/dashboard/sites/${slug}/rapports`);
  return { erreur: null, succes: true };
}

/**
 * Retire un destinataire supplémentaire. L'admin principal du site
 * reste toujours destinataire par défaut (il n'est pas listé ici).
 */
export async function retirerDestinataireRapportAction(
  _prev: EtatRetraitDestinataire,
  formData: FormData,
): Promise<EtatRetraitDestinataire> {
  const slug = String(formData.get("slug") ?? "").trim();
  const destinataireId = String(formData.get("destinataireId") ?? "").trim();
  if (!destinataireId) {
    return { erreur: "Destinataire invalide.", succes: false };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié.", succes: false };

  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable.", succes: false };

  try {
    await db
      .delete(siteRapportDestinataires)
      .where(
        and(
          eq(siteRapportDestinataires.id, destinataireId),
          eq(siteRapportDestinataires.siteId, site.id),
        ),
      );
  } catch (e) {
    return {
      erreur: `Impossible de retirer : ${e instanceof Error ? e.message : String(e)}`,
      succes: false,
    };
  }

  revalidatePath(`/dashboard/sites/${slug}/rapports`);
  return { erreur: null, succes: true };
}
