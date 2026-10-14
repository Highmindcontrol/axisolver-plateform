/**
 * Mini-audit site hôte — fetch + parse HTML + extraction d'indicateurs
 * SEO / sécurité / performance basiques.
 *
 * Objectif Phase 1 : donner à Claude des findings **réels** sur le site
 * du prospect, pour qu'il parle concrètement de ce qu'il voit, pas en
 * mode généraliste. Audit complet (Lot B) viendra plus tard.
 */

export type FindingAudit = {
  categorie: "seo" | "securite" | "performance" | "metier";
  severite: "info" | "amelioration" | "critique";
  titre: string;
  detail?: string;
};

export type ResultatAudit = {
  url: string;
  hostname: string;
  statutHttp: number;
  dureeMs: number;
  titre?: string;
  description?: string;
  langue?: string;
  technologies: string[];
  findings: FindingAudit[];
  resumePourClaude: string;
};

/** Catégorie d'audit demandé par les tools dédiés. */
export type CategorieAudit = "securite" | "seo";

/** Variante filtrée de l'audit — renvoie seulement les findings d'une
 *  catégorie (sécurité ou SEO). Utilisée par les tools dédiés
 *  `auditer_securite` et `auditer_seo` pour séparer les deux phases
 *  dramaturgiques du protocole d'audit.
 *
 *  Un délai minimum de 8 secondes est garanti pour éviter l'effet
 *  « instantané pas sérieux ». Le fetch réel se fait en parallèle. */
export async function auditerSiteParCategorie(
  urlBrute: string,
  categorie: CategorieAudit,
  delaiMinimumMs = 8000,
): Promise<ResultatAudit> {
  const [resultat] = await Promise.all([
    auditerSite(urlBrute),
    new Promise((resolve) => setTimeout(resolve, delaiMinimumMs)),
  ]);

  // Filtre les findings par catégorie demandée
  const findingsCategorie = resultat.findings.filter(
    (f) => f.categorie === categorie,
  );

  return {
    ...resultat,
    findings: findingsCategorie,
    resumePourClaude: construireResumePourCategorie(
      resultat.hostname,
      categorie,
      findingsCategorie,
      resultat.technologies,
    ),
  };
}

function construireResumePourCategorie(
  hostname: string,
  categorie: CategorieAudit,
  findings: FindingAudit[],
  technologies: string[],
): string {
  const libelleCategorie =
    categorie === "securite" ? "SÉCURITÉ" : "SEO";
  const lignes: string[] = [];
  lignes.push(`AUDIT ${libelleCategorie} DU SITE ${hostname} :`);
  lignes.push("");

  if (technologies.length > 0 && categorie === "securite") {
    lignes.push(`- Technologies détectées : ${technologies.join(", ")}`);
    lignes.push("");
  }

  const parSev = {
    critique: findings.filter((f) => f.severite === "critique"),
    amelioration: findings.filter((f) => f.severite === "amelioration"),
    info: findings.filter((f) => f.severite === "info"),
  };

  lignes.push(`${findings.length} point${findings.length > 1 ? "s" : ""} observé${findings.length > 1 ? "s" : ""} :`);
  if (parSev.critique.length > 0) {
    lignes.push(`\n🔴 ${parSev.critique.length} critique(s) :`);
    parSev.critique.forEach((f) =>
      lignes.push(`  - ${f.titre}${f.detail ? ` — ${f.detail}` : ""}`),
    );
  }
  if (parSev.amelioration.length > 0) {
    lignes.push(`\n🟠 ${parSev.amelioration.length} à améliorer :`);
    parSev.amelioration.forEach((f) =>
      lignes.push(`  - ${f.titre}${f.detail ? ` — ${f.detail}` : ""}`),
    );
  }
  if (parSev.info.length > 0) {
    lignes.push(`\n🔵 ${parSev.info.length} info(s) :`);
    parSev.info.forEach((f) => lignes.push(`  - ${f.titre}`));
  }

  if (findings.length === 0) {
    lignes.push(`Aucun point d'attention majeur sur ce volet ${libelleCategorie.toLowerCase()}. L'audit complet à l'installation ira plus loin.`);
  }

  lignes.push("");
  const instructionCategorie =
    categorie === "securite"
      ? "INSTRUCTION : Commente avec 2-3 observations SÉCURITÉ frappantes tirées des findings ci-dessus. Jamais alarmiste. Mets le visiteur devant les faits avec calme. Termine par : 'Si je m'occupais de votre site, je ne me contenterais pas de vous dire ce qui ne va pas — je vous ferais un dossier clair avec toutes les solutions à envisager. Ici, en démo, je ne peux que vous alerter.'"
      : "INSTRUCTION : Commente avec 2-3 observations SEO frappantes tirées des findings ci-dessus. Mets en lumière les quick wins et les choses qui gaspillent du trafic. Termine en rappelant que vous enverrez un compte-rendu complet par email à la fin de la conversation.";
  lignes.push(instructionCategorie);

  return lignes.join("\n");
}

/**
 * Lance un mini-audit du site fourni et retourne un résumé pour Claude.
 * Toutes les opérations sont best-effort — on ne lève jamais, on
 * capture les erreurs et on remonte un résultat partiel.
 */
