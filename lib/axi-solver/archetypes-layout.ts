/**
 * Catalogue des 6 archétypes de mise en page du widget AxiSolver.
 *
 * Chaque archétype définit la structure des deux ailettes (gauche +
 * droite) autour du chat central. Le chat reste identique dans tous
 * les archétypes — seules les ailettes s'adaptent au métier du site.
 *
 * Doctrine : un seul layout par site, choisi à la création (mapping
 * automatique depuis le secteur) et modifiable depuis les
 * Paramétrages du site. Les sources de données externes (API
 * Shopify, WordPress, Google Sheet…) seront branchées plus tard pour
 * les archétypes qui en ont besoin — en V1 les ailettes rendent du
 * contenu placeholder quand aucune source n'est connectée.
 */

export type ArchetypeLayoutSlug =
  | "boutique"
  | "prise-rdv"
  | "fiche-bien"
  | "reservation"
  | "catalogue"
  | "classique";

export type ArchetypeLayout = {
  slug: ArchetypeLayoutSlug;
  nom: string;
  description: string;
  /** Secteurs pour lesquels cet archétype est le meilleur choix. */
  secteursCibles: string[];
  /** Résumé court de ce que contient l'ailette gauche. */
  ailetteGauche: string;
  /** Résumé court de ce que contient l'ailette droite. */
  ailetteDroite: string;
  /** Sources de données externes utiles (indicatif V1). */
  sourcesPossibles: string[];
};

export const CATALOGUE_ARCHETYPES: ArchetypeLayout[] = [
  {
    slug: "boutique",
    nom: "Boutique",
    description:
      "Vente en ligne. Vos visiteurs explorent votre catalogue dans l'ailette gauche et pilotent panier / suivi commande dans l'ailette droite — pendant qu'AXI les conseille au centre.",
    secteursCibles: ["e_commerce"],
    ailetteGauche:
      "Grille produits (photo + prix + CTA « voir »), barre de recherche + filtres.",
    ailetteDroite:
      "Panier en cours · articles favoris · suivi de commande · codes promo.",
    sourcesPossibles: [
      "API Shopify",
      "WooCommerce REST",
      "PrestaShop API",
      "Flux XML / CSV",
      "Saisie manuelle",
    ],
  },
  {
    slug: "prise-rdv",
    nom: "Prise de RDV",
    description:
      "Prestations avec rendez-vous. AXI pré-qualifie la demande au centre, le visiteur choisit un expert et un créneau sur les ailettes.",
    secteursCibles: ["services_professionnels", "medical_para_medical"],
    ailetteGauche:
      "Liste praticiens / experts (photo + spécialité + prix indicatif), filtres.",
    ailetteDroite:
      "Calendrier de créneaux · formulaire pré-RDV · récap du rendez-vous choisi.",
    sourcesPossibles: [
      "Calendly",
      "Google Calendar",
      "Doctolib",
      "Saisie manuelle",
    ],
  },
  {
    slug: "fiche-bien",
    nom: "Fiche bien",
    description:
      "Marché de l'immobilier. Résultats de recherche à gauche, détails complets du bien sélectionné à droite — pendant qu'AXI répond aux questions sur ce bien.",
    secteursCibles: ["immobilier"],
    ailetteGauche:
      "Résultats recherche (photo + m² + prix + localisation), filtres achat / location / estimation.",
    ailetteDroite:
      "Fiche détaillée du bien actif · diaporama · plan · demande de visite.",
    sourcesPossibles: [
      "SeLoger / Logic-Immo (CSV)",
      "API de votre CRM immobilier",
      "Saisie manuelle",
    ],
  },
  {
    slug: "reservation",
    nom: "Réservation",
    description:
      "Restaurant, hôtel, salle. Carte / menu / chambres à gauche, récap réservation à droite — AXI prend la commande au centre, en texte ou en voix.",
    secteursCibles: ["restauration"],
    ailetteGauche:
      "Carte / menu / chambres (photo + description + prix), horaires d'ouverture.",
    ailetteDroite:
      "Résumé réservation : date, heure, couverts / chambres, allergies, demande spéciale.",
    sourcesPossibles: [
      "TheFork",
      "OpenTable",
      "Booking.com",
      "Saisie manuelle",
    ],
  },
  {
    slug: "catalogue",
    nom: "Catalogue",
    description:
      "Médias, formations, blog. Les visiteurs parcourent vos contenus à gauche, retrouvent leurs bookmarks à droite — AXI leur recommande ce qui correspond à leur question.",
    secteursCibles: ["formation_education", "tech_saas"],
    ailetteGauche:
      "Articles · cours · ressources (photo + titre + durée / difficulté), filtres par thème.",
    ailetteDroite:
      "Bookmarks · historique de lecture · progression (si cours en ligne).",
    sourcesPossibles: [
      "WordPress REST",
      "Ghost / Substack",
      "LMS (Thinkific, Teachable…)",
      "Flux RSS",
      "Saisie manuelle",
    ],
  },
  {
    slug: "classique",
    nom: "Classique",
    description:
      "Site institutionnel / vitrine. L'archétype par défaut : les visiteurs cliquent sur des phrases d'accueil pour démarrer la conversation, et AXI leur répond en gardant trace de la session.",
    secteursCibles: ["association", "generaliste"],
    ailetteGauche: "Phrases d'accueil cliquables (vitrine de ce qu'AXI sait).",
    ailetteDroite: "Carnet de session : résumé des échanges, prochaines étapes.",
    sourcesPossibles: ["Aucune — contenu statique configuré dans le dashboard"],
  },
];

/** Résolution tolérante : accepte le slug ou retourne null. */
export function getArchetype(
  slug: string | null | undefined,
): ArchetypeLayout | null {
  if (!slug) return null;
  return CATALOGUE_ARCHETYPES.find((a) => a.slug === slug) ?? null;
}

/**
 * Mapping secteur → archétype par défaut. Appelé à la création d'un
 * site pour pré-sélectionner l'archétype le plus pertinent.
 */
export function archetypeParDefautPourSecteur(
  secteurSlug: string,
): ArchetypeLayoutSlug {
  for (const archetype of CATALOGUE_ARCHETYPES) {
    if (archetype.secteursCibles.includes(secteurSlug)) {
      return archetype.slug;
    }
  }
  return "classique";
}
