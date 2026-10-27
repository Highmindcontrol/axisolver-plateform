import { analyserContenu } from "./analyser-contenu";
import { analyserCookies } from "./analyser-cookies";
import { analyserExposition } from "./analyser-exposition";
import { analyserHeaders } from "./analyser-headers";
import { analyserReputation } from "./analyser-reputation";
import { analyserTls } from "./analyser-tls";
import { construireRecommandations } from "./recommandations";
import { calculerScores } from "./scoring";
import type { FindingSecurity, ResultatAuditSecurity } from "./types";

/**
 * Audit sécurité complet d'un site : 6 piliers analysés en parallèle
 * (headers, TLS, exposition, cookies, contenu, réputation), scoring
 * pondéré, recommandations priorisées avec upsell AXI Shield.
 *
 * Durée typique 15-30 secondes selon la vitesse du site cible.
 */
export async function auditerSite(params: {
  url: string;
}): Promise<ResultatAuditSecurity> {
  const debut = Date.now();
  const urlNormalisee = normaliserUrl(params.url);

  let hostname = "";
  try {
    hostname = new URL(urlNormalisee).hostname;
  } catch {
    return construireResultatEchec(urlNormalisee, debut, "URL invalide.");
  }

  let findings: FindingSecurity[] = [];

  // ─── Fetch principal ─────────────────────────────────────────────
  let res: Response | null = null;
  let html = "";
  let urlFinale = urlNormalisee;

  try {
    res = await fetch(urlNormalisee, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "AxiSolver-Security-Bot/1.0 (+https://axisolver.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });
    urlFinale = res.url || urlNormalisee;

    if (!res.ok && res.status !== 403) {
      findings.push({
        pilier: "reputation",
        code: "http_erreur",
        severite: "critique",
        message: `Le serveur a répondu HTTP ${res.status}. Site inaccessible publiquement.`,
        details: { status: res.status },
      });
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      html = await res.text();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    findings.push({
      pilier: "reputation",
      code: "fetch_impossible",
      severite: "critique",
      message: `Impossible de récupérer la page : ${msg}`,
    });
  }

  // ─── Analyses parallèles ─────────────────────────────────────────
  const estHttps = urlFinale.startsWith("https://");
  const baseUrl = (() => {
    try {
      const u = new URL(urlFinale);
      return `${u.protocol}//${u.host}`;
    } catch {
      return urlNormalisee;
    }
  })();

  const [resultatTls, findingsExposition, findingsReputation] = await Promise.all([
    estHttps ? analyserTls(hostname) : Promise.resolve({ findings: [], expireeLe: null, emetteur: null }),
    analyserExposition({ baseUrl }),
    analyserReputation({ baseUrl, hostname }),
  ]);

  findings = [...findings, ...resultatTls.findings, ...findingsExposition, ...findingsReputation];

  if (res) {
    findings.push(...analyserHeaders({ headers: res.headers, urlFinale }));
    findings.push(...analyserCookies({ headers: res.headers, estHttps }));
  }

  if (html) {
    findings.push(...analyserContenu({ html, url: urlFinale }));
  }

  const { scores, scoreGlobal } = calculerScores(findings);
  const recommandations = construireRecommandations(findings);

  return {
    urlAuditee: urlFinale,
    dureeMs: Date.now() - debut,
    scoreGlobal,
    scores,
    findings,
    recommandations,
    certificatSslExpireeLe: resultatTls.expireeLe,
  };
}

function construireResultatEchec(
  url: string,
  debut: number,
  message: string,
): ResultatAuditSecurity {
  return {
    urlAuditee: url,
    dureeMs: Date.now() - debut,
    scoreGlobal: 0,
    scores: {
      headers: 0,
      tls: 0,
      exposition: 0,
      cookies: 0,
      contenu: 0,
      reputation: 0,
    },
    findings: [
      {
        pilier: "reputation",
        code: "audit_impossible",
        severite: "critique",
        message,
      },
    ],
    recommandations: [],
    certificatSslExpireeLe: null,
  };
}

function normaliserUrl(url: string): string {
  const t = url.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}