export async function auditerSite(urlBrute: string): Promise<ResultatAudit> {
  const url = normaliserUrl(urlBrute);
  const hostname = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return urlBrute;
    }
  })();

  const findings: FindingAudit[] = [];
  const technologies: string[] = [];
  let titre: string | undefined;
  let description: string | undefined;
  let langue: string | undefined;
  let statutHttp = 0;
  let html = "";

  const debut = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AxiSolverBot/1.0; +https://axisolver.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    statutHttp = res.status;

    // Analyse des headers HTTP (sécurité)
    const headers = res.headers;
    if (!headers.get("strict-transport-security")) {
      findings.push({
        categorie: "securite",
        severite: "amelioration",
        titre: "HSTS manquant",
        detail: "Pas de header Strict-Transport-Security — un visiteur pourrait être rabattu sur HTTP par un attaquant réseau.",
      });
    }
    if (!headers.get("content-security-policy")) {
      findings.push({
        categorie: "securite",
        severite: "amelioration",
        titre: "CSP absente",
        detail: "Pas de Content-Security-Policy — exposition accrue aux attaques XSS.",
      });
    }
    if (!headers.get("x-frame-options") && !headers.get("content-security-policy")?.includes("frame-ancestors")) {
      findings.push({
        categorie: "securite",
        severite: "amelioration",
        titre: "Protection clickjacking manquante",
        detail: "Pas de X-Frame-Options ni frame-ancestors — le site peut être embarqué dans un iframe malveillant.",
      });
    }
    const serverHeader = headers.get("server");
    const poweredBy = headers.get("x-powered-by");
    if (serverHeader) {
      findings.push({
        categorie: "securite",
        severite: "info",
        titre: `Version serveur exposée : ${serverHeader}`,
        detail: "L'entête Server révèle la pile technique.",
      });
    }
    if (poweredBy) {
      findings.push({
        categorie: "securite",
        severite: "info",
        titre: `Entête X-Powered-By : ${poweredBy}`,
        detail: "Information technique inutilement exposée.",
      });
      if (poweredBy.toLowerCase().includes("php")) technologies.push("PHP");
    }

    if (!url.startsWith("https://")) {
      findings.push({
        categorie: "securite",
        severite: "critique",
        titre: "Pas de HTTPS",
        detail: "Le site n'est pas servi en HTTPS — risque de blocage navigateur et perte de confiance.",
      });
    }

    if (res.ok || statutHttp === 200) {
      html = await res.text();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    findings.push({
      categorie: "performance",
      severite: "critique",
      titre: "Site injoignable",
      detail: `${message}. Peut-être un timeout ou une protection anti-bot.`,
    });
  }

  const dureeMs = Date.now() - debut;

  // Parse HTML si on a du contenu
  if (html) {
    titre = extraire(html, /<title[^>]*>([^<]+)<\/title>/i);
    description = extraireAttribut(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    langue = extraireAttribut(html, /<html[^>]+lang=["']([^"']+)["']/i);

    // SEO on-page
    if (!titre || titre.trim().length < 10) {
      findings.push({
        categorie: "seo",
        severite: "critique",
        titre: "Balise <title> manquante ou trop courte",
        detail: "Un title explicite de 50-60 caractères est le signal n°1 pour Google.",
      });
    } else if (titre.length > 70) {
      findings.push({
        categorie: "seo",
        severite: "amelioration",
        titre: `<title> trop long (${titre.length} caractères)`,
        detail: "Google tronque après ~60 caractères — le reste n'est pas affiché dans les résultats.",
      });
    }

    if (!description) {
      findings.push({
        categorie: "seo",
        severite: "amelioration",
        titre: "Meta description manquante",
        detail: "Pas de meta description — Google génère la sienne, souvent moins vendeuse que la vôtre.",
      });
    } else if (description.length > 170) {
      findings.push({
        categorie: "seo",
        severite: "info",
        titre: `Meta description trop longue (${description.length} caractères)`,
      });
    }

    if (!langue) {
      findings.push({
        categorie: "seo",
        severite: "amelioration",
        titre: "Attribut lang manquant sur <html>",
        detail: "Indispensable pour l'accessibilité et le ciblage géographique.",
      });
    }

    const nbH1 = (html.match(/<h1[^>]*>/gi) || []).length;
    if (nbH1 === 0) {
      findings.push({
        categorie: "seo",
        severite: "amelioration",
        titre: "Aucun <h1> détecté",
        detail: "Chaque page devrait avoir un titre H1 principal.",
      });
    } else if (nbH1 > 1) {
      findings.push({
        categorie: "seo",
        severite: "info",
        titre: `${nbH1} balises <h1> sur la page`,
        detail: "Un seul H1 principal est recommandé pour une hiérarchie claire.",
      });
    }

    if (!html.match(/<meta[^>]+property=["']og:/i)) {
      findings.push({
        categorie: "seo",
        severite: "amelioration",
        titre: "Open Graph manquant",
        detail: "Aucune balise OG — vos partages sur réseaux sociaux sortent moches.",
      });
    }

    // Images sans alt
    const imgsTotal = (html.match(/<img\b[^>]*>/gi) || []).length;
    const imgsSansAlt = (html.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) || []).length;
    if (imgsSansAlt > 3) {
      findings.push({
        categorie: "seo",
        severite: "amelioration",
        titre: `${imgsSansAlt} image${imgsSansAlt > 1 ? "s" : ""} sans attribut alt sur ${imgsTotal}`,
        detail: "Mauvais pour l'accessibilité ET pour le SEO images (Google Images).",
      });
    }

    // Détection techno simple
    if (html.includes("wp-content") || html.includes("wp-includes")) {
      technologies.push("WordPress");
      const matchGenerator = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress ([\d.]+)/i);
      if (matchGenerator) {
        findings.push({
          categorie: "securite",
          severite: "amelioration",
          titre: `Version WordPress exposée : ${matchGenerator[1]}`,
          detail: "La version WP est révélée via meta generator — à masquer.",
        });
      }
    }
    if (html.includes("Shopify.theme") || html.includes("cdn.shopify.com")) {
      technologies.push("Shopify");
    }
    if (html.includes("__NEXT_DATA__") || html.includes("_next/static")) {
      technologies.push("Next.js");
    }
    if (html.includes("drupal-settings-json") || html.includes("Drupal.")) {
      technologies.push("Drupal");
    }
    if (html.includes("googletagmanager.com")) {
      technologies.push("Google Tag Manager");
    }
    if (html.includes("google-analytics.com") || html.includes("gtag(")) {
      technologies.push("Google Analytics");
    }

    // Poids approximatif
    const tailleKo = Math.round(html.length / 1024);
    if (tailleKo > 500) {
      findings.push({
        categorie: "performance",
        severite: "amelioration",
        titre: `Page HTML lourde (${tailleKo} Ko bruts)`,
        detail: "Une page > 500 Ko bruts ralentit le time-to-interactive.",
      });
    }
  }

  // Construction du résumé pour Claude
  const resumePourClaude = construireResumeClaude({
    url,
    hostname,
    statutHttp,
    titre,
    description,
    technologies,
    findings,
  });

  return {
    url,
    hostname,
    statutHttp,
    dureeMs,
    titre,
    description,
    langue,
    technologies,
    findings,
    resumePourClaude,
  };
}

