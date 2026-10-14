/**
 * Audit référencement d'un site via Serper (API Google Search).
 *
 * On teste 2-4 requêtes représentatives (nom de marque + secteur
 * géolocalisé) et on vérifie la position du site hôte dans les 20
 * premiers résultats, ainsi que les concurrents visibles.
 */

export type ConcurrentVu = {
  titre: string;
  url: string;
  snippet?: string;
};

export type FindingReferencement = {
  requete: string;
  position: number | null; // 1 à 20, ou null si pas dans top 20
  totalResultats?: number;
  concurrents: ConcurrentVu[];
};

export type ResultatAuditReferencement = {
  url: string;
  hostname: string;
  dureeMs: number;
  findings: FindingReferencement[];
  resumePourClaude: string;
};

/**
 * Lance un audit référencement sur l'URL donnée avec les requêtes
 * fournies (ou déduites automatiquement du hostname si absentes).
 *
 * Un délai minimum de 8 secondes est garanti pour l'effet théâtral.
 */
export async function auditerReferencement(
  urlBrute: string,
  motsCles?: string[],
  delaiMinimumMs = 8000,
): Promise<ResultatAuditReferencement> {
  const url = normaliserUrl(urlBrute);
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return urlBrute;
    }
  })();

  const requetes = (motsCles && motsCles.length > 0
    ? motsCles
    : requetesParDefaut(hostname)
  ).slice(0, 4);

  const debut = Date.now();

  const [findingsBrut] = await Promise.all([
    Promise.all(requetes.map((req) => chercherSerper(req, hostname))),
    new Promise((resolve) => setTimeout(resolve, delaiMinimumMs)),
  ]);

  const findings = findingsBrut.filter((f): f is FindingReferencement => f !== null);
  const dureeMs = Date.now() - debut;

  return {
    url,
    hostname,
    dureeMs,
    findings,
    resumePourClaude: construireResumePourClaude(hostname, findings),
  };
}

async function chercherSerper(
  requete: string,
  hostname: string,
): Promise<FindingReferencement | null> {
  const cle = process.env.SERPER_API_KEY;
  if (!cle) return null;

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": cle,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: requete,
        gl: "fr",
        hl: "fr",
        num: 20,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return {
        requete,
        position: null,
        concurrents: [],
      };
    }

    const data = (await res.json()) as {
      organic?: Array<{ title: string; link: string; snippet?: string }>;
      searchInformation?: { totalResults?: string };
    };

    const organic = data.organic ?? [];

    // Position du site hôte dans les résultats organiques
    const indexSite = organic.findIndex((r) =>
      r.link?.toLowerCase().includes(hostname.toLowerCase()),
    );
    const position = indexSite >= 0 ? indexSite + 1 : null;

    // Top 3 concurrents visibles (hors site hôte)
    const concurrents = organic
      .filter((r) => !r.link?.toLowerCase().includes(hostname.toLowerCase()))
      .slice(0, 3)
      .map((r) => ({
        titre: r.title,
        url: r.link,
        snippet: r.snippet,
      }));

    const totalResultats = data.searchInformation?.totalResults
      ? parseInt(data.searchInformation.totalResults.replace(/\D/g, ""), 10)
      : undefined;

    return {
      requete,
      position,
      totalResultats,
      concurrents,
    };
  } catch {
    return {
      requete,
      position: null,
      concurrents: [],
    };
  }
}

/**
 * Requêtes par défaut si Claude n'en fournit pas :
 * 1. Nom de la marque (hostname sans TLD) — teste la visibilité directe
 * 2. Hostname complet — teste si le site apparaît sur son propre nom
 */
function requetesParDefaut(hostname: string): string[] {
  const nomMarque = hostname.split(".")[0];
  return [nomMarque, hostname];
}

function normaliserUrl(url: string): string {
  const t = url.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function construireResumePourClaude(
  hostname: string,
  findings: FindingReferencement[],
): string {
  const lignes: string[] = [];
  lignes.push(`AUDIT RÉFÉRENCEMENT DU SITE ${hostname} :`);
  lignes.push("");

  for (const f of findings) {
    lignes.push(`─── Requête testée : "${f.requete}" ───`);
    if (f.position === null) {
      lignes.push(`  🔴 Site NON visible dans les 20 premiers résultats Google.`);
    } else if (f.position <= 3) {
      lignes.push(`  🟢 Site en position #${f.position} — excellent.`);
    } else if (f.position <= 10) {
      lignes.push(`  🟡 Site en position #${f.position} — en première page mais perfectible.`);
    } else {
      lignes.push(`  🟠 Site en position #${f.position} — deuxième page, trafic très faible.`);
    }
    if (f.totalResultats && f.totalResultats > 0) {
      lignes.push(`  📊 ${formaterGrandeNombre(f.totalResultats)} résultats au total sur Google pour cette requête.`);
    }
    if (f.concurrents.length > 0) {
      lignes.push(`  Top concurrents visibles :`);
      f.concurrents.forEach((c, i) => {
        lignes.push(`    ${i + 1}. ${c.titre} (${c.url})`);
      });
    }
    lignes.push("");
  }

  lignes.push("");
  lignes.push(
    "INSTRUCTION : Commente avec 2-3 observations frappantes tirées de ces résultats. Jamais alarmiste. Mets le visiteur devant les faits avec calme et pédagogie. Si le site n'est pas visible ou mal placé, explique l'impact commercial concret (perte de trafic qualifié) sans dramatiser. Termine en rappelant que vous enverrez le compte-rendu complet par email à la fin.",
  );

  return lignes.join("\n");
}

function formaterGrandeNombre(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} k`;
  return `${n}`;
}
