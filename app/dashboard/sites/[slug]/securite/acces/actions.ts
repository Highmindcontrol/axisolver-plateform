"use server";

import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import {
  creerAcces,
  supprimerAcces,
  testerConnexion,
  marquerConnexion,
  recupererCredentiels,
  type AccesCredentiels,
  type AccesParametresPublics,
} from "@/lib/packs/security-shield";

export type EtatAjoutAcces = {
  erreur: string | null;
  succes: boolean;
  message?: string;
};

/**
 * Ajoute un accès WordPress REST API pour un site. V1 : seul type
 * supporté dans l'UI. Les autres types (SSH, FTP, Cloudflare…) viendront
 * progressivement.
 */
export async function ajouterAccesWordpressAction(
  _prev: EtatAjoutAcces,
  formData: FormData,
): Promise<EtatAjoutAcces> {
  const slug = String(formData.get("slug") ?? "").trim();
  const libelle = String(formData.get("libelle") ?? "")
    .trim()
    .slice(0, 100);
  const urlSite = String(formData.get("urlSite") ?? "")
    .trim()
    .replace(/\/$/, "");
  const user = String(formData.get("user") ?? "").trim();
  const applicationPassword = String(
    formData.get("applicationPassword") ?? "",
  ).trim();

  if (!slug) return { erreur: "slug manquant", succes: false };
  if (!libelle || !urlSite || !user || !applicationPassword) {
    return {
      erreur: "Tous les champs sont obligatoires.",
      succes: false,
    };
  }
  if (!/^https?:\/\//.test(urlSite)) {
    return {
      erreur: "L'URL doit commencer par https:// (ou http://).",
      succes: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: userConnecte },
  } = await supabase.auth.getUser();
  if (!userConnecte)
    return { erreur: "Vous devez être connecté.", succes: false };

  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(
      and(eq(sites.slug, slug), await filtreSitesAccessibles(userConnecte.id)),
    )
    .limit(1);
  if (!site) return { erreur: "Site introuvable.", succes: false };

  const parametresPublics: AccesParametresPublics = {
    type: "wordpress_rest",
    urlSite,
    user,
  };
  const credentiels: AccesCredentiels = {
    type: "wordpress_rest",
    applicationPassword,
  };

  // Teste la connexion avant d'enregistrer
  const test = await testerConnexion({ parametresPublics, credentiels });
  if (!test.ok) {
    return {
      erreur: `Test de connexion échoué : ${test.message}`,
      succes: false,
    };
  }

  try {
    const { id } = await creerAcces({
      siteId: site.id,
      type: "wordpress_rest",
      libelle,
      parametresPublics,
      credentiels,
      creeParUserId: userConnecte.id,
    });
    await marquerConnexion({
      accesId: id,
      siteId: site.id,
      ok: true,
      erreur: null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("SECURITY_SHIELD_ENCRYPTION_KEY")) {
      return {
        erreur:
          "Clé de chiffrement manquante côté serveur (SECURITY_SHIELD_ENCRYPTION_KEY). Configure la variable d'environnement Vercel.",
        succes: false,
      };
    }
    if (
      msg.includes("relation") &&
      msg.includes("site_acces_securite") &&
      msg.includes("does not exist")
    ) {
      return {
        erreur:
          "Migration 0021 pas encore appliquée en prod — applique le SQL puis réessaie.",
        succes: false,
      };
    }
    return { erreur: `Impossible d'enregistrer : ${msg}`, succes: false };
  }

  revalidatePath(`/dashboard/sites/${slug}/securite/acces`);
  revalidatePath(`/dashboard/sites/${slug}/securite`);
  return {
    erreur: null,
    succes: true,
    message: test.message,
  };
}

/**
 * Ajoute un accès GitHub Repo (pour sites Next.js / Astro / statiques
 * hébergés via GitHub+Vercel).
 */
export async function ajouterAccesGithubAction(
  _prev: EtatAjoutAcces,
  formData: FormData,
): Promise<EtatAjoutAcces> {
  const slug = String(formData.get("slug") ?? "").trim();
  const libelle = String(formData.get("libelle") ?? "")
    .trim()
    .slice(0, 100);
  const proprietaire = String(formData.get("proprietaire") ?? "").trim();
  const repo = String(formData.get("repo") ?? "").trim();
  const branche = String(formData.get("branche") ?? "main").trim() || "main";
  const modeCommit =
    (String(formData.get("modeCommit") ?? "push_direct").trim() as
      | "push_direct"
      | "pull_request") ?? "push_direct";
  const personalAccessToken = String(
    formData.get("personalAccessToken") ?? "",
  ).trim();

  if (!slug) return { erreur: "slug manquant", succes: false };
  if (!libelle || !proprietaire || !repo || !personalAccessToken) {
    return {
      erreur: "Tous les champs sont obligatoires.",
      succes: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: userConnecte },
  } = await supabase.auth.getUser();
  if (!userConnecte)
    return { erreur: "Vous devez être connecté.", succes: false };

  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(
      and(eq(sites.slug, slug), await filtreSitesAccessibles(userConnecte.id)),
    )
    .limit(1);
  if (!site) return { erreur: "Site introuvable.", succes: false };

  const parametresPublics: AccesParametresPublics = {
    type: "github_repo",
    proprietaire,
    repo,
    branche,
    modeCommit,
  };
  const credentiels: AccesCredentiels = {
    type: "github_repo",
    personalAccessToken,
  };

  const test = await testerConnexion({ parametresPublics, credentiels });
  if (!test.ok) {
    return {
      erreur: `Test de connexion échoué : ${test.message}`,
      succes: false,
    };
  }

  try {
    const { id } = await creerAcces({
      siteId: site.id,
      type: "github_repo",
      libelle,
      parametresPublics,
      credentiels,
      creeParUserId: userConnecte.id,
    });
    await marquerConnexion({
      accesId: id,
      siteId: site.id,
      ok: true,
      erreur: null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("SECURITY_SHIELD_ENCRYPTION_KEY")) {
      return {
        erreur:
          "Clé de chiffrement manquante côté serveur (SECURITY_SHIELD_ENCRYPTION_KEY).",
        succes: false,
      };
    }
    if (
      msg.includes("invalid input value for enum") &&
      msg.includes("github_repo")
    ) {
      return {
        erreur:
          "Migration 0022 pas encore appliquée en prod — applique le SQL puis réessaie.",
        succes: false,
      };
    }
    return { erreur: `Impossible d'enregistrer : ${msg}`, succes: false };
  }

  revalidatePath(`/dashboard/sites/${slug}/securite/acces`);
  revalidatePath(`/dashboard/sites/${slug}/securite`);
  return {
    erreur: null,
    succes: true,
    message: test.message,
  };
}

export type EtatSuppressionAcces = {
  erreur: string | null;
  succes: boolean;
};

export async function supprimerAccesAction(
  _prev: EtatSuppressionAcces,
  formData: FormData,
): Promise<EtatSuppressionAcces> {
  const slug = String(formData.get("slug") ?? "").trim();
  const accesId = String(formData.get("accesId") ?? "").trim();
  if (!slug || !accesId)
    return { erreur: "paramètres manquants", succes: false };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté.", succes: false };

  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable.", succes: false };

  await supprimerAcces(accesId, site.id);

  revalidatePath(`/dashboard/sites/${slug}/securite/acces`);
  return { erreur: null, succes: true };
}

export type EtatTestConnexion = {
  erreur: string | null;
  succes: boolean;
  message?: string;
};

export async function testerAccesExistantAction(
  _prev: EtatTestConnexion,
  formData: FormData,
): Promise<EtatTestConnexion> {
  const slug = String(formData.get("slug") ?? "").trim();
  const accesId = String(formData.get("accesId") ?? "").trim();
  if (!slug || !accesId)
    return { erreur: "paramètres manquants", succes: false };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté.", succes: false };

  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable.", succes: false };

  const creds = await recupererCredentiels(accesId, site.id);
  if (!creds)
    return { erreur: "Accès introuvable.", succes: false };

  // Récupérer les paramètres publics via la DB
  const { listerAcces } = await import("@/lib/packs/security-shield");
  const liste = await listerAcces(site.id);
  const acces = liste.find((a) => a.id === accesId);
  if (!acces) return { erreur: "Accès introuvable.", succes: false };

  const test = await testerConnexion({
    parametresPublics: acces.parametresPublics,
    credentiels: creds,
  });
  await marquerConnexion({
    accesId,
    siteId: site.id,
    ok: test.ok,
    erreur: test.ok ? null : test.message,
  });

  revalidatePath(`/dashboard/sites/${slug}/securite/acces`);
  return {
    erreur: test.ok ? null : test.message,
    succes: test.ok,
    message: test.message,
  };
}
