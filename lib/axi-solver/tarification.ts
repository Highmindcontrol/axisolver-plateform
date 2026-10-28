/**
 * Logique de recommandation AxiSolver partagée (grille 2×2
 * voix × trafic, doctrine 28 oct 2026).
 *
 * Utilisée par :
 *   - le simulateur / questionnaire public /parametrage-et-tarifs
 *   - le tool AXI `estimer_tarif_axisolver` quand le visiteur
 *     passe par le widget
 *
 * La grille a 4 formules (voir lib/stripe/formules.ts). Cette
 * fonction NE calcule PAS de prix dynamique — les prix sont fixes
 * et affichés sur les cartes publiques. Elle se contente de
 * recommander LAQUELLE des 4 formules convient le mieux au profil
 * du visiteur, selon 3 signaux :
 *   1. Type de site (secteur) → détermine le taux d'engagement
 *   2. Volume de visiteurs mensuels → détermine le palier S / L
 *   3. Préférence vocale (binaire) → détermine Text ou Premium
 *
 * Palier soft à 10 000 visiteurs/mois (conseil, pas contrainte).
 */

import { SECTEURS, type SlugSecteur, type Secteur } from "./secteurs";

export type SlugFormule =
  | "text-s"
  | "text-l"
  | "premium-s"
  | "premium-l"
  | "pack-web-s"
  | "pack-web-l";

export type UsagePrincipal =
  | "support"
  | "vente"
  | "leads"
  | "vitrine"
  | "mixte";

export type TailleEquipe = "aucune" | "une" | "petite" | "grande";

export type PreferenceVoix = "voix" | "ecrit";

/** Profil complet collecté par le questionnaire ou par AXI. */
export type ProfilProspect = {
  aSite: boolean;
  siteUrl?: string;
  visiteursMois: number;
  secteurSlug: SlugSecteur;
  usagePrincipal: UsagePrincipal;
  tailleEquipe: TailleEquipe;
  preferenceVoix: PreferenceVoix;
};

/** Palier de trafic qui fait basculer S → L. */
export const PALIER_TRAFIC = 10000;

export type Formule = {
  slug: SlugFormule;
  nom: string;
  sousTitre: string;
  voix: "Écrit seul" | "ElevenLabs";
  trafic: "Petit (< 10 000 visiteurs/mois)" | "Grand (≥ 10 000 visiteurs/mois)";
  prixMensuelHt: number;
  /** Prix normal après la première année (early adopter → tarif plein). */
  prixNormalFuturHt: number;
  conversationsIncluses: number;
  prixPackSuppHt: number;
  volumeConvPackSupp: number;
  phare?: boolean;
};

export const FORMULES: Formule[] = [
  {
    slug: "text-s",
    nom: "AxiSolver Text Only 300",
    sousTitre: "L'essentiel écrit, pour les sites qui démarrent.",
    voix: "Écrit seul",
    trafic: "Petit (< 10 000 visiteurs/mois)",
    prixMensuelHt: 49,
    prixNormalFuturHt: 69,
    conversationsIncluses: 300,
    prixPackSuppHt: 10,
    volumeConvPackSupp: 100,
  },
  {
    slug: "text-l",
    nom: "AxiSolver Text Only 500",
    sousTitre: "L'essentiel écrit, pour les sites à forte audience.",
    voix: "Écrit seul",
    trafic: "Grand (≥ 10 000 visiteurs/mois)",
    prixMensuelHt: 69,
    prixNormalFuturHt: 89,
    conversationsIncluses: 500,
    prixPackSuppHt: 10,
    volumeConvPackSupp: 100,
  },
  {
    slug: "premium-s",
    nom: "AxiSolver Premium 300",
    sousTitre: "La voix ElevenLabs, pour la majorité des sites.",
    voix: "ElevenLabs",
    trafic: "Petit (< 10 000 visiteurs/mois)",
    prixMensuelHt: 99,
    prixNormalFuturHt: 139,
    conversationsIncluses: 300,
    prixPackSuppHt: 20,
    volumeConvPackSupp: 100,
    phare: true,
  },
  {
    slug: "premium-l",
    nom: "AxiSolver Premium 500",
    sousTitre: "La voix ElevenLabs, pour les sites qui scalent.",
    voix: "ElevenLabs",
    trafic: "Grand (≥ 10 000 visiteurs/mois)",
    prixMensuelHt: 129,
    prixNormalFuturHt: 169,
    conversationsIncluses: 500,
    prixPackSuppHt: 20,
    volumeConvPackSupp: 100,
  },
  {
    slug: "pack-web-s",
    nom: "Pack Web Marketing 300",
    sousTitre: "5 landing pages + AxiSolver Premium, clé en main.",
    voix: "ElevenLabs",
    trafic: "Petit (< 10 000 visiteurs/mois)",
    prixMensuelHt: 149,
    prixNormalFuturHt: 199,
    conversationsIncluses: 300,
    prixPackSuppHt: 20,
    volumeConvPackSupp: 100,
  },
  {
    slug: "pack-web-l",
    nom: "Pack Web Marketing 500",
    sousTitre: "5 landing pages + AxiSolver Premium, pour campagnes à fort trafic.",
    voix: "ElevenLabs",
    trafic: "Grand (≥ 10 000 visiteurs/mois)",
    prixMensuelHt: 199,
    prixNormalFuturHt: 269,
    conversationsIncluses: 500,
    prixPackSuppHt: 20,
    volumeConvPackSupp: 100,
  },
];

