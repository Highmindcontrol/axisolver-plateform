/**
 * Référentiel des types d'activité et des taux d'engagement associés,
 * utilisé par le simulateur public /parametrage-et-tarifs et sa
 * contrepartie admin dans la Forteresse.
 *
 * SOURCES CROISÉES (consultées 25 oct 2026) :
 *
 * [1] Smartsupp — « Analysing 5 billion website visits : how
 *     ecommerce customers use chat » (2024)
 *     https://www.smartsupp.com/blog/analysing-5-billion-website-visits-how-ecommerce-customers-use-chat/
 *     → baseline : 0,84 % de l'ensemble des visiteurs engagent une
 *     conversation avec un widget réactif typique
 *
 * [2] Drift — « State of Conversational Marketing » et benchmarks
 *     B2B SaaS. Chiffres clés repris par chatbot.com, dashly.io
 *     et conferbot.com (2024-2025)
 *     → widgets proactifs 8-15 %, réactifs 2-5 % des visiteurs,
 *     SaaS +200 % de conversations avec chatbot
 *
 * [3] Tidio — « Live Chat Statistics » (2024-2025)
 *     https://www.tidio.com/blog/live-chat-statistics/
 *     → chat users 2,8× plus susceptibles de convertir,
 *     +20 % de lift conversion moyen
 *
 * [4] Wisepops — « The State of Visitor Engagement on Shopify Stores »
 *     https://wisepops.com/blog/state-of-visitor-engagement-on-shopify-stores
 *     → 54 % des Shopify stores équipés en 2026 (vs 24 % en 2018)
 *
 * [5] Comm100 — « Live Chat Benchmark Report 2025 »
 *     → 73,77 % des chats désormais gérés par chatbots,
 *     CSAT moyen 4,24/5
 *
 * [6] Zoom — « 65+ chatbot statistics for customer service teams »
 *     (2025) https://www.zoom.com/en/blog/chatbot-statistics/
 *     → e-commerce : 12,3 % de conversion parmi les users ayant
 *     chatté vs 3,1 % sans chat
 *
 * Note importante : les fourchettes basses s'appliquent aux widgets
 * réactifs classiques (bulle en bas à droite). AxiSolver, par son
 * ouverture modale plein écran après clic sur une pastille animée,
 * se situe plutôt en haut de fourchette (déclencheur explicite +
 * promesse forte « AXI qui résout vraiment »).
 */

export type SlugSecteur =
  | "vitrine"
  | "ecommerce"
  | "ecommerce-premium"
  | "saas"
  | "support"
  | "medical-juridique"
  | "medias"
  | "immobilier"
  | "autre";

export type Secteur = {
  slug: SlugSecteur;
  nom: string;
  description: string;
  /** Taux d'utilisation typique = visiteurs qui engagent une
   *  conversation / total visiteurs du site. En pourcentage. */
  tauxUtilisation: number;
  /** Fourchette basse-haute du taux (pour note info). */
  fourchette: [number, number];
};

export const SECTEURS: Secteur[] = [
  {
    slug: "vitrine",
    nom: "Site vitrine / corporate",
    description:
      "Présence en ligne d'une entreprise ou d'un indépendant, pas de vente directe. Visiteurs plutôt passifs.",
    tauxUtilisation: 0.8,
    fourchette: [0.5, 1.2],
  },
  {
    slug: "ecommerce",
    nom: "E-commerce généraliste (Shopify, WooCommerce)",
    description:
      "Boutique en ligne classique. Les acheteurs hésitent souvent avant d'acheter et cherchent conseil.",
    tauxUtilisation: 2.0,
    fourchette: [1.5, 3.0],
  },
  {
    slug: "ecommerce-premium",
    nom: "E-commerce à panier moyen élevé",
    description:
      "Meuble, électroménager, voyage, luxe. Hésitation forte avant achat, besoin de validation humaine.",
    tauxUtilisation: 4.0,
    fourchette: [3.0, 5.0],
  },
  {
    slug: "saas",
    nom: "SaaS / B2B services",
    description:
      "Logiciel, agence, cabinet de conseil. Qualification avant démo ou prise de contact.",
    tauxUtilisation: 3.0,
    fourchette: [2.0, 4.0],
  },
  {
    slug: "support",
    nom: "Support client / SAV / after-sales",
    description:
      "Portail client, aide en ligne, suivi de commande. Les visiteurs ont un problème concret, besoin fort.",
    tauxUtilisation: 20.0,
    fourchette: [15.0, 30.0],
  },
  {
    slug: "medical-juridique",
    nom: "Médical, juridique, financier",
    description:
      "Sujets anxiogènes ou techniques. Les visiteurs cherchent rassurance avant toute démarche.",
    tauxUtilisation: 4.5,
    fourchette: [3.0, 6.0],
  },
  {
    slug: "medias",
    nom: "Médias / blog / contenu",
    description:
      "Site éditorial, blog, portail d'actualités. Visiteurs très passifs, consultent et partent.",
    tauxUtilisation: 0.3,
    fourchette: [0.1, 0.5],
  },
  {
    slug: "immobilier",
    nom: "Immobilier",
    description:
      "Agence, promoteur, portail. Projet long, visiteurs hésitants, besoin conseil répété.",
    tauxUtilisation: 3.0,
    fourchette: [2.0, 4.0],
  },
  {
    slug: "autre",
    nom: "Autre / non précisé",
    description:
      "Si votre activité ne colle à aucune des catégories ci-dessus, ajustez le pourcentage manuellement.",
    tauxUtilisation: 2.0,
    fourchette: [0.5, 5.0],
  },
];

export function getSecteur(slug: SlugSecteur): Secteur {
  return SECTEURS.find((s) => s.slug === slug) ?? SECTEURS[0];
}
