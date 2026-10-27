import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  baseConnaissanceChunks,
  siteConnaissanceSources,
  type ChunkMeta,
} from "@/lib/db/schema";
import { chunker } from "./chunker";
import { embedBatch } from "./embeddings";

/**
 * Pipeline générique d'ingestion : texte brut → chunks → embeddings
 * → insert DB + mise à jour statut source.
 *
 * Appelé par les ingesteurs spécifiques (URL, sitemap, PDF). Chaque
 * ingesteur extrait le texte via sa méthode propre (crawl HTML,
 * pdf-parse…) puis délègue à cette fonction pour la partie commune.
 *
 * Idempotence : au préalable supprime les chunks existants de la
 * même source. Permet de re-ingérer une URL / un PDF après mise à
 * jour sans doublons.
 */

export type SegmentIngestion = {
  texte: string;
  meta: ChunkMeta;
};

export async function ingererSegments(params: {
  siteId: string;
  sourceId: string;
  segments: SegmentIngestion[];
}): Promise<{ nbChunks: number }> {
  const { siteId, sourceId, segments } = params;

  // Supprime les chunks existants de cette source (ré-ingestion)
  await db
    .delete(baseConnaissanceChunks)
    .where(eq(baseConnaissanceChunks.sourceId, sourceId));

  // Chunk chaque segment en préservant sa meta
  const tousChunks: Array<{
    texte: string;
    position: number;
    tokens: number;
    meta: ChunkMeta;
  }> = [];
  let positionGlobale = 0;
  for (const seg of segments) {
    for (const c of chunker(seg.texte)) {
      tousChunks.push({
        texte: c.texte,
        position: positionGlobale++,
        tokens: c.tokensApprox,
        meta: seg.meta,
      });
    }
  }

  if (tousChunks.length === 0) {
    await marquerStatutSource(sourceId, "ingere", 0, null);
    return { nbChunks: 0 };
  }

  try {
    const embeddings = await embedBatch(tousChunks.map((c) => c.texte));

    const rows = tousChunks.map((c, i) => ({
      siteId,
      sourceId,
      position: c.position,
      texte: c.texte,
      tokens: c.tokens,
      embedding: embeddings[i],
      meta: c.meta,
    }));

    // Batch d'insert pour éviter les requêtes énormes
    const TAILLE = 50;
    for (let i = 0; i < rows.length; i += TAILLE) {
      await db
        .insert(baseConnaissanceChunks)
        .values(rows.slice(i, i + TAILLE));
    }

    await marquerStatutSource(sourceId, "ingere", rows.length, null);
    return { nbChunks: rows.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ingestion échouée";
    await marquerStatutSource(sourceId, "echec", 0, msg);
    throw e;
  }
}

async function marquerStatutSource(
  sourceId: string,
  statut: "ingere" | "echec",
  nbChunks: number,
  erreur: string | null,
) {
  await db
    .update(siteConnaissanceSources)
    .set({
      statut,
      nbChunks,
      derniereIngestionLe: new Date(),
      derniereErreur: erreur,
      majLe: new Date(),
    })
    .where(eq(siteConnaissanceSources.id, sourceId));
}
