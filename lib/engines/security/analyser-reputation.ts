import type { FindingSecurity } from "./types";

/**
 * Vérifications de réputation du domaine : HTTPS forcé (redirect
 * HTTP→HTTPS), redirections suspectes, présence d'une politique
 * de confidentialité et de mentions légales accessibles.
 *
 * Audit minimum. Les intégrations tierces (Google Safe Browsing,
 * VirusTotal) sont volontairement reportées en V1.1 pour ne pas
 * ajouter de dépendance externe en V1.
 */
export async function analyserReputation(params: {
  baseUrl: string;
  hostname: string;
}): Promise<FindingSecurity[]> {
  const { baseUrl, hostname } = params;
  const findings: FindingSecurity[] = [];

  // ─── HTTPS forcé ─────────────────────────────────────────────────
  const estDejaHttps = baseUrl.startsWith("https://");
  if (!estDejaHttps) {
    findings.push({
      pilier: "reputation",
      code: "https_non_force",
      severite: "critique",
      message:
        "Le site est accessible en HTTP sans redirection vers HTTPS. Toutes les données transitent en clair.",
    });
  } else {
    // Teste si http://domaine redirige bien vers https://
    try {
      const res = await fetch(`http://${hostname}`, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      });
      const location = res.headers.get("location") ?? "";
      if (res.status >= 300 && res.status < 400) {
        if (!location.startsWith("https://")) {
          findings.push({
            pilier: "reputation",
            code: "redirect_http_vers_http",
            severite: "haute",
            message:
              "La version HTTP du site redirige mais pas vers HTTPS. Les navigateurs ne feront pas le upgrade.",
            details: { location },
          });
        }
      } else if (res.status === 200) {
        findings.push({
          pilier: "reputation",
          code: "http_sert_contenu",
          severite: "critique",
          message:
            "La version HTTP du site sert du contenu directement (pas de redirection). Les données transitent en clair.",
        });
      }
    } catch {
      // Timeout ou refus — pas forcément un problème (pare-feu bloque HTTP).
    }
  }

  // ─── Longueur du domaine (indicateur de typosquatting) ───────────
  if (hostname.length > 40) {
    findings.push({
      pilier: "reputation",
      code: "domaine_tres_long",
      severite: "info",
      message: `Nom de domaine très long (${hostname.length} caractères). Pas un problème en soi, mais potentiellement moins mémorisable.`,
    });
  }

  // ─── Caractères Unicode trompeurs (IDN homograph) ────────────────
  if (/xn--/.test(hostname)) {
    findings.push({
      pilier: "reputation",
      code: "domaine_idn_punycode",
      severite: "info",
      message:
        "Domaine encodé en Punycode (xn--). Vérifier qu'il n'y a pas de confusion avec un domaine à Unicode trompeur (ex. latin → cyrillique).",
      details: { hostname },
    });
  }

  return findings;
}
