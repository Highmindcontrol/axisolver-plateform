"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, siteConfigs, siteOptionsAccueil } from "@/lib/db/schema";
import { getSecteur } from "@/lib/axi-solver/catalogue-secteurs";

/**
 * Server action de création d'un nouveau site AxiSolver.
 *
 * Crée en une transaction logique :
 *   · la ligne sites (owner_user_id = user authentifié)
 *   · la ligne site_configs par défaut (secteur, ton suggéré)
 *   · les options d'accueil templatées pour le secteur choisi
 *
 * Redirect vers /dashboard/sites/{slug} après succès.
 */

export type EtatCreationSite = {
  erreur: string | null;
};

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/;
const DOMAINE_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

function slugDepuisDomaine(domaine: string): string {
  return domaine
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.[a-z]{2,}$/i, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
const PICTO_REGEX = /^[a-z0-9-]{1,32}$/;

export async function creerSiteAction(
  _prev: EtatCreationSite,
  formData: FormData,
): Promise<EtatCreationSite> {
  const nomEntreprise = String(formData.get("nomEntreprise") ?? "").trim();
  const domainePrincipal = String(formData.get("domainePrincipal") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const slugDemande = String(formData.get("slug") ?? "").trim().toLowerCase();
  const secteurSlug = String(formData.get("secteur") ?? "").trim();
  const couleurBrute = String(formData.get("couleur") ?? "").trim();
  const pictoBrut = String(formData.get("picto") ?? "").trim();

  const couleur = HEX_REGEX.test(couleurBrute) ? couleurBrute : "#4f46e5";
  const picto = PICTO_REGEX.test(pictoBrut) ? pictoBrut : "globe";

  if (!nomEntreprise || nomEntreprise.length < 2) {
    return { erreur: "Nom de l'entreprise requis (2 caractères minimum)." };
  }
  if (!domainePrincipal || !DOMAINE_REGEX.test(domainePrincipal)) {
    return {
      erreur:
        "Domaine principal invalide (ex. monsite.com, sans http:// ni chemin).",
    };
  }
  const slug = slugDemande || slugDepuisDomaine(domainePrincipal);
  if (!SLUG_REGEX.test(slug)) {
    return {
      erreur:
        "Slug invalide (lettres minuscules, chiffres, tirets, 4-50 caractères).",
    };
  }

  const secteur = getSecteur(secteurSlug);
  if (!secteur) {
    return { erreur: "Secteur invalide. Choisissez-en un dans la liste." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  // Création en séquence (Drizzle ne wrap pas naturellement en transaction
  // avec le pool postgres-js, mais chaque insert est idempotent via ON CONFLICT)
  try {
    const [siteCree] = await db
      .insert(sites)
      .values({
        slug,
        ownerUserId: user.id,
        nomEntreprise,
        domainePrincipal,
        domainesAutorises: [domainePrincipal, `www.${domainePrincipal}`],
        plan: "beta",
        actif: true,
      })
      .returning();

    await db.insert(siteConfigs).values({
      siteId: siteCree.id,
      nomAssistant: "AXI",
      secteur: secteur.slug,
      ton: secteur.ton,
      modePrompt: "au_service_du_site_hote",
      languesActives: ["fr"],
      langueDefaut: "fr",
      voixMode: "texte_seul",
      branding: {
        couleurPrincipale: couleur,
        couleurSecondaire: "#8b5cf6",
        logoUrl: null,
        position: "bas-droite",
        afficherPropulsePar: true,
        picto,
      },
    });

    // Insert les options d'accueil templatées
    const optionsRows = secteur.optionsAccueil.map((libelle, i) => ({
      siteId: siteCree.id,
      ordre: i,
      libelle,
      actif: true,
    }));
    if (optionsRows.length > 0) {
      await db.insert(siteOptionsAccueil).values(optionsRows);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("sites_slug_unique")) {
      return {
        erreur: `Le slug "${slug}" est déjà utilisé. Choisissez-en un autre.`,
      };
    }
    console.error("[creer-site]", msg);
    return {
      erreur: `Erreur à la création du site : ${msg}`,
    };
  }

  redirect(`/dashboard/sites/${slug}`);
}
