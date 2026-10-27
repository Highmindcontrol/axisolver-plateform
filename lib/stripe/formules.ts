/**
 * Catalogue des formules AxiSolver standalone.
 *
 * Doctrine fondateur « pack vs standalone » : les prix standalone sont
 * plus élevés que les équivalents en pack AxiHub. Starter 39€ / Pro 59€
 * / Business 149€ par mois HT. Essai 14 jours sans CB sur Starter et
 * Pro, Business en démo + onboarding.
 *
 * Les stripe_price_id doivent être posés dans Vercel comme variables
 * d'env après la création des produits dans Stripe Dashboard.
 */

export type SlugPlan = "starter" | "pro" | "business";

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
  starter: {
    slug: "starter",
    nom: "AxiSolver Starter",
    description:
      "Pour un site unique avec un trafic modéré. Idéal pour tester AxiSolver en conditions réelles.",
    prixMensuelHt: 39,
    priceIdVar: "STRIPE_PRICE_ID_STARTER",
    nbSitesMax: 1,
    nbConversationsMoisMax: 500,
    features: [
      "1 site",
      "500 conversations / mois",
      "Base de connaissances URL + PDF",
      "Rapports quotidiens par email",
      "Audits mensuels SEO + Shield + Ads",
      "Shield widget (rate limit + anti injection)",
    ],
    essaiJours: 14,
    cta: "Démarrer l'essai 14 jours",
  },
  pro: {
    slug: "pro",
    nom: "AxiSolver Pro",
    description:
      "Pour agences, consultants et PME multi-sites. Supprime la mention « Propulsé par AxiSolver » du widget.",
    prixMensuelHt: 59,
    priceIdVar: "STRIPE_PRICE_ID_PRO",
    nbSitesMax: 3,
    nbConversationsMoisMax: 2500,
    features: [
      "3 sites",
      "2 500 conversations / mois",
      "Tout Starter inclus",
      "Mention « Propulsé par » masquable",
      "Voix premium ElevenLabs",
      "Support prioritaire par email",
    ],
    essaiJours: 14,
    cta: "Démarrer l'essai 14 jours",
  },
  business: {
    slug: "business",
    nom: "AxiSolver Business",
    description:
      "Pour les groupes multi-marques et les volumes importants. SLA + onboarding dédié.",
    prixMensuelHt: 149,
    priceIdVar: "STRIPE_PRICE_ID_BUSINESS",
    nbSitesMax: 10,
    nbConversationsMoisMax: 15000,
    features: [
      "10 sites",
      "15 000 conversations / mois",
      "Tout Pro inclus",
      "SLA 99,9 %",
      "Onboarding dédié",
      "Support téléphone + Slack partagé",
    ],
    essaiJours: 0,
    cta: "Demander une démo",
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
