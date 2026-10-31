/**
 * Catalogue des secteurs pré-remplis pour l'onboarding d'un nouveau
 * site AxiSolver (LOT E — dashboard client).
 *
 * Chaque secteur fournit :
 *   · un `slug` identifiant stable
 *   · un `nom` affiché dans le dashboard
 *   · un `ton` conversationnel suggéré (clé enum siteConfigs.ton)
 *   · des `optionsAccueil` templatées à proposer en défaut au client
 *   · un `exemple` pour illustrer l'usage attendu
 *
 * Au moment de la création d'un site, le propriétaire sélectionne un
 * secteur et peut partir du template puis personnaliser. Le but est
 * de passer de « page blanche » à « déjà 80 % configuré » en 2 clics.
 */

export type Secteur = {
  slug: string;
  nom: string;
  ton: string;
  optionsAccueil: string[];
  exemple: string;
};

export const CATALOGUE_SECTEURS: Secteur[] = [
  {
    slug: "site_entreprise",
    nom: "Site d'entreprise / vitrine généraliste",
    ton: "professionnel_chaleureux",
    optionsAccueil: [
      "Je souhaite en savoir plus sur votre entreprise.",
      "Je cherche à être mis en relation avec votre équipe.",
      "Je voudrais obtenir un devis ou une estimation.",
      "J'aimerais recevoir de la documentation.",
    ],
    exemple:
      "Site corporate d'entreprise, cabinet, agence, PME. AxiSolver qualifie le visiteur, répond aux questions sur l'offre et oriente vers le bon interlocuteur.",
  },
  {
    slug: "e_commerce",
    nom: "E-commerce",
    ton: "convivial",
    optionsAccueil: [
      "Je cherche un produit spécifique.",
      "J'ai une question sur ma commande.",
      "Je veux connaître vos délais de livraison et vos retours.",
      "J'aimerais parler à un conseiller.",
    ],
    exemple:
      "Boutique en ligne de mode, décoration, cosmétiques, high-tech. AxiSolver renseigne sur les produits, aide à choisir, résout les problèmes de commande.",
  },
  {
    slug: "services_professionnels",
    nom: "Services professionnels (avocat, comptable, consultant)",
    ton: "professionnel_chaleureux",
    optionsAccueil: [
      "Je souhaite prendre rendez-vous.",
      "J'ai une question avant de m'engager.",
      "Je voudrais connaître vos tarifs.",
      "J'ai besoin d'une estimation sur un dossier précis.",
    ],
    exemple:
      "Cabinet d'avocats, cabinet comptable, consultant indépendant. AxiSolver pré-qualifie la demande, oriente vers le bon spécialiste, planifie des RDV.",
  },
  {
    slug: "immobilier",
    nom: "Immobilier",
    ton: "professionnel_chaleureux",
    optionsAccueil: [
      "Je souhaite vendre mon bien.",
      "Je cherche à acheter.",
      "J'aimerais une estimation de mon logement.",
      "Je cherche un bien à louer.",
    ],
    exemple:
      "Agence immobilière, promoteur, gestionnaire de biens. AxiSolver qualifie le projet (vente/achat/location/estimation), capte les coordonnées, oriente vers le bon négociateur.",
  },
  {
    slug: "restauration",
    nom: "Restauration",
    ton: "convivial",
    optionsAccueil: [
      "Je voudrais réserver une table.",
      "Je veux commander à emporter.",
      "Je souhaite voir le menu du jour.",
      "J'organise un événement et je voudrais privatiser.",
    ],
    exemple:
      "Restaurant, bistrot, pizzeria, service traiteur. AxiSolver prend les réservations, répond sur les menus et allergènes, oriente les demandes d'événement.",
  },
  {
    slug: "tech_saas",
    nom: "Tech / SaaS",
    ton: "expert",
    optionsAccueil: [
      "Je voudrais une démo.",
      "Je compare avec mon outil actuel.",
      "Je souhaite voir vos tarifs et plans.",
      "J'aimerais parler à un expert technique.",
    ],
    exemple:
      "Éditeur de logiciel SaaS, outil B2B, plateforme technique. AxiSolver qualifie le besoin, oriente vers démo, extrait les cas d'usage pour les commerciaux.",
  },
  {
    slug: "medical_para_medical",
    nom: "Médical / para-médical",
    ton: "institutionnel",
    optionsAccueil: [
      "Je souhaite prendre rendez-vous.",
      "J'ai une question avant une consultation.",
      "Je cherche à joindre un praticien pour une urgence non vitale.",
      "Je voudrais demander un document (certificat, ordonnance).",
    ],
    exemple:
      "Cabinet médical, cabinet dentaire, ostéopathe, kinésithérapeute, laboratoire. AxiSolver oriente les demandes administratives et laisse la relation médicale à l'humain.",
  },
  {
    slug: "formation_education",
    nom: "Formation / éducation",
    ton: "professionnel_chaleureux",
    optionsAccueil: [
      "Je m'intéresse à un programme de formation.",
      "Je voudrais connaître les prérequis et les tarifs.",
      "Comment postuler et quels sont les délais ?",
      "Je cherche à joindre un responsable pédagogique.",
    ],
    exemple:
      "École, organisme de formation, centre de formation professionnelle. AxiSolver pré-qualifie les candidats, répond aux questions sur les programmes, oriente vers l'admission.",
  },
  {
    slug: "association",
    nom: "Association",
    ton: "convivial",
    optionsAccueil: [
      "Je voudrais devenir bénévole.",
      "Je souhaite faire un don.",
      "Je cherche à bénéficier de vos actions.",
      "Comment nous contacter pour un partenariat ?",
    ],
    exemple:
      "Association humanitaire, sportive, culturelle, environnementale. AxiSolver canalise les demandes bénévoles/dons/partenaires et les oriente vers la bonne équipe.",
  },
  {
    slug: "tourisme_hotellerie",
    nom: "Tourisme / hôtellerie",
    ton: "convivial",
    optionsAccueil: [
      "Je souhaite réserver un séjour.",
      "Quels sont vos disponibilités et vos tarifs ?",
      "J'ai une question sur les prestations incluses.",
      "Je prépare un voyage et j'ai besoin de conseils.",
    ],
    exemple:
      "Hôtel, gîte, chambre d'hôtes, agence de voyage, camping. AxiSolver qualifie la demande (dates, nombre, type de séjour) et oriente vers la réservation.",
  },
  {
    slug: "beaute_bien_etre",
    nom: "Beauté / bien-être",
    ton: "convivial",
    optionsAccueil: [
      "Je voudrais prendre rendez-vous.",
      "Je cherche à connaître vos prestations.",
      "Quels sont vos tarifs ?",
      "Je souhaite offrir un soin en cadeau.",
    ],
    exemple:
      "Salon de coiffure, institut de beauté, spa, barbier, naturopathe. AxiSolver qualifie la demande, propose les prestations et oriente vers la prise de RDV.",
  },
  {
    slug: "automobile_mobilite",
    nom: "Automobile / mobilité",
    ton: "professionnel_chaleureux",
    optionsAccueil: [
      "Je cherche à acheter un véhicule.",
      "Je souhaite prendre rendez-vous pour un entretien.",
      "J'aimerais une estimation pour la reprise de mon véhicule.",
      "J'ai une question sur un service après-vente.",
    ],
    exemple:
      "Concessionnaire, garage, carrosserie, loueur, mobilité verte. AxiSolver pré-qualifie l'intention (achat/entretien/reprise) et oriente vers la bonne équipe.",
  },
  {
    slug: "evenementiel_mariage",
    nom: "Événementiel / mariage",
    ton: "convivial",
    optionsAccueil: [
      "J'organise un événement et je cherche un prestataire.",
      "Nous préparons un mariage.",
      "Je voudrais connaître vos tarifs et disponibilités.",
      "J'aimerais être rappelé pour en discuter.",
    ],
    exemple:
      "Wedding planner, agence événementielle, lieu de réception, traiteur événementiel, DJ, photographe. AxiSolver pré-qualifie le projet et capte les informations clés.",
  },
  {
    slug: "culture_loisirs",
    nom: "Culture / loisirs",
    ton: "convivial",
    optionsAccueil: [
      "Quels sont les horaires et tarifs ?",
      "Je souhaite réserver des billets.",
      "Quels événements avez-vous à venir ?",
      "Je prépare une sortie en groupe.",
    ],
    exemple:
      "Musée, salle de spectacle, parc d'attractions, cinéma, galerie, festival. AxiSolver informe sur la programmation et oriente vers la billetterie.",
  },
  {
    slug: "industrie_btp",
    nom: "Industrie / BTP / artisanat",
    ton: "professionnel_chaleureux",
    optionsAccueil: [
      "Je souhaite demander un devis.",
      "J'ai un projet et je cherche un artisan.",
      "Pouvez-vous intervenir dans ma région ?",
      "J'ai une question technique.",
    ],
    exemple:
      "Entreprise de BTP, artisan (plombier, électricien, menuisier…), fabricant industriel, bureau d'études. AxiSolver qualifie le projet et récupère les coordonnées.",
  },
  {
    slug: "agriculture_producteur",
    nom: "Agriculture / producteur",
    ton: "convivial",
    optionsAccueil: [
      "Je souhaite commander vos produits.",
      "Où puis-je vous trouver (points de vente, marchés) ?",
      "Je voudrais visiter votre exploitation.",
      "Quels sont vos produits de saison ?",
    ],
    exemple:
      "Producteur fermier, viticulteur, maraîcher, apiculteur, vente directe. AxiSolver renseigne sur les produits, les points de vente et prépare les commandes.",
  },
  {
    slug: "generaliste",
    nom: "Autre / non listé",
    ton: "professionnel_chaleureux",
    optionsAccueil: [
      "Je souhaite en savoir plus sur votre offre.",
      "J'ai une question précise.",
      "Je voudrais être rappelé par votre équipe.",
      "Je cherche à voir un exemple ou une démonstration.",
    ],
    exemple:
      "Secteur non listé ou site généraliste. Options d'accueil génériques, à personnaliser ensuite depuis le dashboard.",
  },
];

export function getSecteur(slug: string): Secteur | null {
  return CATALOGUE_SECTEURS.find((s) => s.slug === slug) ?? null;
}