// ---------------------------------------------------------------- //

function normaliserUrl(url: string): string {
  const t = url.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function extraire(html: string, regex: RegExp): string | undefined {
  const m = html.match(regex);
  return m ? m[1].replace(/\s+/g, " ").trim() : undefined;
}

function extraireAttribut(html: string, regex: RegExp): string | undefined {
  const m = html.match(regex);
  return m ? m[1].trim() : undefined;
}

function construireResumeClaude(infos: {
  url: string;
  hostname: string;
  statutHttp: number;
  titre?: string;
  description?: string;
  technologies: string[];
  findings: FindingAudit[];
}): string {
  const lignes: string[] = [];
  lignes.push(`AUDIT RAPIDE DU SITE ${infos.hostname} :`);
  lignes.push("");
  lignes.push(`- Statut HTTP : ${infos.statutHttp}`);
  if (infos.titre) lignes.push(`- Titre de la page : "${infos.titre}"`);
  if (infos.description)
    lignes.push(`- Meta description : "${infos.description.slice(0, 120)}${infos.description.length > 120 ? "..." : ""}"`);
  if (infos.technologies.length > 0)
    lignes.push(`- Technologies détectées : ${infos.technologies.join(", ")}`);

  const parCat = {
    critique: infos.findings.filter((f) => f.severite === "critique"),
    amelioration: infos.findings.filter((f) => f.severite === "amelioration"),
    info: infos.findings.filter((f) => f.severite === "info"),
  };

  lignes.push("");
  lignes.push(`FINDINGS (${infos.findings.length} au total) :`);
  if (parCat.critique.length > 0) {
    lignes.push(`\n🔴 ${parCat.critique.length} critique(s) :`);
    parCat.critique.forEach((f) =>
      lignes.push(`  - [${f.categorie}] ${f.titre}${f.detail ? ` — ${f.detail}` : ""}`),
    );
  }
  if (parCat.amelioration.length > 0) {
    lignes.push(`\n🟠 ${parCat.amelioration.length} amélioration(s) possible(s) :`);
    parCat.amelioration.forEach((f) =>
      lignes.push(`  - [${f.categorie}] ${f.titre}${f.detail ? ` — ${f.detail}` : ""}`),
    );
  }
  if (parCat.info.length > 0) {
    lignes.push(`\n🔵 ${parCat.info.length} info(s) :`);
    parCat.info.forEach((f) =>
      lignes.push(`  - [${f.categorie}] ${f.titre}`),
    );
  }

  lignes.push("");
  lignes.push(
    "INSTRUCTION : Reviens au visiteur avec 2-3 observations CONCRÈTES tirées de ces findings — pas la liste complète. Prends ce qui frappe le plus, formule en langage naturel, dit ce que ça implique commercialement. Garde l'élégance et la vivacité.",
  );

  return lignes.join("\n");
}
