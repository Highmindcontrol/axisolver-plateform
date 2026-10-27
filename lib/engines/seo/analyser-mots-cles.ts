import type { FindingSeo } from "./types";

/**
 * Vérifie la visibilité d'un site sur une liste de requêtes via Serper
 * (API Google Search). Retourne des findings sur le pilier « mots_cles ».
 *
 * Position null = site hors du top 20.
 */
export async function analyserMotsCles(params: {
  motsCles: string[];
  hostname: string;
}): Promise<FindingSeo[]> {
  const { motsCles, hostname } = params;
  const cle = process.env.SERPER_API_KEY;
  if (!cle) {
    return [
      {
        pilier: "mots_cles",
        code: "serper_absent",
        severite: "info",
        message:
          "Clé SERPER_API_KEY absente — l'audit mots-clés n'a pas pu être exécuté.",
      },
    ];
  }

  const findings: FindingSeo[] = [];

  const resultats = await Promise.all(
    motsCles.slice(0, 5).map((req) => chercherSerper(req, hostname, cle)),
  );

  for (const r of resultats) {
    if (!r) continue;
    if (r.position === null) {
      findings.push({
        pilier: "mots_cles",
        code: "non_classe",
        severite: "haute",
        message: `Site non trouvé dans les 20 premiers résultats pour « ${r.requete} ».`,
        details: { requete: r.requete, position: null, top3: r.top3 },
      });
    } else if (r.position > 10) {
      findings.push({
        pilier: "mots_cles",
        code: "en_page_2",
        severite: "moyenne",
        message: `Position ${r.position} pour « ${r.requete} » — deuxième page, trafic très faible.`,
        details: { requete: r.requete, position: r.position, top3: r.top3 },
      });
    } else if (r.position > 3) {
      findings.push({
        pilier: "mots_cles",
        code: "page_1_mais_perfectible",
        severite: "basse",
        message: `Position ${r.position} pour « ${r.requete} » — première page mais place à améliorer.`,
        details: { requete: r.requete, position: r.position, top3: r.top3 },
      });
    } else {
      findings.push({
        pilier: "mots_cles",
        code: "excellent_classement",
        severite: "info",
        message: `Position ${r.position} pour « ${r.requete} » — excellent classement.`,
        details: { requete: r.requete, position: r.position },
      });
    }
  }

  return findings;
}

async function chercherSerper(
  requete: string,
  hostname: string,
  cle: string,
): Promise<{
  requete: string;
  position: number | null;
  top3: Array<{ titre: string; url: string }>;
} | null> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": cle,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: requete, gl: "fr", hl: "fr", num: 20 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      organic?: Array<{ title: string; link: string; snippet?: string }>;
    };
    const organic = data.organic ?? [];

    const estSiteHote = (link: string): boolean => {
      try {
        const h = new URL(link).hostname.replace(/^www\./, "").toLowerCase();
        const c = hostname.toLowerCase();
        return h === c || h.endsWith(`.${c}`);
      } catch {
        return false;
      }
    };

    const idx = organic.findIndex((r) => estSiteHote(r.link));
    const position = idx >= 0 ? idx + 1 : null;

    const top3 = organic
      .filter((r) => !estSiteHote(r.link))
      .slice(0, 3)
      .map((r) => ({ titre: r.title, url: r.link }));

    return { requete, position, top3 };
  } catch {
    return null;
  }
}
