import { analyserConsentement } from "./analyser-consentement";
import { analyserRemarketing } from "./analyser-remarketing";
import { analyserTrackers } from "./analyser-trackers";
import { analyserVisibiliteSerp } from "./analyser-visibilite-serp";
import { construireRecommandations } from "./recommandations";
import { calculerScores } from "./scoring";
import type { FindingAds, ResultatAuditAds } from "./types";

/**
 * Audit publicité / Ads complet d'une URL :
 *   - détection des trackers (analytics, publicité, remarketing, CMP)
 *   - vérification du consentement RGPD + Google Consent Mode v2
 *   - visibilité sur les annonces sponsorisées Google (via Serper)
 *   - évaluation de l'infrastructure remarketing
 *
 * Durée typique 10-20 secondes.
 */
export async function auditerSite(params: {
  url: string;
  motsCles: string[];
}): Promise<ResultatAuditAds> {
  const debut = Date.now();
  const urlNormalisee = normaliserUrl(params.url);

  let hostname = "";
  try {
    hostname = new URL(urlNormalisee).hostname.replace(/^www\./, "");
  } catch {
    return construireResultatEchec(urlNormalisee, debut, "URL invalide.");
  }

  let findings: FindingAds[] = [];
  let html = "";

  // ─── Fetch de la page ────────────────────────────────────────────
  try {
    const res = await fetch(urlNormalisee, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "AxiSolver-Ads-Bot/1.0 (+https://axisolver.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      findings.push({
        pilier: "trackers",
        code: "fetch_http_erreur",
        severite: "critique",
        message: `Le serveur a répondu HTTP ${res.status}. Audit impossible.`,
        details: { status: res.status },
      });
    } else {
      html = await res.text();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    findings.push({
      pilier: "trackers",
      code: "fetch_impossible",
      severite: "critique",
      message: `Impossible de récupérer la page : ${msg}`,
    });
  }

  // ─── Analyses (en parallèle quand possible) ─────────────────────
  const trackersResultat = html
    ? analyserTrackers({ html })
    : { trackers: [], findings: [] };

  const [visibiliteResultat] = await Promise.all([
    params.motsCles.length > 0
      ? analyserVisibiliteSerp({ motsCles: params.motsCles, hostname })
      : Promise.resolve({ annonces: [], findings: [] as FindingAds[] }),
  ]);

  findings = [...findings, ...trackersResultat.findings];

  if (html) {
    findings.push(
      ...analyserConsentement({
        html,
        url: urlNormalisee,
        trackers: trackersResultat.trackers,
      }),
    );
    findings.push(
      ...analyserRemarketing({
        html,
        trackers: trackersResultat.trackers,
      }),
    );
  }

  findings.push(...visibiliteResultat.findings);

  const { scores, scoreGlobal } = calculerScores(findings);
  const recommandations = construireRecommandations(findings);

  return {
    urlAuditee: urlNormalisee,
    motsClesTestes: params.motsCles,
    dureeMs: Date.now() - debut,
    scoreGlobal,
    scores,
    trackersDetectes: trackersResultat.trackers,
    annoncesConcurrentes: visibiliteResultat.annonces,
    findings,
    recommandations,
  };
}

function construireResultatEchec(
  url: string,
  debut: number,
  message: string,
): ResultatAuditAds {
  return {
    urlAuditee: url,
    motsClesTestes: [],
    dureeMs: Date.now() - debut,
    scoreGlobal: 0,
    scores: { trackers: 0, consentement: 0, visibilite: 0, remarketing: 0 },
    trackersDetectes: [],
    annoncesConcurrentes: [],
    findings: [
      {
        pilier: "trackers",
        code: "audit_impossible",
        severite: "critique",
        message,
      },
    ],
    recommandations: [],
  };
}

function normaliserUrl(url: string): string {
  const t = url.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}
