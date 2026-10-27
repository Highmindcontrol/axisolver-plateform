import "server-only";

import OpenAI from "openai";

/**
 * Embeddings OpenAI text-embedding-3-small (dimension 1536).
 *
 * Modèle le plus économique de qualité suffisante pour la recherche
 * sémantique interne au RAG AxiSolver (0,02 $ / 1M tokens au tarif
 * octobre 2026). Si on monte en qualité, bascule vers
 * text-embedding-3-large (3072 dim) sans changement de code — juste
 * mettre à jour `MODELE` et la dimension du schema vector().
 *
 * Batching : OpenAI accepte jusqu'à 2048 entrées par appel, mais pour
 * garder une latence raisonnable on cap à 100 par batch.
 */

const MODELE = "text-embedding-3-small";
const DIMENSIONS = 1536;
const TAILLE_BATCH = 100;

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (_client) return _client;
  const cle = process.env.OPENAI_API_KEY;
  if (!cle) throw new Error("OPENAI_API_KEY manquant pour les embeddings");
  _client = new OpenAI({ apiKey: cle });
  return _client;
}

/**
 * Embed un ou plusieurs textes. Retourne les vecteurs dans l'ordre
 * d'entrée. Appels batch si > 100 entrées.
 */
export async function embedBatch(textes: string[]): Promise<number[][]> {
  if (textes.length === 0) return [];

  const tousVecteurs: number[][] = [];
  for (let i = 0; i < textes.length; i += TAILLE_BATCH) {
    const batch = textes.slice(i, i + TAILLE_BATCH);
    const reponse = await client().embeddings.create({
      model: MODELE,
      input: batch,
    });
    for (const item of reponse.data) {
      tousVecteurs.push(item.embedding);
    }
  }

  if (tousVecteurs.length !== textes.length) {
    throw new Error(
      `Mismatch embeddings : attendu ${textes.length}, reçu ${tousVecteurs.length}`,
    );
  }
  if (tousVecteurs[0]?.length !== DIMENSIONS) {
    throw new Error(
      `Dimension embedding inattendue : ${tousVecteurs[0]?.length} ≠ ${DIMENSIONS}`,
    );
  }
  return tousVecteurs;
}

/** Embed un seul texte. */
export async function embedUn(texte: string): Promise<number[]> {
  const [vecteur] = await embedBatch([texte]);
  return vecteur;
}

export const DIMENSION_EMBEDDING = DIMENSIONS;
