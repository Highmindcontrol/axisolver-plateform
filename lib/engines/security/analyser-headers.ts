import type { FindingSecurity } from "./types";

/**
 * Analyse les headers HTTP de sécurité d'une réponse. Audit statique
 * basé sur l'OWASP Secure Headers Project (2024) et les
 * recommandations ANSSI R18/R19.
 *
 * Chaque header absent ou mal configuré produit un finding typé.
 */
export function analyserHeaders(params: {
  headers: Headers;
  urlFinale: string;
}): FindingSecurity[] {
  const { headers, urlFinale } = params;
  const findings: FindingSecurity[] = [];

  const estHttps = urlFinale.startsWith("https://");

  // ─── HSTS (uniquement pertinent sur HTTPS) ───────────────────────
  if (estHttps) {
    const hsts = headers.get("strict-transport-security");
    if (!hsts) {
      findings.push({
        pilier: "headers",
        code: "hsts_absent",
        severite: "haute",
        message:
          "Header Strict-Transport-Security (HSTS) absent. Un attaquant peut forcer un downgrade HTTPS → HTTP.",
      });
    } else {
      const maxAge = parseInt(hsts.match(/max-age=(\d+)/)?.[1] ?? "0", 10);
      if (maxAge < 15552000) {
        findings.push({
          pilier: "headers",
          code: "hsts_max_age_court",
          severite: "moyenne",
          message: `HSTS configuré avec max-age=${maxAge}s. L'ANSSI recommande au moins 6 mois (15 552 000 s).`,
          details: { max_age: maxAge },
        });
      }
      if (!hsts.toLowerCase().includes("includesubdomains")) {
        findings.push({
          pilier: "headers",
          code: "hsts_sans_subdomains",
          severite: "basse",
          message:
            "HSTS n'inclut pas includeSubDomains. Les sous-domaines ne sont pas protégés.",
        });
      }
    }
  }

  // ─── Content-Security-Policy ─────────────────────────────────────
  const csp = headers.get("content-security-policy");
  const cspRapport = headers.get("content-security-policy-report-only");
  if (!csp && !cspRapport) {
    findings.push({
      pilier: "headers",
      code: "csp_absent",
      severite: "haute",
      message:
        "Content-Security-Policy absent. Risque élevé d'XSS, injection de scripts tiers et exfiltration de données.",
    });
  } else if (!csp && cspRapport) {
    findings.push({
      pilier: "headers",
      code: "csp_report_only",
      severite: "moyenne",
      message:
        "CSP uniquement en mode report-only. La politique n'est pas appliquée, uniquement observée.",
    });
  } else if (csp) {
    if (csp.includes("unsafe-inline")) {
      findings.push({
        pilier: "headers",
        code: "csp_unsafe_inline",
        severite: "moyenne",
        message:
          "CSP autorise 'unsafe-inline'. Les scripts inline ne sont pas protégés contre les injections.",
      });
    }
    if (csp.includes("unsafe-eval")) {
      findings.push({
        pilier: "headers",
        code: "csp_unsafe_eval",
        severite: "moyenne",
        message:
          "CSP autorise 'unsafe-eval'. L'exécution dynamique de code via eval() est permise.",
      });
    }
  }

  // ─── X-Frame-Options (toujours pertinent, même si CSP frame-ancestors) ─
  const xFrame = headers.get("x-frame-options")?.toLowerCase();
  const frameAncestors = csp?.includes("frame-ancestors");
  if (!xFrame && !frameAncestors) {
    findings.push({
      pilier: "headers",
      code: "x_frame_options_absent",
      severite: "haute",
      message:
        "X-Frame-Options et CSP frame-ancestors absents. Le site est vulnérable au clickjacking.",
    });
  } else if (xFrame && !["deny", "sameorigin"].includes(xFrame)) {
    findings.push({
      pilier: "headers",
      code: "x_frame_options_mal_configure",
      severite: "moyenne",
      message: `X-Frame-Options = « ${xFrame} ». Valeurs recommandées : DENY ou SAMEORIGIN.`,
      details: { valeur: xFrame },
    });
  }

  // ─── X-Content-Type-Options ──────────────────────────────────────
  const xContentType = headers.get("x-content-type-options")?.toLowerCase();
  if (xContentType !== "nosniff") {
    findings.push({
      pilier: "headers",
      code: "x_content_type_options_absent",
      severite: "moyenne",
      message:
        "X-Content-Type-Options: nosniff absent. Le navigateur peut deviner le type MIME d'un fichier et exécuter du JS déguisé.",
    });
  }

  // ─── Referrer-Policy ────────────────────────────────────────────
  const referrerPolicy = headers.get("referrer-policy");
  if (!referrerPolicy) {
    findings.push({
      pilier: "headers",
      code: "referrer_policy_absent",
      severite: "basse",
      message:
        "Referrer-Policy absent. Par défaut, le navigateur transmet l'URL complète aux domaines tiers (fuite potentielle).",
    });
  } else {
    const faibles = ["unsafe-url", "no-referrer-when-downgrade"];
    if (faibles.includes(referrerPolicy.toLowerCase())) {
      findings.push({
        pilier: "headers",
        code: "referrer_policy_faible",
        severite: "basse",
        message: `Referrer-Policy = « ${referrerPolicy} » — faible. Recommandé : strict-origin-when-cross-origin ou plus restrictif.`,
        details: { valeur: referrerPolicy },
      });
    }
  }

  // ─── Permissions-Policy ─────────────────────────────────────────
  const permissionsPolicy = headers.get("permissions-policy");
  if (!permissionsPolicy) {
    findings.push({
      pilier: "headers",
      code: "permissions_policy_absent",
      severite: "basse",
      message:
        "Permissions-Policy absent. Les scripts tiers peuvent accéder sans restriction au micro, caméra, géolocalisation, etc.",
    });
  }

  // ─── Server header ──────────────────────────────────────────────
  const serverHeader = headers.get("server");
  if (serverHeader && /\d/.test(serverHeader)) {
    findings.push({
      pilier: "headers",
      code: "server_version_exposee",
      severite: "moyenne",
      message: `Header Server expose la version précise (${serverHeader}). Un attaquant peut cibler les CVE connus de cette version.`,
      details: { serveur: serverHeader },
    });
  }

  // ─── X-Powered-By ────────────────────────────────────────────────
  const xPoweredBy = headers.get("x-powered-by");
  if (xPoweredBy) {
    findings.push({
      pilier: "headers",
      code: "x_powered_by_expose",
      severite: "moyenne",
      message: `Header X-Powered-By expose la stack technique (${xPoweredBy}). Information inutile côté client, utile aux attaquants.`,
      details: { stack: xPoweredBy },
    });
  }

  return findings;
}
