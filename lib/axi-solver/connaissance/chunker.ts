/**
 * Chunker — découpe un texte en blocs sémantiques pour embedding.
 *
 * Stratégie : découpe par paragraphes (double saut de ligne), fusionne
 * jusqu'à atteindre une taille cible (~1600 chars ≈ 400 tokens avec
 * ratio 4 chars/token côté FR/EN), overlap de 200 chars entre chunks
 * voisins pour que la frontière ne coupe pas une info.
 *
 * Pas de tokenizer précis — approximation volontaire, l'embedding
 * OpenAI tolère les variations. Si une phrase unique dépasse la taille
 * cible, on la découpe à mi-chemin au prochain espace.
 */

export type Chunk = {
  texte: string;
  position: number;
  tokensApprox: number;
};

const TAILLE_CIBLE_CHARS = 1600;
const OVERLAP_CHARS = 200;
const TAILLE_MAX_CHARS = 2400;

export function chunker(texte: string): Chunk[] {
  const normalise = texte
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalise) return [];

  // Découpe par paragraphes puis fusion jusqu'à taille cible
  const paragraphes = normalise.split(/\n\n+/);
  const chunks: string[] = [];
  let buffer = "";

  for (const p of paragraphes) {
    const avecBuffer = buffer ? buffer + "\n\n" + p : p;

    if (avecBuffer.length <= TAILLE_CIBLE_CHARS) {
      buffer = avecBuffer;
      continue;
    }

    // Flush le buffer actuel
    if (buffer) {
      chunks.push(buffer);
      buffer = "";
    }

    // Si le nouveau paragraphe seul dépasse la cible, découpe forcée
    if (p.length > TAILLE_MAX_CHARS) {
      const sousChunks = decouperForce(p);
      chunks.push(...sousChunks);
    } else {
      buffer = p;
    }
  }
  if (buffer) chunks.push(buffer);

  // Ajoute overlap entre chunks voisins
  const avecOverlap: string[] = chunks.map((c, i) => {
    if (i === 0) return c;
    const precedent = chunks[i - 1];
    const queue = precedent.slice(-OVERLAP_CHARS);
    return queue + "\n\n" + c;
  });

  return avecOverlap.map((texte, position) => ({
    texte,
    position,
    tokensApprox: Math.ceil(texte.length / 4),
  }));
}

function decouperForce(texte: string): string[] {
  const result: string[] = [];
  let reste = texte;
  while (reste.length > TAILLE_MAX_CHARS) {
    let coupure = reste.lastIndexOf(" ", TAILLE_CIBLE_CHARS);
    if (coupure < TAILLE_CIBLE_CHARS / 2) coupure = TAILLE_CIBLE_CHARS;
    result.push(reste.slice(0, coupure).trim());
    reste = reste.slice(coupure).trim();
  }
  if (reste) result.push(reste);
  return result;
}
