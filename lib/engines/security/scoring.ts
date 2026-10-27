import type { FindingSecurity, PilierSecurity, ScoresParPilier } from "./types";

/**
 * Scores 0-100 par pilier. Chaque pilier démarre à 100 et subit une
 * pénalité par finding selon la sévérité. Score global pondéré selon
 * l'importance métier :
 *   - TLS 25 % (critère vital)
 *   - Exposition 20 % (fuite de secrets = catastrophe)
 *   - Headers 20 % (défense XSS/CSRF/clickjacking)
 *   - Contenu 15 % (mixed content, forms http)
 *   - Cookies 10 % (session hijacking)
 *   - Réputation 10 % (HTTPS forcé)
 */
export function calculerScores(findings: FindingSecurity[]): {
  scores: ScoresParPilier;
  scoreGlobal: number;
} {
  const piliers: PilierSecurity[] = [
    "headers",
    "tls",
    "exposition",
    "cookies",
    "contenu",
    "reputation",
  ];

  const scores: ScoresParPilier = {
    headers: 100,
    tls: 100,
    exposition: 100,
    cookies: 100,
    contenu: 100,
    reputation: 100,
  };

  const penalite: Record<FindingSecurity["severite"], number> = {
    critique: 40,
    haute: 20,
    moyenne: 10,
    basse: 4,
    info: 0,
  };

  for (const f of findings) {
    scores[f.pilier] = Math.max(0, scores[f.pilier] - penalite[f.severite]);
  }

  const ponderations: Record<PilierSecurity, number> = {
    tls: 0.25,
    exposition: 0.2,
    headers: 0.2,
    contenu: 0.15,
    cookies: 0.1,
    reputation: 0.1,
  };

  const scoreGlobal = Math.round(
    piliers.reduce((acc, p) => acc + scores[p] * ponderations[p], 0),
  );

  return { scores, scoreGlobal };
}
