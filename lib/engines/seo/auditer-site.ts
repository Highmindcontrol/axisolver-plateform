import { analyserHtml } from "./analyser-html";
import { analyserMotsCles } from "./analyser-mots-cles";
import { construireRecommandations } from "./recommandations";
import { calculerScores } from "./scoring";
import type { FindingSeo, ResultatAuditSeo } from "./types";

/**
 * Audit SEO complet d'une URL : récupère la page, analyse HTML + mobile +
 * performance, vérifie la visibilité sur les mots-clés fournis, calcule
 * les scores par pilier et construit la liste de recommandations
 * actionnables priorisées.
 */
export async function auditerSite(params: {
  url: string;
  motsCles: string[];
}): Promise<ResultatAuditSeo> {
  const debut = Date.now();
  const urlNormalisee = normaliserUrl(params.url);
  const hostname = (() => {
    try {
      return new URL(urlNormalisee).hostname.replace(/^www\./, "");
    } catch {
      return params.url;
    }
  })();

  let findings: FindingSeo[] = [];

  // ─── Récupération de la page ─────────────────────────────────────
  const debutFetch = Date.now();
  let html = "";
  let tailleOctets = 0;
  let tempsReponseMs = 0;

  try {
    const res = await fetch(urlNormalisee, {
      headers: {
        "User-Agent": "AxiSolver-SEO-Bot/1.0 (+https://axisolver.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });
    tempsReponseMs = Date.now() - debutFetch;

    if (!res.ok) {
      findings.push({
        pilier: "technique",
        code: "http_erreur",
        severite: "critique",
        message: `Le serveur a répondu HTTP ${res.status}. La page n'est pas accessible.`,
        details: { status: res.status },
      });
    } else {
      html = await res.text();
      tailleOctets = new TextEncoder().encode(html).length;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    findings.push({
      pilier: "technique",
      code: "fetch_impossible",
      severite: "critique",
      message: `Impossible de récupérer la page : ${msg}`,
    });
  }

  // ─── Analyses parallèles ─────────────────────────────────────────
  const [findingsHtml, findingsMotsCles] = await Promise.all([
    html
      ? Promise.resolve(
          analyserHtml({ html, url: urlNormalisee, tailleOctets, tempsReponseMs }),
        )
      : Promise.resolve([] as FindingSeo[]),
    params.motsCles.length > 0
      ? analyserMotsCles({ motsCles: params.motsCles, hostname })
      : Promise.resolve([] as FindingSeo[]),
  ]);

  findings = [...findings, ...findingsHtml, ...findingsMotsCles];

  const { scores, scoreGlobal } = calculerScores(findings);
  const recommandations = construireRecommandations(findings);

  return {
    urlAuditee: urlNormalisee,
    motsClesTestes: params.motsCles,
    dureeMs: Date.now() - debut,
    scoreGlobal,
    scores,
    findings,
    recommandations,
  };
}

function normaliserUrl(url: string): string {
  const t = url.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}
