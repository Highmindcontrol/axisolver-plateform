/**
 * Catalogue des formules AxiSolver standalone.
 *
 * Grille 2×2 (voir doctrine 28 oct 2026) : voix oui/non × trafic
 * petit/grand. La voix neuronale Azure est abandonnée — on garde
 * ElevenLabs comme seule voix premium, ou pas de voix du tout.
 *
 *   - Text Only S (49 €) : écrit seul, 300 conv/mois
 *   - Text Only L (69 €) : écrit seul, 500 conv/mois
 *   - Premium S  (99 €) : voix ElevenLabs, 300 conv/mois — PHARE
 *   - Premium L (129 €) : voix ElevenLabs, 500 conv/mois
 *
 * Le palier à 10 000 visiteurs/mois est un conseil, pas une
 * contrainte contractuelle — le simulateur recommande, le client
 * décide. Packs supplémentaires par 100 conv à la demande
 * (10 € pour Text, 20 € pour Premium), reportables jusqu'à 3 mois
 * sur le solde non consommé.
 *
 * Satisfait ou remboursé 30 jours sans question (débit immédiat,
 * remboursement intégral si demandé dans les 30 premiers jours).
 *
 * Les stripe_price_id doivent être posés dans Vercel comme variables
 * d'env après la création des produits dans Stripe Dashboard.
 */

export type SlugPlan = "text-s" | "text-l" | "premium-s" | "premium-l";

export type Formule = {
  slug: SlugPlan;
  nom: string;
  description: string;
  prixMensuelHt: number;
  priceIdVar: string;
  nbSitesMax: number;
  nbConversationsMoisMax: number;
  prixPackSuppHt: number;
  volumeConvPackSupp: number;
  features: string[];
  essaiJours: number;
  cta: string;
  phare?: boolean;
};

export const FORMULES: Record<SlugPlan, Formule> = {
  "text-s": {
    slug: "text-s",
    nom: "AxiSolver Text Only 300",
    description:
      "Toutes les missions AxiSolver sans voix synthétique. Pour les sites de moins de 10 000 visiteurs mensuels.",
    prixMensuelHt: 49,
    priceIdVar: "STRIPE_PRICE_ID_TEXT_S",
    nbSitesMax: 1,
    nbConversationsMoisMax: 300,
    prixPackSuppHt: 10,
    volumeConvPackSupp: 100,
    features: [
      "1 site",
      "300 conversations écrites / mois",
      "Les 6 missions AxiSolver (SEO + Analytics + Shield + Ads inclus)",
      "Chat écrit multilingue",
      "Base de connaissances URL + PDF",
      "Rapports quotidiens par email",
      "Shield widget (rate limit + anti injection)",
      "Pack supp. de 100 conv à 10 € HT",
    ],
    essaiJours: 0,
    cta: "Souscrire maintenant",
  },
  "text-l": {
    slug: "text-l",
    nom: "AxiSolver Text Only 500",
    description:
      "Toutes les missions AxiSolver sans voix synthétique. Pour les sites au-delà de 10 000 visiteurs mensuels.",
    prixMensuelHt: 69,
    priceIdVar: "STRIPE_PRICE_ID_TEXT_L",
    nbSitesMax: 1,
    nbConversationsMoisMax: 500,
    prixPackSuppHt: 10,
    volumeConvPackSupp: 100,
    features: [
      "1 site",
      "500 conversations écrites / mois",
      "Tout Text Only S inclus",
      "Volume adapté aux sites à forte audience",
      "Pack supp. de 100 conv à 10 € HT",
    ],
    essaiJours: 0,
    cta: "Souscrire maintenant",
  },
  "premium-s": {
    slug: "premium-s",
    nom: "AxiSolver Premium 300",
    description:
      "Les 6 missions avec la voix ElevenLabs ultra-réaliste. Idéal pour sites de moins de 10 000 visiteurs mensuels.",
    prixMensuelHt: 99,
    priceIdVar: "STRIPE_PRICE_ID_PREMIUM_S",
    nbSitesMax: 1,
    nbConversationsMoisMax: 300,
    prixPackSuppHt: 20,
    volumeConvPackSupp: 100,
    phare: true,
    features: [
      "1 site",
      "300 conversations vocales / mois",
      "Tout Text Only inclus",
      "Voix ElevenLabs ultra-réaliste, indiscernable d'un humain",
      "SLA 99,9 %",
      "Onboarding dédié",
      "Mention « Propulsé par » masquable",
      "Pack supp. de 100 conv à 20 € HT",
    ],
    essaiJours: 0,
    cta: "Souscrire maintenant",
  },
  "premium-l": {
    slug: "premium-l",
    nom: "AxiSolver Premium 500",
    description:
      "Les 6 missions avec la voix ElevenLabs ultra-réaliste. Pour sites au-delà de 10 000 visiteurs mensuels.",
    prixMensuelHt: 129,
    priceIdVar: "STRIPE_PRICE_ID_PREMIUM_L",
    nbSitesMax: 1,
    nbConversationsMoisMax: 500,
    prixPackSuppHt: 20,
    volumeConvPackSupp: 100,
    features: [
      "1 site",
      "500 conversations vocales / mois",
      "Tout Premium S inclus",
      "Volume adapté aux sites à forte audience",
      "Pack supp. de 100 conv à 20 € HT",
    ],
    essaiJours: 0,
    cta: "Souscrire maintenant",
  },
};

/**
 * Résout le `stripe_price_id` d'un plan via la variable d'environnement
 * correspondante. Retourne null si la variable n'est pas posée — permet
 * à l'UI d'afficher le plan comme « bientôt disponible » plutôt que
 * de planter.
 */
export function priceIdDePlan(slug: SlugPlan): string | null {
  const formule = FORMULES[slug];
  if (!formule) return null;
  return process.env[formule.priceIdVar] ?? null;
}

/**
 * Donne le plan correspondant à un stripe_price_id. Utilisé par le
 * webhook pour mapper le checkout.session.completed vers le bon plan.
 */
export function planDePriceId(priceId: string): SlugPlan | null {
  for (const slug of Object.keys(FORMULES) as SlugPlan[]) {
    if (priceIdDePlan(slug) === priceId) return slug;
  }
  return null;
}
