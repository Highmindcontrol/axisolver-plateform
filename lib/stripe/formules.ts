/**
 * Catalogue des formules AxiSolver standalone.
 *
 * Grille 3 niveaux calée sur le type de voix synthétique (voir
 * doctrine 28 oct 2026) :
 *   - Text Only (49€) : les 6 missions sans voix TTS
 *   - Classique (69€) : voix neuronale Azure
 *   - Premium (99€) : voix ultra-réaliste ElevenLabs
 *
 * Essai 14 jours sans CB sur les 3 formules, avec garde-fous :
 * 50 pages crawl max + 500 conv max + 15 min TTS max pendant l'essai.
 *
 * Les stripe_price_id doivent être posés dans Vercel comme variables
 * d'env après la création des produits dans Stripe Dashboard.
 */

export type SlugPlan = "text" | "classique" | "premium";

export type Formule = {
  slug: SlugPlan;
  nom: string;
  description: string;
  prixMensuelHt: number;
  priceIdVar: string;
  nbSitesMax: number;
  nbConversationsMoisMax: number;
  features: string[];
  essaiJours: number;
  cta: string;
};

export const FORMULES: Record<SlugPlan, Formule> = {
  text: {
    slug: "text",
    nom: "AxiSolver Text Only",
    description:
      "Toutes les missions AxiSolver sans la voix synthétique. L'intelligence et la veille complètes, en écrit uniquement.",
    prixMensuelHt: 49,
    priceIdVar: "STRIPE_PRICE_ID_TEXT",
    nbSitesMax: 1,
    nbConversationsMoisMax: 500,
    features: [
      "1 site",
      "500 conversations / mois",
      "Les 6 missions AxiSolver (SEO + Analytics + Shield + Ads inclus)",
      "Chat écrit multilingue",
      "Base de connaissances URL + PDF",
      "Rapports quotidiens par email",
      "Shield widget (rate limit + anti injection)",
    ],
    essaiJours: 14,
    cta: "Démarrer l'essai 14 jours",
  },
  classique: {
    slug: "classique",
    nom: "AxiSolver Classique",
    description:
      "Les 6 missions AxiSolver avec la voix neuronale Azure. Qualité vocale professionnelle, toutes langues européennes.",
    prixMensuelHt: 69,
    priceIdVar: "STRIPE_PRICE_ID_CLASSIQUE",
    nbSitesMax: 1,
    nbConversationsMoisMax: 400,
    features: [
      "1 site",
      "400 conversations vocales / mois",
      "Tout Text Only inclus",
      "Voix neuronale Azure",
      "Qualité vocale professionnelle",
      "Mention « Propulsé par » masquable",
      "Support prioritaire par email",
    ],
    essaiJours: 14,
    cta: "Démarrer l'essai 14 jours",
  },
  premium: {
    slug: "premium",
    nom: "AxiSolver Premium",
    description:
      "Les 6 missions AxiSolver avec la voix ElevenLabs ultra-réaliste. Idéal pour sites premium et marques fortes.",
    prixMensuelHt: 99,
    priceIdVar: "STRIPE_PRICE_ID_PREMIUM",
    nbSitesMax: 1,
    nbConversationsMoisMax: 300,
    features: [
      "1 site",
      "300 conversations vocales / mois",
      "Tout Classique inclus",
      "Voix ultra-réaliste ElevenLabs",
      "Rendu indiscernable d'un humain",
      "SLA 99,9 %",
      "Onboarding dédié",
    ],
    essaiJours: 14,
    cta: "Démarrer l'essai 14 jours",
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
