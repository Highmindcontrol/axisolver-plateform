/**
 * Options d'accueil cliquables affichées dans l'ailette gauche
 * dès que la conversation démarre, tant que le visiteur n'a pas
 * encore parlé. Au clic sur une option, la phrase est envoyée à
 * AXI comme si le visiteur l'avait tapée lui-même.
 *
 * V1 : hardcodé pour axisolver.app (notre propre vitrine).
 * V2 : chargé depuis la config du tenant (chaque client AxiSolver
 *      configure ses propres phrases depuis son dashboard, avec un
 *      catalogue d'idées pré-remplies par secteur à proposer).
 */

export type OptionAccueil = {
  /** Identifiant stable pour le tracking et le keying React. */
  id: string;
  /** Phrase envoyée à AXI telle quelle, écrite à la 1re personne. */
  libelle: string;
};

export const OPTIONS_ACCUEIL_DEFAUT: OptionAccueil[] = [
  {
    id: "en-savoir-plus",
    libelle:
      "J'ai entendu parler d'AxiSolver et je voulais en savoir plus.",
  },
  {
    id: "trafic-ventes",
    libelle:
      "Je cherche une solution pour augmenter mon trafic et mes ventes sur Internet.",
  },
  {
    id: "securiser-site",
    libelle: "Je voudrais sécuriser mon site.",
  },
  {
    id: "pub-adsense-adwords",
    libelle:
      "Je souhaite utiliser AdSense et AdWords pour faire de la pub, mais j'ai besoin d'aide.",
  },
];
