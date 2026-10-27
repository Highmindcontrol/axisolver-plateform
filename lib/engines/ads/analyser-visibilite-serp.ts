import type { AnnonceSerp, FindingAds } from "./types";

/**
 * Interroge Serper sur les mots-clés fournis et récupère les annonces
 * sponsorisées (Google Ads) qui apparaissent en haut de SERP. Permet
 * au propriétaire du site de voir qui enchérit sur ses mots-clés
 * métier et à quel positionnement.
 *
 * Retourne la liste des annonces concurrentes + findings sur la
 * compétitivité du marché.
 */
export async function analyserVisibiliteSerp(params: {
  motsCles: string[];
  hostname: string;
}): Promise<{ annonces: AnnonceSerp[]; findings: FindingAds[] }> {
  const { motsCles, hostname } = params;
  const cle = process.env.SERPER_API_KEY;
  if (!cle) {
    return {
      annonces: [],
      findings: [
        {
          pilier: "visibilite",
          code: "serper_absent",
          severite: "info",
          message:
            "Clé SERPER_API_KEY absente — l'audit visibilité SERP n'a pas pu être exécuté.",
        },
      ],
    };
  }

  const resultats = await Promise.all(
    motsCles.slice(0, 5).map((req) => chercherSerperAds(req, hostname, cle)),
  );

  const annonces: AnnonceSerp[] = [];
  const findings: FindingAds[] = [];

  for (const r of resultats) {
    if (!r) continue;
    annonces.push(...r.annonces);

    if (r.annonces.length === 0) {
      findings.push({
        pilier: "visibilite",
        code: "pas_de_pub_sur_requete",
        severite: "info",
        message: `Aucune annonce sponsorisée sur « ${r.requete} » — opportunité : marché peu concurrentiel.`,
        details: { requete: r.requete },
      });
    } else if (r.siteParmiPubs) {
      findings.push({
        pilier: "visibilite",
        code: "pub_presente",
        severite: "info",
        message: `Votre site est présent dans les annonces sponsorisées sur « ${r.requete} ».`,
        details: { requete: r.requete, position: r.positionSite },
      });
    } else if (r.annonces.length >= 3) {
      findings.push({
        pilier: "visibilite",
        code: "marche_sature_ads",
        severite: "haute",
        message: `${r.annonces.length} annonces sponsorisées actives sur « ${r.requete} » — vous êtes absent de la bataille publicitaire.`,
        details: { requete: r.requete, concurrents: r.annonces.length },
      });
    } else {
      findings.push({
        pilier: "visibilite",
        code: "concurrents_ads",
        severite: "moyenne",
        message: `${r.annonces.length} concurrent(s) actif(s) en Ads sur « ${r.requete} » — opportunité de prise de parts de voix.`,
        details: { requete: r.requete, concurrents: r.annonces.length },
      });
    }
  }

  return { annonces, findings };
}

async function chercherSerperAds(
  requete: string,
  hostname: string,
  cle: string,
): Promise<{
  requete: string;
  annonces: AnnonceSerp[];
  siteParmiPubs: boolean;
  positionSite: number | null;
} | null> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": cle,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: requete, gl: "fr", hl: "fr", num: 10 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      ads?: Array<{ title: string; link: string; description?: string }>;
    };
    const adsBrut = data.ads ?? [];

    const estSiteHote = (link: string): boolean => {
      try {
        const h = new URL(link).hostname.replace(/^www\./, "").toLowerCase();
        const c = hostname.toLowerCase();
        return h === c || h.endsWith(`.${c}`);
      } catch {
        return false;
      }
    };

    const annonces: AnnonceSerp[] = adsBrut.map((a, i) => ({
      requete,
      position: i + 1,
      titre: a.title,
      url: a.link,
      description: a.description,
    }));

    const idxSite = annonces.findIndex((a) => estSiteHote(a.url));
    const siteParmiPubs = idxSite >= 0;

    return {
      requete,
      annonces,
      siteParmiPubs,
      positionSite: siteParmiPubs ? idxSite + 1 : null,
    };
  } catch {
    return null;
  }
}
