import type { FindingSecurity } from "./types";

/**
 * Parse les Set-Cookie headers de la réponse HTTP et vérifie que
 * chaque cookie respecte les bonnes pratiques : Secure, HttpOnly,
 * SameSite. Un cookie sans ces attributs est une porte d'entrée
 * classique pour vol de session, XSS, CSRF.
 */
export function analyserCookies(params: {
  headers: Headers;
  estHttps: boolean;
}): FindingSecurity[] {
  const { headers, estHttps } = params;
  const findings: FindingSecurity[] = [];

  // fetch stocke tous les Set-Cookie dans un même header séparé par virgule
  // mais le format virgule est ambigu (expires: Wed, 10 ...). On utilise
  // getSetCookie() si disponible (Node 20+).
  const raw: string[] =
    (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ??
    [];

  if (raw.length === 0) {
    // Beaucoup de pages statiques n'ont pas de cookies — info, pas critique.
    findings.push({
      pilier: "cookies",
      code: "aucun_cookie",
      severite: "info",
      message:
        "Aucun cookie n'a été posé par la page d'accueil. Audit cookies non applicable.",
    });
    return findings;
  }

  for (const ligne of raw) {
    const [parNom, ...attributs] = ligne.split(";").map((s) => s.trim());
    const nomCookie = parNom.split("=")[0];
    const attribsNormalises = attributs.map((a) => a.toLowerCase());

    const estSecure = attribsNormalises.some((a) => a === "secure");
    const estHttpOnly = attribsNormalises.some((a) => a === "httponly");
    const sameSiteAttr = attribsNormalises.find((a) => a.startsWith("samesite="));
    const sameSite = sameSiteAttr?.split("=")[1];

    if (estHttps && !estSecure) {
      findings.push({
        pilier: "cookies",
        code: "cookie_sans_secure",
        severite: "haute",
        message: `Cookie « ${nomCookie} » sans l'attribut Secure. Peut être transmis en clair sur HTTP.`,
        details: { cookie: nomCookie },
      });
    }

    if (!estHttpOnly) {
      findings.push({
        pilier: "cookies",
        code: "cookie_sans_httponly",
        severite: "moyenne",
        message: `Cookie « ${nomCookie} » sans HttpOnly. Lisible par JavaScript — vulnérable à l'XSS.`,
        details: { cookie: nomCookie },
      });
    }

    if (!sameSite) {
      findings.push({
        pilier: "cookies",
        code: "cookie_sans_samesite",
        severite: "moyenne",
        message: `Cookie « ${nomCookie} » sans attribut SameSite. Vulnérable aux attaques CSRF cross-origin.`,
        details: { cookie: nomCookie },
      });
    } else if (sameSite === "none" && !estSecure) {
      findings.push({
        pilier: "cookies",
        code: "cookie_samesite_none_sans_secure",
        severite: "haute",
        message: `Cookie « ${nomCookie} » avec SameSite=None mais sans Secure. Rejeté par les navigateurs modernes.`,
        details: { cookie: nomCookie },
      });
    }
  }

  return findings;
}
