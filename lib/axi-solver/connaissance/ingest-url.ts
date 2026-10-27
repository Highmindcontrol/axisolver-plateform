import "server-only";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { ingererSegments } from "./ingest";

/**
 * Ingestion d'une URL unique.
 *
 * 1. fetch la page (user-agent explicite, timeout 20s)
 * 2. Readability extrait le contenu principal (comme le reader view
 *    de Firefox) — évite les menus, pub, footer
 * 3. Nettoyage markdown-ish : titre + corps en texte propre
 * 4. Pipeline standard d'ingestion (chunker + embeddings + insert)
 */

const USER_AGENT =
  "AxiSolver-Bot/1.0 (+https://axisolver.app/robots) Ingestion client AxiSolver";
const TIMEOUT_MS = 20_000;
const TAILLE_MAX_HTML = 5_000_000; // 5 MB

export async function ingererUrl(params: {
  siteId: string;
  sourceId: string;
  url: string;
}): Promise<{ nbChunks: number; titre: string | null }> {
  const { siteId, sourceId, url } = params;

  const htmlBrut = await fetchPage(url);
  const { titre, texte } = extraireContenuPrincipal(htmlBrut, url);

  if (!texte || texte.length < 100) {
    throw new Error(
      `Contenu trop court pour ${url} (${texte.length} caractères) — page probablement vide ou dynamique`,
    );
  }

  const result = await ingererSegments({
    siteId,
    sourceId,
    segments: [
      {
        texte,
        meta: { url, titre: titre ?? undefined },
      },
    ],
  });

  return { nbChunks: result.nbChunks, titre };
}

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} sur ${url}`);
    }
    const taille = Number(res.headers.get("content-length") ?? "0");
    if (taille > TAILLE_MAX_HTML) {
      throw new Error(
        `Page trop lourde (${taille} octets > ${TAILLE_MAX_HTML})`,
      );
    }
    const html = await res.text();
    if (html.length > TAILLE_MAX_HTML) {
      throw new Error(
        `Page trop lourde après lecture (${html.length} octets)`,
      );
    }
    return html;
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
  if (!article) {
    return { titre: null, texte: "" };
  }
  // textContent contient le corps nettoyé, avec sauts de ligne entre
  // paragraphes mais sans balise.
  const texte = (article.textContent ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { titre: article.title ?? null, texte };
}
