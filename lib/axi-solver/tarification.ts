/**
 * Logique de tarification AxiSolver partagée.
 *
 * Utilisée par :
 *   - le questionnaire guidé public (/parametrage-et-tarifs)
 *   - l'ancien simulateur à sliders (/parametrage-et-tarifs/_simulateur.tsx)
 *   - le tool AXI `estimer_tarif_axisolver` quand le visiteur passe par le widget
 *
 * Logique :
 *   taux effectif = taux typique du secteur × multiplicateur usage
 *   conversations/mois = visiteurs × taux / 100
 *   prix = abonnement de base + (conversations - incluses) × prix_supplément
 */

import { SECTEURS, type SlugSecteur, type Secteur } from "./secteurs";

export type SlugFormule = "text" | "classique" | "premium";

export type UsagePrincipal =
  | "support" // Support client / SAV / aide
  | "vente" // Vente en ligne (e-commerce)
  | "leads" // Génération / qualification de leads (B2B, services)
  | "vitrine" // Présence corporate, pas de vente directe
  | "mixte"; // Plusieurs usages combinés

export type TailleEquipe =
  | "aucune" // Personne pour répondre aujourd'hui
  | "une" // 1 personne (le dirigeant ou un.e assistant.e)
  | "petite" // 2 à 5 personnes
  | "grande"; // Plus de 5 personnes

/** Profil complet collecté par le questionnaire ou par AXI. */
export type ProfilProspect = {
  aSite: boolean;
  siteUrl?: string;
  visiteursMois: number;
  secteurSlug: SlugSecteur;
  usagePrincipal: UsagePrincipal;
  tailleEquipe: TailleEquipe;
};

export type Formule = {
  slug: SlugFormule;
  nom: string;
  sousTitre: string;
  voix: string;
  abonnementBase: number;
  conversationsIncluses: number;
  prixConversationSupp: number;
  points: string[];
};

export const FORMULES: Formule[] = [
  {
    slug: "text",
    nom: "AxiSolver Text Only",
    sousTitre: "L'essentiel sans la voix.",
    voix: "Écrit uniquement",
    abonnementBase: 39,
    conversationsIncluses: 200,
    prixConversationSupp: 0.08,
    points: [
      "Les six missions AxiSolver",
      "Chat écrit multilingue",
      "Compréhension et résolution complètes",
      "Aucune voix synthétique",
    ],
  },
  {
    slug: "classique",
    nom: "AxiSolver Classique",
    sousTitre: "Voix neuronale premium Azure.",
    voix: "Voix neuronale Azure",
    abonnementBase: 59,
    conversationsIncluses: 150,
    prixConversationSupp: 0.35,
    points: [
      "Les six missions AxiSolver",
      "Chat écrit + voix synthétique Azure",
      "Qualité vocale professionnelle",
      "Toutes langues européennes",
    ],
  },
  {
    slug: "premium",
    nom: "AxiSolver Premium",
    sousTitre: "La voix bluffante ElevenLabs.",
    voix: "Voix ultra-réaliste ElevenLabs",
    abonnementBase: 149,
    conversationsIncluses: 100,
    prixConversationSupp: 1.8,
    points: [
      "Les six missions AxiSolver",
      "Chat écrit + voix ElevenLabs",
      "Rendu vocal indiscernable d'un humain",
      "Idéal pour sites premium et marques fortes",
    ],
  },
];

/**
 * Multiplicateur appliqué sur le taux d'utilisation du secteur,
 * selon l'usage réel du site. Un site vitrine corporate utilise
 * son widget beaucoup moins qu'un portail support actif.
 */
const MULTIPLICATEUR_USAGE: Record<UsagePrincipal, number> = {
  support: 1.4, // Besoin fort → engagement supérieur
  vente: 1.0, // Baseline secteur
  leads: 1.1, // Prospect pré-chaud, cherche info
  vitrine: 0.5, // Visiteur passif, peu de besoin exprimé
  mixte: 1.0, // Baseline secteur
};

export function getFormule(slug: SlugFormule): Formule {
  return FORMULES.find((f) => f.slug === slug) ?? FORMULES[1];
}

export function getSecteur(slug: SlugSecteur): Secteur {
  return SECTEURS.find((s) => s.slug === slug) ?? SECTEURS[0];
}

/**
 * Taux d'utilisation effectif, en pourcentage.
 * Combine le taux du secteur et l'usage principal du site.
 */
export function tauxEffectif(
  secteurSlug: SlugSecteur,
  usage: UsagePrincipal,
): number {
  const secteur = getSecteur(secteurSlug);
  const taux = secteur.tauxUtilisation * MULTIPLICATEUR_USAGE[usage];
  // Garde-fou : jamais plus de 40 % (hors contexte exceptionnel)
  return Math.min(40, Math.max(0.1, Number(taux.toFixed(2))));
}

export function conversationsEstimees(
  visiteursMois: number,
  tauxPct: number,
): number {
  return Math.ceil(visiteursMois * (tauxPct / 100));
}

export function calculerPrix(
  formule: Formule,
  visiteursMois: number,
  tauxPct: number,
): number {
  const conv = conversationsEstimees(visiteursMois, tauxPct);
  const sup = Math.max(0, conv - formule.conversationsIncluses);
  return Math.round(formule.abonnementBase + sup * formule.prixConversationSupp);
}

/**
 * Formule recommandée selon le profil complet.
 *
 * Heuristique :
 *   - Pas d'équipe + volume suffisant → voix (Classique au minimum)
 *     car le visiteur va s'adresser à AXI sans alternative humaine
 *   - Support client fort → Premium (voix ultra-réaliste = confiance)
 *   - E-commerce premium / médical / juridique → Premium (image de marque)
 *   - Petit volume (< 500 conv/mois) → Text Only suffit
 *   - Vitrine passive → Text Only (coût minimal)
 */
export function recommanderFormule(profil: ProfilProspect): SlugFormule {
  const taux = tauxEffectif(profil.secteurSlug, profil.usagePrincipal);
  const conv = conversationsEstimees(profil.visiteursMois, taux);

  const premiumSecteurs: SlugSecteur[] = [
    "ecommerce-premium",
    "medical-juridique",
    "immobilier",
  ];

  if (profil.usagePrincipal === "support" && conv > 200) return "premium";
  if (premiumSecteurs.includes(profil.secteurSlug) && conv > 100) return "premium";
  if (profil.usagePrincipal === "vitrine" && conv < 300) return "text";
  if (conv < 150) return "text";
  if (profil.tailleEquipe === "aucune" && conv > 50) return "classique";
  return "classique";
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

/** Libellé lisible pour chaque usage principal. */
export const LIBELLES_USAGE: Record<UsagePrincipal, string> = {
  support: "Support client / SAV / aide",
  vente: "Vente en ligne (e-commerce)",
  leads: "Qualification de leads / prise de contact",
  vitrine: "Présence corporate / vitrine",
  mixte: "Plusieurs usages combinés",
};

/** Libellé lisible pour chaque taille d'équipe. */
export const LIBELLES_EQUIPE: Record<TailleEquipe, string> = {
  aucune: "Personne, pour l'instant",
  une: "Une personne (moi, ou un.e assistant.e)",
  petite: "Une petite équipe (2 à 5 personnes)",
  grande: "Une vraie équipe (plus de 5 personnes)",
};

/** Fourchettes prédéfinies de volume de visiteurs mensuels. */
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
