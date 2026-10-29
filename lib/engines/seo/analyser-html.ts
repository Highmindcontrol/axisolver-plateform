import * as cheerio from "cheerio";
import type { FindingSeo } from "./types";

/**
 * Analyse une page HTML pour en extraire les findings SEO
 * sur les piliers « technique », « contenu » et « mobile ».
 */
export function analyserHtml(params: {
  html: string;
  url: string;
  tailleOctets: number;
  tempsReponseMs: number;
}): FindingSeo[] {
  const { html, url, tailleOctets, tempsReponseMs } = params;
  const findings: FindingSeo[] = [];

  let $: cheerio.CheerioAPI;
  try {
    $ = cheerio.load(html);
  } catch {
    findings.push({
      pilier: "technique",
      code: "html_illisible",
      severite: "critique",
      message: "Le HTML de la page n'a pas pu être analysé.",
    });
    return findings;
  }

  // ─── Pilier TECHNIQUE ────────────────────────────────────────────

  const title = $("title").text().trim();
  if (!title) {
    findings.push({
      pilier: "technique",
      code: "title_absent",
      severite: "critique",
      message: "La balise <title> est absente ou vide.",
    });
  } else if (title.length < 30) {
    findings.push({
      pilier: "technique",
      code: "title_court",
      severite: "haute",
      message: `La balise <title> est trop courte (${title.length} caractères, idéalement 50-60).`,
      details: { longueur: title.length, contenu: title },
    });
  } else if (title.length > 65) {
    findings.push({
      pilier: "technique",
      code: "title_long",
      severite: "moyenne",
      message: `La balise <title> est trop longue (${title.length} caractères, Google tronque au-delà de 60).`,
      details: { longueur: title.length, contenu: title },
    });
  }

  const metaDesc =
    $('meta[name="description"]').attr("content")?.trim() ?? "";
  if (!metaDesc) {
    findings.push({
      pilier: "technique",
      code: "meta_description_absente",
      severite: "haute",
      message:
        "La meta description est absente. C'est le texte qui s'affiche sous le titre dans les résultats Google.",
    });
  } else if (metaDesc.length < 70) {
    findings.push({
      pilier: "technique",
      code: "meta_description_courte",
      severite: "moyenne",
      message: `La meta description est trop courte (${metaDesc.length} caractères, idéalement 140-160).`,
      details: { longueur: metaDesc.length },
    });
  } else if (metaDesc.length > 170) {
    findings.push({
      pilier: "technique",
      code: "meta_description_longue",
      severite: "basse",
      message: `La meta description est trop longue (${metaDesc.length} caractères, Google tronque au-delà de 160).`,
      details: { longueur: metaDesc.length },
    });
  }

  if ($('link[rel="canonical"]').length === 0) {
    findings.push({
      pilier: "technique",
      code: "canonical_absent",
      severite: "moyenne",
      message:
        "Aucune balise canonical déclarée. Risque de contenu dupliqué pour Google.",
    });
  }

  const robotsMeta = $('meta[name="robots"]')
    .attr("content")
    ?.toLowerCase();
  if (robotsMeta?.includes("noindex")) {
    findings.push({
      pilier: "technique",
      code: "noindex_detecte",
      severite: "critique",
      message:
        "La meta robots contient noindex — Google n'indexera pas cette page. Vérifier que c'est volontaire.",
      details: { contenu: robotsMeta },
    });
  }

  const htmlLang = $("html").attr("lang");
  if (!htmlLang) {
    findings.push({
      pilier: "technique",
      code: "lang_absent",
      severite: "basse",
      message: "L'attribut lang sur <html> est absent (ex. lang=\"fr\").",
    });
  }

  const ogTitle = $('meta[property="og:title"]').length > 0;
  const ogImage = $('meta[property="og:image"]').length > 0;
  const ogDesc = $('meta[property="og:description"]').length > 0;
  if (!ogTitle || !ogImage || !ogDesc) {
    findings.push({
      pilier: "technique",
      code: "open_graph_incomplet",
      severite: "basse",
      message:
        "Balises Open Graph incomplètes (title/description/image). Les partages sur réseaux sociaux seront moins engageants.",
      details: {
        og_title: ogTitle,
        og_description: ogDesc,
        og_image: ogImage,
      },
    });
  }

  // ─── Pilier CONTENU ──────────────────────────────────────────────

  const h1Count = $("h1").length;
  if (h1Count === 0) {
    findings.push({
      pilier: "contenu",
      code: "h1_absent",
      severite: "haute",
      message: "Aucune balise <h1> détectée. C'est le titre éditorial principal de la page.",
    });
  } else if (h1Count > 1) {
    findings.push({
      pilier: "contenu",
      code: "h1_multiple",
      severite: "moyenne",
      message: `${h1Count} balises <h1> détectées. Une seule H1 par page est recommandée.`,
      details: { count: h1Count },
    });
  }

  const h2s = $("h2").length;
  const h3s = $("h3").length;
  if (h2s === 0 && h3s === 0) {
    findings.push({
      pilier: "contenu",
      code: "sous_titres_absents",
      severite: "moyenne",
      message:
        "Aucun <h2> ou <h3> détecté. La hiérarchie éditoriale aide Google à comprendre la structure.",
    });
  }

  const texteBrut = $("body").text().replace(/\s+/g, " ").trim();
  const nbMots = texteBrut.split(/\s+/).filter((m) => m.length > 1).length;
  if (nbMots < 300) {
    findings.push({
      pilier: "contenu",
      code: "contenu_mince",
      severite: nbMots < 100 ? "haute" : "moyenne",
      message: `Contenu mince (~${nbMots} mots). Google favorise les pages d'au moins 300 mots de contenu utile.`,
      details: { nb_mots: nbMots },
    });
  }

  let nbImagesSansAlt = 0;
  $("img").each((_, img) => {
    if (!$(img).attr("alt")?.trim()) nbImagesSansAlt++;
  });
  if (nbImagesSansAlt > 0) {
    findings.push({
      pilier: "contenu",
      code: "images_sans_alt",
      severite: nbImagesSansAlt >= 5 ? "haute" : "moyenne",
      message: `${nbImagesSansAlt} image(s) sans attribut alt. Mauvais pour l'accessibilité et le SEO image.`,
      details: { nb_images_sans_alt: nbImagesSansAlt },
    });
  }

  let nbLiensInternes = 0;
  const hostLocal = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    if (href.startsWith("/") || href.startsWith("#")) {
      nbLiensInternes++;
      return;
    }
    try {
      if (new URL(href).hostname === hostLocal) nbLiensInternes++;
    } catch {
      // href invalide — ignore
    }
  });
  if (nbLiensInternes < 3) {
    findings.push({
      pilier: "contenu",
      code: "liens_internes_rares",
      severite: "basse",
      message: `Seulement ${nbLiensInternes} lien(s) interne(s) détecté(s). Le maillage interne aide Google à explorer le site.`,
      details: { nb_liens_internes: nbLiensInternes },
    });
  }

  // ─── Pilier MOBILE ───────────────────────────────────────────────

  const viewportContent = $('meta[name="viewport"]').attr("content");
  if (viewportContent === undefined) {
    findings.push({
      pilier: "mobile",
      code: "viewport_absent",
      severite: "critique",
      message:
        "Balise meta viewport absente. Le site ne sera pas correctement affiché sur mobile — critère de ranking Google.",
    });
  } else {
    const content = viewportContent.toLowerCase();
    if (!content.includes("width=device-width")) {
      findings.push({
        pilier: "mobile",
        code: "viewport_mal_configure",
        severite: "haute",
        message:
          "La balise viewport ne contient pas width=device-width. Rendu mobile dégradé probable.",
        details: { contenu: content },
      });
    }
  }

  // ─── Pilier PERFORMANCE ─────────────────────────────────────────

  if (tempsReponseMs > 3000) {
    findings.push({
      pilier: "performance",
      code: "ttfb_eleve",
      severite: "haute",
      message: `Temps de réponse serveur élevé (${tempsReponseMs} ms). Google pénalise au-delà de 2 secondes.`,
      details: { ttfb_ms: tempsReponseMs },
    });
  } else if (tempsReponseMs > 1500) {
    findings.push({
      pilier: "performance",
      code: "ttfb_moyen",
      severite: "moyenne",
      message: `Temps de réponse serveur moyen (${tempsReponseMs} ms). À optimiser pour descendre sous 1 seconde.`,
      details: { ttfb_ms: tempsReponseMs },
    });
  }

  const tailleKo = Math.round(tailleOctets / 1024);
  if (tailleKo > 1500) {
    findings.push({
      pilier: "performance",
      code: "page_lourde",
      severite: "haute",
      message: `Page très lourde (${tailleKo} Ko de HTML). Impacte le chargement mobile et le crawl Google.`,
      details: { taille_ko: tailleKo },
    });
  } else if (tailleKo > 500) {
    findings.push({
      pilier: "performance",
      code: "page_moyennement_lourde",
      severite: "moyenne",
      message: `Page moyennement lourde (${tailleKo} Ko). Objectif : rester sous 500 Ko côté HTML.`,
      details: { taille_ko: tailleKo },
    });
  }

  const scripts = $("script[src]").length;
  if (scripts > 20) {
    findings.push({
      pilier: "performance",
      code: "trop_de_scripts",
      severite: "moyenne",
      message: `${scripts} scripts externes détectés. Chacun ajoute une requête HTTP et bloque le rendu.`,
      details: { nb_scripts: scripts },
    });
  }

  return findings;
}
