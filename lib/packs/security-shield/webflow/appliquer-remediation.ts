import "server-only";
import type {
  AccesCredentiels,
  AccesParametresPublics,
} from "../acces/types";

/**
 * Pack Webflow V1 — remédiations via Webflow API v2.
 *
 * Webflow permet un peu plus que Wix via le "Custom Code" injecté dans
 * le <head> et le <body> du site. API v2 : https://developers.webflow.com
 * On peut modifier le custom code via le endpoint /sites/{id}/custom_code.
 *
 * Remédiations possibles :
 *  - Via custom code head : rel=noopener, meta tags, redirections JS
 *  - robots.txt : géré par Webflow (Site Settings → SEO), non éditable via API
 *  - security.txt : impossible sans hébergement externe
 *  - Headers HTTP : contrôlés par le CDN Webflow, non modifiables
 *
 * Pour une sécurité HTTP forte, Webflow Pro + Cloudflare en front
 * (chantier futur AXI).
 */

export type ResultatRemediationWebflow = {
  succes: boolean;
  code: string;
  journal: string;
};

export async function appliquerRemediationWebflow(params: {
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
  code: string;
}): Promise<ResultatRemediationWebflow> {
  if (
    params.parametresPublics.type !== "webflow_api" ||
    params.credentiels.type !== "webflow_api"
  ) {
    return {
      succes: false,
      code: params.code,
      journal: "Type d'accès incohérent.",
    };
  }

  // La plupart des findings sont contrôlés par le CDN Webflow
  const inapplicable: Record<string, string> = {
    hsts_absent: "Webflow applique HSTS sur son CDN. Non modifiable.",
    hsts_max_age_court: "HSTS géré par Webflow.",
    hsts_sans_subdomains: "HSTS géré par Webflow.",
    x_frame_options_absent:
      "Headers HTTP contrôlés par le CDN Webflow. Pour les modifier, mettre Cloudflare en front (chantier futur AXI).",
    x_content_type_options_absent: "Headers HTTP contrôlés par Webflow.",
    referrer_policy_absent: "Headers HTTP contrôlés par Webflow.",
    permissions_policy_absent: "Headers HTTP contrôlés par Webflow.",
    csp_absent: "CSP non configurable côté marchand Webflow.",
    tls_connexion_impossible: "TLS géré automatiquement par Webflow.",
    cert_expire: "Certificats SSL auto-renouvelés par Webflow.",
    protocole_tls_obsolete: "TLS 1.2+1.3 par défaut sur Webflow.",
    interfaces_admin_exposees:
      "Webflow Admin est sur webflow.com, non applicable.",
    cms_version_exposee:
      "Webflow ne révèle pas de version CMS. Non applicable.",
    cookie_sans_secure: "Cookies Webflow Secure par défaut.",
    cookie_sans_httponly: "Cookies Webflow HttpOnly par défaut.",
    cookie_sans_samesite: "Cookies Webflow SameSite par défaut.",
    https_non_force: "Webflow force HTTPS par défaut.",
    robots_txt_absent:
      "Le robots.txt Webflow est configurable dans Site Settings → SEO (pas via API).",
  };

  if (inapplicable[params.code]) {
    return {
      succes: false,
      code: params.code,
      journal: inapplicable[params.code],
    };
  }

  return {
    succes: false,
    code: params.code,
    journal:
      "Remédiation Webflow non implémentée en V1. Pour les findings headers, mettre Cloudflare en front est la vraie solution (futur pack Shield Cloudflare).",
  };
}

export async function verifierTokenWebflow(params: {
  siteId: string;
  apiToken: string;
}): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`https://api.webflow.com/v2/sites/${params.siteId}`, {
      headers: {
        Authorization: `Bearer ${params.apiToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 401) {
      return { ok: false, message: "Token Webflow invalide ou expiré." };
    }
    if (res.status === 404) {
      return { ok: false, message: "Site Webflow introuvable." };
    }
    if (!res.ok) {
      return { ok: false, message: `Webflow ${res.status} ${res.statusText}` };
    }
    return {
      ok: true,
      message:
        "Connexion Webflow OK. Note : capacités de remédiation limitées (CDN géré par Webflow).",
    };
  } catch (e) {
    return {
      ok: false,
      message: `Erreur réseau : ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
