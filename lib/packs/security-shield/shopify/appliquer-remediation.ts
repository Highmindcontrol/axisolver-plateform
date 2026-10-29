import "server-only";
import type {
  AccesCredentiels,
  AccesParametresPublics,
} from "../acces/types";
import {
  ecrireAsset,
  lireAsset,
  recupererThemePublie,
} from "./client";

export type ResultatRemediationShopify = {
  succes: boolean;
  code: string;
  journal: string;
};

/**
 * Applique une remédiation sur une boutique Shopify via l'Admin API.
 *
 * Scope réaliste : Shopify ne permet PAS de modifier les en-têtes HTTP
 * (contrôlés par leur CDN). Les remédiations possibles sont limitées
 * à :
 *  - robots.txt (via templates/robots.txt.liquid dans le thème)
 *  - security.txt (via une page custom + redirection depuis le thème)
 *  - noopener target_blank (scan et correction des pages HTML)
 */
export async function appliquerRemediationShopify(params: {
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
  code: string;
  options?: Record<string, unknown>;
}): Promise<ResultatRemediationShopify> {
  if (
    params.parametresPublics.type !== "shopify_admin" ||
    params.credentiels.type !== "shopify_admin"
  ) {
    return {
      succes: false,
      code: params.code,
      journal: "Type d'accès incohérent.",
    };
  }

  const fetchParams = {
    domaineBoutique: params.parametresPublics.domaineBoutique,
    versionApi: params.parametresPublics.versionApi,
    token: params.credentiels.adminApiAccessToken,
  };

  // ─── Codes non applicables à Shopify ────────────────────────────
  const inapplicableShopify: Record<string, string> = {
    hsts_absent:
      "Shopify gère les en-têtes HTTP via son CDN. L'HSTS est activé par défaut sur toutes les boutiques — rien à faire.",
    hsts_max_age_court: "Shopify gère HSTS, pas modifiable côté boutique.",
    hsts_sans_subdomains: "Shopify gère HSTS, pas modifiable.",
    x_frame_options_absent:
      "Shopify définit X-Frame-Options via CDN. Non modifiable côté boutique.",
    x_frame_options_mal_configure: "Shopify gère X-Frame-Options.",
    x_content_type_options_absent:
      "Shopify envoie nosniff par défaut via son CDN. Non modifiable.",
    referrer_policy_absent:
      "Shopify définit la Referrer-Policy via CDN. Non modifiable côté boutique standard.",
    referrer_policy_faible: "Shopify gère Referrer-Policy.",
    permissions_policy_absent:
      "Shopify ne permet pas de configurer Permissions-Policy côté marchand.",
    csp_absent:
      "Shopify définit la CSP via son CDN. Pour une CSP custom il faut passer en Shopify Plus avec Checkout Extensibility.",
    csp_report_only: "CSP contrôlée par Shopify.",
    csp_unsafe_inline: "CSP contrôlée par Shopify.",
    csp_unsafe_eval: "CSP contrôlée par Shopify.",
    server_version_exposee: "Serveurs gérés par Shopify, non applicable.",
    x_powered_by_expose: "Serveurs gérés par Shopify, non applicable.",
    tls_connexion_impossible: "TLS géré automatiquement par Shopify.",
    cert_expire: "Certificats SSL gérés automatiquement par Shopify.",
    cert_expiration_imminente: "SSL auto-renouvelé par Shopify.",
    cert_expiration_proche: "SSL auto-renouvelé par Shopify.",
    san_absent: "SSL géré par Shopify.",
    protocole_tls_obsolete: "TLS 1.2+1.3 par défaut sur Shopify.",
    interfaces_admin_exposees:
      "Shopify héberge l'admin sur son propre domaine sécurisé (/admin). Non applicable.",
    cms_version_exposee: "Shopify ne révèle pas de version CMS. Non applicable.",
    cookie_sans_secure: "Cookies gérés par Shopify, toujours Secure.",
    cookie_sans_httponly: "Cookies Shopify HttpOnly par défaut.",
    cookie_sans_samesite: "Cookies Shopify SameSite par défaut.",
    cookie_samesite_none_sans_secure: "Cookies gérés par Shopify.",
    mixed_content:
      "Shopify force HTTPS sur toutes les ressources. Si mixed content détecté, c'est probablement du contenu embarqué dans une page produit à corriger manuellement.",
    form_action_http: "Les formulaires Shopify sont tous en HTTPS par défaut.",
    iframes_tiers_sans_sandbox:
      "À corriger dans le contenu des pages produit/collection (chantier futur AXI).",
    https_non_force: "Shopify force HTTPS par défaut.",
    redirect_http_vers_http: "Non applicable.",
    http_sert_contenu: "Non applicable.",
    target_blank_sans_noopener:
      "À corriger dans le thème (sections.liquid). Chantier futur — nécessite scan du thème.",
  };

  if (inapplicableShopify[params.code]) {
    return {
      succes: false,
      code: params.code,
      journal: inapplicableShopify[params.code],
    };
  }

  // ─── robots.txt via theme ──────────────────────────────────────
  if (params.code === "robots_txt_absent") {
    const theme = await recupererThemePublie(fetchParams);
    if (!theme) {
      return {
        succes: false,
        code: params.code,
        journal: "Impossible de récupérer le thème publié.",
      };
    }
    const chemin = "templates/robots.txt.liquid";
    try {
      const existant = await lireAsset({ ...fetchParams, themeId: theme.id, cheminAsset: chemin });
      if (existant.existe) {
        return {
          succes: false,
          code: params.code,
          journal:
            "Un robots.txt.liquid custom existe déjà dans le thème. Rien à ajouter.",
        };
      }
    } catch {
      // ignore
    }
    const contenu = `# AXI Security Shield — robots.txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /cart
Disallow: /orders
Disallow: /checkouts/
Disallow: /checkout

{% for group in robots.default_groups %}
{{- group.user_agent }}
{%- for rule in group.rules -%}
{{ rule }}
{%- endfor %}
{%- if group.sitemap != blank %}
{{ group.sitemap }}
{%- endif %}
{% endfor %}
`;
    const ecriture = await ecrireAsset({
      ...fetchParams,
      themeId: theme.id,
      cheminAsset: chemin,
      contenu,
    });
    if (!ecriture.ok) {
      return {
        succes: false,
        code: params.code,
        journal: ecriture.raison,
      };
    }
    return {
      succes: true,
      code: params.code,
      journal: `robots.txt.liquid déposé dans le thème « ${theme.nom} ».`,
    };
  }

  // ─── security.txt via theme asset ──────────────────────────────
  if (params.code === "security_txt_absent") {
    const theme = await recupererThemePublie(fetchParams);
    if (!theme) {
      return {
        succes: false,
        code: params.code,
        journal: "Impossible de récupérer le thème publié.",
      };
    }
    // Shopify ne sert pas /.well-known/ directement. On dépose dans
    // les assets statiques du thème qui seront accessibles via
    // /cdn/shop/t/{theme}/assets/axi-security.txt — pas idéal pour la
    // conformité RFC 9116 mais mieux que rien. Fix idéal : app partenaire.
    const chemin = "assets/axi-security.txt";
    const contact = String(params.options?.contact ?? "security@axisolver.app");
    const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000)
      .toISOString()
      .replace(/\.\d+Z$/, "Z");
    const contenu = `Contact: mailto:${contact}
Expires: ${expires}
Preferred-Languages: fr, en
`;
    const ecriture = await ecrireAsset({
      ...fetchParams,
      themeId: theme.id,
      cheminAsset: chemin,
      contenu,
    });
    if (!ecriture.ok) {
      return {
        succes: false,
        code: params.code,
        journal: ecriture.raison,
      };
    }
    return {
      succes: true,
      code: params.code,
      journal: `axi-security.txt déposé dans assets. Note : Shopify ne sert pas /.well-known/ en natif — pour une conformité RFC 9116 complète, nécessite une app partenaire.`,
    };
  }

  return {
    succes: false,
    code: params.code,
    journal: `Remédiation « ${params.code} » pas prise en charge pour Shopify V1.`,
  };
}
