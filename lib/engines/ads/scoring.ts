import type { FindingAds, PilierAds, ScoresParPilier } from "./types";

/**
 * Scores 0-100 par pilier. Pondération :
 *   - Trackers 30 % (sans mesure, pas de pub)
 *   - Consentement 25 % (sans CMP conforme, risque juridique majeur)
 *   - Remarketing 25 % (le gros levier ROI)
 *   - Visibilité SERP 20 % (benchmark concurrentiel informatif)
 */
export function calculerScores(findings: FindingAds[]): {
  scores: ScoresParPilier;
  scoreGlobal: number;
} {
  const piliers: PilierAds[] = [
    "trackers",
    "consentement",
    "visibilite",
    "remarketing",
  ];

  const scores: ScoresParPilier = {
    trackers: 100,
    consentement: 100,
    visibilite: 100,
    remarketing: 100,
  };

  const penalite: Record<FindingAds["severite"], number> = {
    critique: 35,
    haute: 18,
    moyenne: 9,
    basse: 3,
    info: 0,
  };

  for (const f of findings) {
    scores[f.pilier] = Math.max(0, scores[f.pilier] - penalite[f.severite]);
  }

  const ponderations: Record<PilierAds, number> = {
    trackers: 0.3,
    consentement: 0.25,
    remarketing: 0.25,
    visibilite: 0.2,
  };

  const scoreGlobal = Math.round(
    piliers.reduce((acc, p) => acc + scores[p] * ponderations[p], 0),
  );

  return { scores, scoreGlobal };
}
