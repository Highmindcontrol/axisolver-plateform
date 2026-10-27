import type { ConfigSiteChargee } from "./charger-config-site";

/**
 * Vérifie que l'origine de la requête (header Origin) est autorisée
 * pour le site cible.
 *
 * Règles :
 *   · Si le site n'a aucun domaine autorisé → refus par défaut
 *     (sauf localhost dev)
 *   · Si Origin matche un domaine autorisé (exact ou sous-domaine) → OK
 *   · localhost toujours autorisé en dev (NODE_ENV !== production)
 *
 * Nécessaire pour empêcher qu'un tiers malveillant utilise l'instance
 * AxiSolver d'un autre site (vol de quota + usurpation).
 */
export function verifierOrigine(
  origine: string | null,
  config: ConfigSiteChargee,
): { autorise: boolean; raison?: string } {
  // Dev : localhost toujours OK
  if (process.env.NODE_ENV !== "production") {
    if (
      !origine ||
      origine.includes("localhost") ||
      origine.includes("127.0.0.1")
    ) {
      return { autorise: true };
    }
  }

  if (!origine) {
    return { autorise: false, raison: "Origin manquant" };
  }

  let hostOrigine: string;
  try {
    hostOrigine = new URL(origine).hostname.toLowerCase();
  } catch {
    return { autorise: false, raison: "Origin invalide" };
  }

  const domaines = [
    config.domainePrincipal.toLowerCase(),
    ...config.domainesAutorises.map((d) => d.toLowerCase()),
  ];

  for (const d of domaines) {
    if (!d) continue;
    if (hostOrigine === d) return { autorise: true };
    if (hostOrigine.endsWith(`.${d}`)) return { autorise: true };
  }

  return {
    autorise: false,
    raison: `Origin ${hostOrigine} non autorisé pour ${config.slug}`,
  };
}
