import * as cheerio from "cheerio";
import type { FindingSecurity } from "./types";

/**
 * Analyse le HTML pour détecter des problèmes de sécurité du contenu :
 * mixed content (ressources http dans une page https), iframes tiers
 * sans sandbox, versions CMS visibles, formulaires non-HTTPS.
 */
export function analyserContenu(params: {
  html: string;
  url: string;
}): FindingSecurity[] {
  const { html, url } = params;
  const findings: FindingSecurity[] = [];
  const estHttps = url.startsWith("https://");

  let $: cheerio.CheerioAPI;
  try {
    $ = cheerio.load(html);
  } catch {
    return findings;
  }

  // ─── Mixed content ───────────────────────────────────────────────
  if (estHttps) {
    const mixedResources: string[] = [];
    const selectors = ["script[src]", "link[href]", "img[src]", "iframe[src]"];
    for (const sel of selectors) {
      $(sel).each((_, el) => {
        const attr = sel.includes("[src]") ? "src" : "href";
        const val = $(el).attr(attr) ?? "";
        if (val.startsWith("http://")) {
          mixedResources.push(`${sel.split("[")[0]}: ${val}`);
        }
      });
    }
    if (mixedResources.length > 0) {
      findings.push({
        pilier: "contenu",
        code: "mixed_content",
        severite: "haute",
        message: `Page HTTPS avec ${mixedResources.length} ressource(s) chargée(s) en HTTP. Les navigateurs bloquent ou dégradent le mixed content.`,
        details: {
          ressources: mixedResources.slice(0, 5),
          total: mixedResources.length,
        },
      });
    }
  }

  // ─── Iframes tiers sans sandbox ──────────────────────────────────
  const iframesSansSandbox: string[] = [];
  $("iframe[src]").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    if (!src) return;
    try {
      const h = new URL(src, url).hostname;
      const hostLocal = new URL(url).hostname;
      if (h !== hostLocal && $(el).attr("sandbox") === undefined) {
        iframesSansSandbox.push(h);
      }
    } catch {
      // URL malformée — on ignore.
    }
  });
  if (iframesSansSandbox.length > 0) {
    findings.push({
      pilier: "contenu",
      code: "iframes_tiers_sans_sandbox",
      severite: "moyenne",
      message: `${iframesSansSandbox.length} iframe(s) tiers sans attribut sandbox. Le contenu tiers hérite des permissions du site parent.`,
      details: { hosts: iframesSansSandbox.slice(0, 5) },
    });
  }

  // ─── Formulaires non-HTTPS ───────────────────────────────────────
  const formsHttp: string[] = [];
  $("form[action]").each((_, el) => {
    const action = $(el).attr("action") ?? "";
    if (action.startsWith("http://")) {
      formsHttp.push(action);
    }
  });
  if (formsHttp.length > 0) {
    findings.push({
      pilier: "contenu",
      code: "form_action_http",
      severite: "critique",
      message: `${formsHttp.length} formulaire(s) avec action HTTP. Les données saisies (login, carte bancaire...) transiteront en clair.`,
      details: { actions: formsHttp.slice(0, 3) },
    });
  }

  // ─── Versions CMS visibles (meta generator) ──────────────────────
  const generator = $('meta[name="generator"]').attr("content");
  if (generator && /\d/.test(generator)) {
    findings.push({
      pilier: "contenu",
      code: "cms_version_exposee",
      severite: "moyenne",
      message: `Meta generator expose la version CMS (${generator}). Un attaquant peut cibler les CVE correspondants.`,
      details: { generator },
    });
  }

  // ─── Target="_blank" sans rel="noopener" ─────────────────────────
  const liensSansNoopener: number[] = [];
  $('a[target="_blank"]').each((_, el) => {
    const rel = $(el).attr("rel")?.toLowerCase() ?? "";
    if (!rel.includes("noopener")) {
      liensSansNoopener.push(1);
    }
  });
  if (liensSansNoopener.length > 0) {
    findings.push({
      pilier: "contenu",
      code: "target_blank_sans_noopener",
      severite: "basse",
      message: `${liensSansNoopener.length} lien(s) target="_blank" sans rel="noopener". Vulnérabilité tabnabbing — la page ouverte peut manipuler l'onglet parent.`,
      details: { count: liensSansNoopener.length },
    });
  }

  return findings;
}
