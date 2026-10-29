import "server-only";
import type {
  AccesCredentiels,
  AccesParametresPublics,
} from "../acces/types";

/**
 * Pack Wix V1 — stub minimal.
 *
 * Wix est une plateforme extrêmement fermée. Les headers HTTP, cookies,
 * TLS et CSP sont tous gérés par Wix via leur infra, non modifiables
 * par le marchand. L'API publique Wix (Business Solutions SDK) permet
 * uniquement de gérer CMS, membres, produits — pas la sécurité HTTP.
 *
 * Les corrections possibles via l'API Wix :
 *  - Aucune pour les en-têtes HTTP (contrôlés par Wix)
 *  - Modification de contenu de pages (noopener target_blank) via
 *    Pages API, mais limitée
 *  - robots.txt : géré automatiquement par Wix, non éditable
 *  - security.txt : impossible sans custom code (Wix Studio Premium)
 *
 * Pour une vraie remédiation sécurité, un site Wix doit être migré
 * vers une plateforme ouverte (Shopify, WordPress, Next.js…).
 */

export type ResultatRemediationWix = {
  succes: boolean;
  code: string;
  journal: string;
};

export async function appliquerRemediationWix(params: {
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
  code: string;
}): Promise<ResultatRemediationWix> {
  if (
    params.parametresPublics.type !== "wix_api" ||
    params.credentiels.type !== "wix_api"
  ) {
    return {
      succes: false,
      code: params.code,
      journal: "Type d'accès incohérent.",
    };
  }

  return {
    succes: false,
    code: params.code,
    journal:
      "Wix ne permet pas aux marchands de modifier les en-têtes HTTP ni la plupart des contrôles de sécurité au niveau serveur. L'audit AXI reste utile pour détection, mais les corrections nécessitent soit (a) Wix Studio Premium avec Custom Code, soit (b) migration vers une plateforme ouverte.",
  };
}

export async function verifierTokenWix(params: {
  siteId: string;
  apiKey: string;
}): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`https://www.wixapis.com/site-list/v2/sites/${params.siteId}`, {
      headers: {
        Authorization: params.apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "Token Wix refusé. Vérifier la clé API." };
    }
    if (res.status === 404) {
      return { ok: false, message: "Site Wix introuvable avec cet ID." };
    }
    if (!res.ok) {
      return { ok: false, message: `Wix ${res.status} ${res.statusText}` };
    }
    return {
      ok: true,
      message:
        "Connexion Wix OK. Note : Wix a des capacités de remédiation limitées côté serveur.",
    };
  } catch (e) {
    return {
      ok: false,
      message: `Erreur réseau : ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
