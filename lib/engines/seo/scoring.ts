import type { FindingSeo, PilierSeo, ScoresParPilier } from "./types";

/**
 * Transforme la liste de findings en scores 0-100 par pilier.
 *
 * Chaque pilier démarre à 100 et subit une pénalité par finding selon
 * la sévérité. Score global = moyenne pondérée des 5 piliers.
 */
export function calculerScores(findings: FindingSeo[]): {
  scores: ScoresParPilier;
  scoreGlobal: number;
} {
  const piliers: PilierSeo[] = [
    "technique",
    "contenu",
    "mots_cles",
    "performance",
    "mobile",
  ];

  const scores: ScoresParPilier = {
    technique: 100,
    contenu: 100,
    mots_cles: 100,
    performance: 100,
    mobile: 100,
  };

  const penalite: Record<FindingSeo["severite"], number> = {
    critique: 30,
    haute: 15,
    moyenne: 8,
    basse: 3,
    info: 0,
  };

  for (const f of findings) {
    scores[f.pilier] = Math.max(0, scores[f.pilier] - penalite[f.severite]);
  }

  // Pondération : technique 25 %, contenu 25 %, mots-clés 20 %,
  // performance 15 %, mobile 15 %.
  const ponderations: Record<PilierSeo, number> = {
    technique: 0.25,
    contenu: 0.25,
    mots_cles: 0.2,
    performance: 0.15,
    mobile: 0.15,
  };

  const scoreGlobal = Math.round(
    piliers.reduce((acc, p) => acc + scores[p] * ponderations[p], 0),
  );

  return { scores, scoreGlobal };
}
