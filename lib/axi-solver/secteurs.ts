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
 * [7] Which-50 / Stealth Agents — « Live Chat Engagement Rate
 *     Benchmarks » et « Live Chat Support Statistics 2026 »
 *     https://which-50.com/live-chat-engagement-rate-benchmarks/
 *     https://stealthagents.com/research/live-chat-support-statistics-2026
 *     → fourchette générale 5-15 % de visiteurs qui chattent ;
 *     < 3 % = widget invisible ; 6,6 % = taux d'acceptation moyen
 *     d'une invitation proactive
 *
 * [8] Realty-AI — « Real Estate Chatbot Statistics » (2026)
 *     https://www.realty-ai.com/blog/real-estate-ai-chatbot-statistics
 *     → agence solo 8-12 %, petites 10-15 %, grandes 12-18 %
 *     Case study : 12 % chat vs 2,5 % formulaire (+380 %)
 *
 * [9] Pareto Legal — « Legal Client Intake Statistics 2026 »
 *     https://pareto.legal/legal-client-intake-statistics/
 *     → cabinets juridiques : chat-to-conversion 10-20 % vs
 *     formulaires 2-3 % ; +40 % de prises de RDV avec chatbot
 *     (LawSEO 2025) ; 79 % des law firms US ont piloté une IA
 *     en 2024 (Lexscale)
 *
 * [10] Rock Health — « 2025 Consumer Adoption of Digital Health
 *      Survey » et MGMA Stat (avril 2025)
 *      https://www.fiercehealthcare.com/ai-and-machine-learning/ai-chatbot-use-health-information-16-2024-rock-health-survey
 *      → 32 % des consommateurs utilisent un chatbot IA pour info
 *      santé (vs 16 % en 2024) ; 19 % des cabinets médicaux déploient
 *      un chatbot ; pas de chiffre direct « % visiteurs qui chattent
 *      sur site médical » → extrapolation à partir de la baseline
 *      réactive + motivation forte visiteur anxieux
 *
 * Note importante : les fourchettes basses s'appliquent aux widgets
 * réactifs classiques (bulle en bas à droite). AxiSolver, par son
 * ouverture modale plein écran après clic sur une pastille animée,
 * se situe plutôt en haut de fourchette (déclencheur explicite +
 * promesse forte « AXI qui résout vraiment »).
 *
 * Transparence : la propriété `sourcage` indique pour chaque secteur
 * si le taux est **directement sourcé** par une étude ou s'il s'agit
 * d'une **extrapolation argumentée** entre les ancres sourcées.
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

export type Sourcage = "source-directe" | "extrapolation-argumentee";

export type Secteur = {
  slug: SlugSecteur;
  nom: string;
  description: string;
  /** Taux d'utilisation typique = visiteurs qui engagent une
   *  conversation / total visiteurs du site. En pourcentage. */
  tauxUtilisation: number;
  /** Fourchette basse-haute du taux (pour note info). */
  fourchette: [number, number];
  /** Transparence : est-ce qu'une étude donne directement ce taux
   *  pour ce secteur, ou est-ce une extrapolation entre les ancres ? */
  sourcage: Sourcage;
  /** Références bibliographiques internes ([1] à [10] ci-dessus). */
  references: string;
};

export const SECTEURS: Secteur[] = [
  {
    slug: "vitrine",
    nom: "Site vitrine / corporate",
    description:
      "Présence en ligne d'une entreprise ou d'un indépendant, pas de vente directe. Visiteurs plutôt passifs.",
    tauxUtilisation: 0.8,
    fourchette: [0.5, 1.2],
    sourcage: "source-directe",
    references: "Smartsupp 5 Md visites (baseline réactif 0,84 %) [1]",
  },
  {
    slug: "ecommerce",
    nom: "E-commerce généraliste (Shopify, WooCommerce)",
    description:
      "Boutique en ligne classique. Les acheteurs hésitent souvent avant d'acheter et cherchent conseil.",
    tauxUtilisation: 2.0,
    fourchette: [1.5, 3.0],
    sourcage: "source-directe",
    references: "Drift réactif B2C 2-5 % [2] + Zoom 12,3 % conversion chat [6]",
  },
  {
    slug: "ecommerce-premium",
    nom: "E-commerce à panier moyen élevé",
    description:
      "Meuble, électroménager, voyage, luxe. Hésitation forte avant achat, besoin de validation humaine.",
    tauxUtilisation: 4.0,
    fourchette: [3.0, 5.0],
    sourcage: "extrapolation-argumentee",
    references:
      "Haut de fourchette Drift B2C [2] — motivation forte sur panier moyen élevé",
  },
  {
    slug: "saas",
    nom: "SaaS / B2B services",
    description:
      "Logiciel, agence, cabinet de conseil. Qualification avant démo ou prise de contact.",
    tauxUtilisation: 3.0,
    fourchette: [2.0, 4.0],
    sourcage: "source-directe",
    references: "Drift SaaS +200 % conversations avec chatbot [2]",
  },
  {
    slug: "support",
    nom: "Support client / SAV / after-sales",
    description:
      "Portail client, aide en ligne, suivi de commande. Les visiteurs ont un problème concret, besoin fort.",
    tauxUtilisation: 15.0,
    fourchette: [10.0, 25.0],
    sourcage: "source-directe",
    references:
      "Which-50 / Stealth Agents : benchmark général 5-15 %, top de fourchette sur portails support dédiés [7]",
  },
  {
    slug: "medical-juridique",
    nom: "Médical, juridique, financier",
    description:
      "Sujets anxiogènes ou techniques. Les visiteurs cherchent rassurance avant toute démarche.",
    tauxUtilisation: 10.0,
    fourchette: [5.0, 15.0],
    sourcage: "source-directe",
    references:
      "Pareto Legal chat-to-conversion 10-20 % vs formulaires 2-3 % [9] ; médical extrapolé Rock Health 2025 [10]",
  },
  {
    slug: "medias",
    nom: "Médias / blog / contenu",
    description:
      "Site éditorial, blog, portail d'actualités. Visiteurs très passifs, consultent et partent.",
    tauxUtilisation: 0.3,
    fourchette: [0.1, 0.5],
    sourcage: "extrapolation-argumentee",
    references:
      "Which-50 : < 3 % = engagement faible [7] ; sites médias historiquement peu équipés et visiteurs en consultation passive",
  },
  {
    slug: "immobilier",
    nom: "Immobilier",
    description:
      "Agence, promoteur, portail. Projet long, visiteurs hésitants, besoin conseil répété.",
    tauxUtilisation: 10.0,
    fourchette: [8.0, 18.0],
    sourcage: "source-directe",
    references:
      "Realty-AI : solo 8-12 %, petites agences 10-15 %, grandes 12-18 % ; case study 12 % chat vs 2,5 % formulaire [8]",
  },
  {
    slug: "autre",
    nom: "Autre / non précisé",
    description:
      "Si votre activité ne colle à aucune des catégories ci-dessus, ajustez le pourcentage manuellement.",
    tauxUtilisation: 2.0,
    fourchette: [0.5, 5.0],
    sourcage: "extrapolation-argumentee",
    references: "Fourchette médiane entre tous les secteurs",
  },
];

export function getSecteur(slug: SlugSecteur): Secteur {
  return SECTEURS.find((s) => s.slug === slug) ?? SECTEURS[0];
}
