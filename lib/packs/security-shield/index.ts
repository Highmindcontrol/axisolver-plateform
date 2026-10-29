/**
 * AXI Security Shield — API publique du pack.
 *
 * Doctrine 1 code 2 produits : ce module est consommé par AxiSolver
 * ET par le pack AxiHub. Toute la logique métier (accès, modes,
 * interventions, remédiations, client plugin WordPress) vit ici. Les
 * apps importent uniquement depuis `@/lib/packs/security-shield`.
 */

// Accès au site (SSH, WordPress REST, FTP, Cloudflare, …)
export {
  listerAcces,
  creerAcces,
  recupererCredentiels,
  supprimerAcces,
  marquerConnexion,
} from "./acces/repository";
export { testerConnexion } from "./acces/tester-connexion";
export type { ResultatConnexion } from "./acces/tester-connexion";
export type {
  AccesTypeId,
  AccesParametresPublics,
  AccesCredentiels,
  AccesResume,
} from "./acces/types";

// Modes de remédiation (désactivé / validation / automatique)
export {
  lireMode,
  changerMode,
  type ModeRemediation,
} from "./modes/repository";

// Journal des interventions AXI
export {
  listerInterventions,
  creerIntervention,
  marquerExecution,
  recupererIntervention,
  type Intervention,
  type StatutIntervention,
  type ModeDeclenche,
} from "./interventions/repository";
export { executerIntervention } from "./interventions/executer";

// Client du plugin WordPress AXI Security Shield
export {
  verifierPluginInstalle,
  appliquerRemediation,
  revoquerRemediation,
  type StatutPlugin,
  type ResultatRemediation,
} from "./plugin-wordpress/client";
export { verifierPluginPourSite } from "./plugin-wordpress/verifier";
