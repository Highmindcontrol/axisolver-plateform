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
    slug: "generaliste",
    nom: "Autre / généraliste",
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