/**
 * Multiplicateur appliqué sur le taux d'utilisation du secteur,
 * selon l'usage réel du site. Un site vitrine corporate utilise
 * son widget beaucoup moins qu'un portail support actif.
 */
const MULTIPLICATEUR_USAGE: Record<UsagePrincipal, number> = {
  support: 1.4,
  vente: 1.0,
  leads: 1.1,
  vitrine: 0.5,
  mixte: 1.0,
};

export function getFormule(slug: SlugFormule): Formule {
  return FORMULES.find((f) => f.slug === slug) ?? FORMULES[2];
}

export function getSecteur(slug: SlugSecteur): Secteur {
  return SECTEURS.find((s) => s.slug === slug) ?? SECTEURS[0];
}

/**
 * Taux d'utilisation effectif, en pourcentage.
 */
export function tauxEffectif(
  secteurSlug: SlugSecteur,
  usage: UsagePrincipal,
): number {
  const secteur = getSecteur(secteurSlug);
  const taux = secteur.tauxUtilisation * MULTIPLICATEUR_USAGE[usage];
  return Math.min(40, Math.max(0.1, Number(taux.toFixed(2))));
}

export function conversationsEstimees(
  visiteursMois: number,
  tauxPct: number,
): number {
  return Math.ceil(visiteursMois * (tauxPct / 100));
}

/**
 * Formule recommandée pour le profil donné.
 *
 * Logique :
 *   1. Préférence voix → axe Text ou Premium
 *   2. Volume visiteurs vs palier 10 000 → axe S ou L
 *
 * Le volume est un soft-indicator : si le prospect a 11 000 visiteurs,
 * on lui conseille le palier Grand, mais rien ne l'empêche de prendre
 * Petit et de payer des packs supplémentaires si le dépassement est
 * faible. Le dashboard l'alertera si son usage réel dépasse son forfait.
 */
export function recommanderFormule(profil: ProfilProspect): SlugFormule {
  const base = profil.preferenceVoix === "voix" ? "premium" : "text";
  const taille = profil.visiteursMois >= PALIER_TRAFIC ? "l" : "s";
  return `${base}-${taille}` as SlugFormule;
}

export function formaterEuros(n: number): string {
  return `${n.toLocaleString("fr-FR")} €`;
}

export function formaterVisiteurs(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    })} k`;
  }
  return n.toLocaleString("fr-FR");
}

export const LIBELLES_USAGE: Record<UsagePrincipal, string> = {
  support: "Support client / SAV / aide",
  vente: "Vente en ligne (e-commerce)",
  leads: "Qualification de leads / prise de contact",
  vitrine: "Présence corporate / vitrine",
  mixte: "Plusieurs usages combinés",
};

export const LIBELLES_EQUIPE: Record<TailleEquipe, string> = {
  aucune: "Personne, pour l'instant",
  une: "Une personne (moi, ou un.e assistant.e)",
  petite: "Une petite équipe (2 à 5 personnes)",
  grande: "Une vraie équipe (plus de 5 personnes)",
};

export const LIBELLES_VOIX: Record<PreferenceVoix, string> = {
  voix: "Avec voix (ElevenLabs ultra-réaliste)",
  ecrit: "Écrit uniquement (sans voix synthétique)",
};

export const RANGES_VISITEURS: Array<{
  slug: string;
  libelle: string;
  valeur: number;
}> = [
  { slug: "mini", libelle: "Moins de 1 000", valeur: 500 },
  { slug: "petit", libelle: "1 000 à 5 000", valeur: 3000 },
  { slug: "moyen", libelle: "5 000 à 20 000", valeur: 10000 },
  { slug: "gros", libelle: "20 000 à 100 000", valeur: 50000 },
  { slug: "trafic-fort", libelle: "Plus de 100 000", valeur: 150000 },
];
