import "server-only";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { ingererSegments } from "./ingest";

/**
 * Ingestion d'un sitemap XML.
 *
 * 1. fetch le sitemap.xml
 * 2. parse XML (regex simple sur <loc>) — pas besoin de parser XML
 *    complet pour un sitemap
 * 3. filtre pour garder uniquement les URLs du même domaine
 * 4. limite à 100 URLs max (plan Starter) — pagination futur
 * 5. crawl chaque URL avec rate limit 1 req/s
 * 6. tous les contenus deviennent des segments de la même source
 */

const USER_AGENT =
  "AxiSolver-Bot/1.0 (+https://axisolver.app/robots) Ingestion client AxiSolver";
const TIMEOUT_MS = 20_000;
const MAX_URLS = 100;
const RATE_LIMIT_MS = 1000;

export async function ingererSitemap(params: {
  siteId: string;
  sourceId: string;
  urlSitemap: string;
}): Promise<{ nbChunks: number; nbUrls: number }> {
  const { siteId, sourceId, urlSitemap } = params;

  const urls = await listerUrlsSitemap(urlSitemap);
  if (urls.length === 0) {
    throw new Error(`Aucune URL trouvée dans le sitemap ${urlSitemap}`);
  }

  const hostCible = new URL(urlSitemap).hostname;
  const urlsFiltrees = urls
    .filter((u) => {
      try {
        return new URL(u).hostname === hostCible;
      } catch {
        return false;
      }
    })
    .slice(0, MAX_URLS);

  const segments: Array<{
    texte: string;
    meta: { url: string; titre?: string };
  }> = [];

  for (const url of urlsFiltrees) {
    try {
      const html = await fetchPage(url);
      const { titre, texte } = extraireContenuPrincipal(html, url);
      if (texte && texte.length >= 100) {
        segments.push({
          texte,
          meta: { url, titre: titre ?? undefined },
        });
      }
      await delay(RATE_LIMIT_MS);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[ingest-sitemap] échec ${url} : ${msg}`);
    }
  }

  const result = await ingererSegments({ siteId, sourceId, segments });
  return { nbChunks: result.nbChunks, nbUrls: segments.length };
}

async function listerUrlsSitemap(urlSitemap: string): Promise<string[]> {
  const xml = await fetchPage(urlSitemap);
  // Extraction brute des URL via regex — tolère <loc> dans sitemap
  // standard, sitemapindex (sous-sitemaps), ou urlset.
  const matches = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)];
  const urls = matches
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith("http"));

  // Si c'est un sitemapindex, on résout récursivement
  const sousSitemaps = urls.filter((u) => u.endsWith(".xml"));
  if (sousSitemaps.length > 0 && urls.length === sousSitemaps.length) {
    const sousUrls: string[] = [];
    for (const sm of sousSitemaps.slice(0, 10)) {
      try {
        const liste = await listerUrlsSitemap(sm);
        sousUrls.push(...liste);
        if (sousUrls.length >= MAX_URLS) break;
      } catch (e) {
        console.warn(`[sitemap] sous-sitemap ignoré : ${sm}`);
      }
    }
    return sousUrls;
  }

  return urls;
}

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function extraireContenuPrincipal(
  html: string,
  url: string,
): { titre: string | null; texte: string } {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article) return { titre: null, texte: "" };
  return {
    titre: article.title ?? null,
    texte: (article.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim(),
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
