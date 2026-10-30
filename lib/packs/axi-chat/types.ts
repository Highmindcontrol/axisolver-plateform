/**
 * Contrats publics du pack @axi-chat.
 *
 * Doctrine : TOUTE l'API publique du pack passe par ces types.
 * Les composants internes du pack ne doivent exposer AUCUN type
 * autre que ceux-ci — c'est la frontière du pack.
 *
 * Toute évolution de ces types est une évolution de contrat et doit
 * rester backward-compatible : ne jamais retirer un champ, ajouter
 * des champs optionnels seulement, versionner si besoin.
 */

/* ────── Channel (surface d'affichage) ────────────────────────── */

export type ChannelAxiChat =
  | "back-office-copilote" // triptyque dashboard (ailettes + chat)
  | "back-office-panneau" // panneau latéral AxiHub-style
  | "bandeau-toggle" // barre + panneau déroulant qui pousse la page
  | "widget-flottant" // bulle flottante sur site visiteur
  | "widget-embarque" // iframe/div dans une page du site
  | "plein-ecran"; // overlay immersif (modale conversation)

/* ────── Positions pour variantes site visiteur ──────────────── */

/** Position d'ancrage d'un widget flottant (4 coins). */
export type PositionWidgetFlottant =
  | "bas-droite"
  | "bas-gauche"
  | "haut-droite"
  | "haut-gauche";

/** Position d'un bandeau toggle sur la page. */
export type PositionBandeau = "haut" | "bas";

/* ────── Thème ────────────────────────────────────────────────── */

export type ModeTheme = "clair" | "sombre" | "auto" | "personnalise";

export type PaletteTheme = {
  /** Fond principal — slate-900 par défaut en mode sombre. */
  fond: string;
  /** Fond des surfaces secondaires (bulles AXI, cartes). */
  surface: string;
  /** Fond des éléments interactifs (input, boutons secondaires). */
  surfaceInteractive: string;
  /** Texte principal. */
  texte: string;
  /** Texte secondaire (sous-titres, meta). */
  texteSecondaire: string;
  /** Texte tertiaire (placeholder, meta discrète). */
  texteTertiaire: string;
  /** Bordure principale. */
  bordure: string;
  /** Bordure accentuée (hover, focus). */
  bordureAccent: string;
  /** Couleur accent principale (bulles user, boutons CTA). */
  accent: string;
  /** Couleur accent secondaire (gradient). */
  accentSecondaire: string;
  /** Texte sur fond accent. */
  texteSurAccent: string;
};

/** Nom d'un preset de palette prêt à l'emploi (voir theme/palettes.ts). */
export type NomPalettePreset =
  | "sombre"
  | "clair"
  | "ecommerceChaud"
  | "institutionnel"
  | "vibrant";

/** Paramétrage visuel du bouton bulle d'une variante widget-flottant. */
export type BoutonBulleTheme = {
  /** Couleur unie du fond du bouton. Si absent, gradient accent → accentSecondaire. */
  couleur?: string;
  /** Taille (diamètre) de la bulle en px. Défaut 56. */
  taille?: number;
  /** Nom d'icône lucide-react à utiliser (ex: 'MessageCircle', 'Sparkles'). Défaut MessageCircle. */
  nomIcone?:
    | "MessageCircle"
    | "MessageSquare"
    | "Sparkles"
    | "Headphones"
    | "HelpCircle"
    | "Bot"
    | "Zap";
  /** Animation subtile sur la bulle au chargement (pulse ou aucune). */
  animation?: "aucune" | "pulse";
};

export type ThemeAxiChat = {
  mode: ModeTheme;
  /**
   * Preset de palette prêt à l'emploi. Si fourni, prend le pas sur
   * `mode` pour la couleur de base (le mode reste utilisé pour le
   * suivi `prefers-color-scheme` quand mode = "auto"). Les overrides
   * `palette` s'appliquent par-dessus le preset.
   */
  preset?: NomPalettePreset;
  /** Si mode = 'personnalise', fournir la palette complète. */
  palette?: Partial<PaletteTheme>;
  /** Rayons de coins (en Tailwind-like : 'sm', 'md', 'lg', 'xl', 'full'). */
  rayons?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Police CSS (ex: 'Inter, sans-serif'). Hérite du site par défaut. */
  police?: string;
  /** Densité verticale ('compact' | 'confortable' | 'spacieux'). */
  densite?: "compact" | "confortable" | "spacieux";
  /**
   * Paramétrage du bouton bulle (variante widget-flottant). Permet au
   * site hôte de surcharger couleur/taille/icône/animation sans fork
   * du composant.
   */
  bouton?: BoutonBulleTheme;
};

/* ────── Contexte métier ──────────────────────────────────────── */

export type SecteurPage =
  | "generaliste"
  | "ecommerce"
  | "service-pro"
  | "immobilier"
  | "medical"
  | "juridique"
  | "restaurant"
  | "formation"
  | "saas"
  | "association";

export type ContexteAxiChat = {
  /** Prénom de l'utilisateur connecté (back-office) ou visiteur. */
  prenomUtilisateur?: string | null;
  /** URL du logo (sinon logo AXI par défaut). */
  logoUrl?: string;
  /** Nom de marque affiché (ex: 'AXI', 'Léa' pour un site perso…). */
  nomAssistant?: string;
  /** Sous-titre (ex: 'Votre copilote AxiSolver'). */
  sousTitre?: string;
  /** Langue de l'interface (impacte les libellés UI). */
  langue?: "fr" | "en" | "es" | "de" | "it";
  /** Secteur du site/page — permet d'ajuster les suggestions, le ton, la pub. */
  secteur?: SecteurPage;
  /** Identifiant du site/tenant (pour multi-tenant côté backend). */
  siteId?: string;
};

/* ────── Fonctionnalités (ON/OFF à la carte) ──────────────────── */

export type FonctionnalitesAxiChat = {
  /** Micro pour dicter un message (nécessite endpoints.urlDictee). */
  dictee?: boolean;
  /** Upload de pièces jointes (nécessite endpoints.urlUpload). */
  piecesJointes?: boolean;
  /** Synthèse vocale pour lire les réponses d'AXI (ElevenLabs). */
  voixSynthese?: boolean;
  /** Suggestions rapides sous l'input (phrases cliquables). */
  suggestionsRapides?: boolean;
  /** Carnet d'ordres latéral (variante back-office-copilote). */
  carnetOrdres?: boolean;
  /** Notation Gaugista à la fin de la conversation visiteur. */
  notationGaugista?: boolean;
  /** Historique multi-session (reprise contexte entre visites). */
  historiqueMulti?: boolean;
  /** Mention « Propulsé par AxiSolver » affichable/masquable. */
  mentionPropulsePar?: boolean;
  /** Affichage de la liste des sites (ailette gauche copilote). */
  listeSites?: boolean;
};

/* ────── Messages ─────────────────────────────────────────────── */

export type RoleMessage = "visiteur" | "axi" | "systeme";

export type PieceJointe = {
  id: string;
  type: "image" | "pdf" | "audio" | "video" | "fichier";
  url: string;
  nom: string;
  tailleOctets?: number;
  largeur?: number;
  hauteur?: number;
};

export type SuggestionRapide = {
  id: string;
  libelle: string;
  /** Si fourni, remplace le texte envoyé (sinon = libelle). */
  valeur?: string;
};

export type OrdreAxi = {
  id: string;
  libelle: string;
  statut: "propose" | "en_cours" | "termine" | "echoue" | "refuse";
  horodatage?: Date;
};

/**
 * Repère visuel émis par AXI pendant qu'elle parle, à afficher sur
 * l'ailette gauche. Deux formes :
 *   - section : cartouche titre (ex: « Annonces Google »)
 *   - lien : bouton cliquable vers une page admin
 */
export type RepereAxi = {
  id: string;
  kind: "section" | "lien";
  label: string;
  cible?: string;
  horodatage?: Date;
};

export type MessageAxi = {
  id: string;
  role: RoleMessage;
  contenu: string;
  horodatage?: Date;
  piecesJointes?: PieceJointe[];
  suggestions?: SuggestionRapide[];
  ordres?: OrdreAxi[];
  /** Désactive l'affichage (ex: message système invisible). */
  invisible?: boolean;
};

/* ────── Endpoints backend ────────────────────────────────────── */

export type EndpointsAxiChat = {
  /** POST — envoi d'un message + reçoit la réponse (streaming OK). */
  urlChat: string;
  /**
   * GET — charge l'historique persisté du fil au mount du composant.
   * Attendu : `{ messages: MessageAxi[] }`. Si non fourni, le chat
   * démarre toujours vierge (comportement sans mémoire).
   */
  urlHistorique?: string;
  /** POST — synthèse vocale (texte → audio). */
  urlVoix?: string;
  /** POST — dictée (audio → texte). */
  urlDictee?: string;
  /** POST — upload d'une pièce jointe. */
  urlUpload?: string;
  /** POST — remonter un score Gaugista en fin de conversation. */
  urlGaugista?: string;
  /** Entêtes communes (Authorization, X-Site-Id, etc.). */
  entetes?: Record<string, string>;
};

/* ────── Notation Gaugista ────────────────────────────────────── */

/**
 * Définition d'une jauge Gaugista (0-10 par défaut).
 * Correspond à une clé du JSON `notes` envoyé à l'API Gaugista.
 */
export type JaugeConfig = {
  /** Clé stable (envoyée telle quelle dans notes_json côté Gaugista). */
  cle: string;
  /** Libellé court affiché (ex: "Utile"). */
  libelle: string;
  /** Question longue facultative affichée en gris sous le libellé. */
  question?: string;
  /** Valeur min (défaut 0). */
  min?: number;
  /** Valeur max (défaut 10). */
  max?: number;
  /** Valeur initiale au premier affichage (défaut : (min+max)/2). */
  valeurInitiale?: number;
};

export type NotationGaugistaConfig = {
  /** Jauges à afficher. 4 par défaut si vide. */
  jauges?: JaugeConfig[];
  /** Titre du modal (défaut: "Merci de noter cette conversation"). */
  titre?: string;
  /** Sous-titre explicatif. */
  sousTitre?: string;
  /** Autoriser un commentaire libre global. */
  avecCommentaire?: boolean;
  /** Placeholder du commentaire. */
  placeholderCommentaire?: string;
  /** Libellé du bouton envoyer. */
  libelleEnvoyer?: string;
  /**
   * Déclencheur : 'bouton' (bouton 'Terminer' explicite), 'fermeture'
   * (quand on ferme le panneau), 'inactivite' (après X secondes
   * d'inactivité, voir inactiviteSec), 'manuel' (contrôlé externement).
   * Défaut : ['bouton', 'fermeture'].
   */
  declencheurs?: Array<"bouton" | "fermeture" | "inactivite" | "manuel">;
  /** Seuil d'inactivité en secondes si declencheurs inclut 'inactivite'. */
  inactiviteSec?: number;
  /** Référence externe (ex: id de conversation AxiSolver). */
  sourceRef?: string;
};

/** 4 jauges par défaut AxiSolver (doctrine fin de conversation visiteur). */
export const JAUGES_AXISOLVER_DEFAUT: JaugeConfig[] = [
  { cle: "utile", libelle: "Utile", question: "AXI vous a-t-il été utile ?" },
  { cle: "claire", libelle: "Claire", question: "Les réponses étaient-elles claires ?" },
  { cle: "rapide", libelle: "Rapide", question: "Avez-vous obtenu une réponse rapide ?" },
  {
    cle: "recommanderait",
    libelle: "Recommanderait",
    question: "Recommanderiez-vous AXI à un proche ?",
  },
];

/* ────── Produits e-commerce ─────────────────────────────────── */

/**
 * Produit affiché dans le carousel e-commerce du chat. Format pivot
 * universel pour Shopify / WooCommerce / Prestashop / BigCommerce /
 * boutique custom. Les intégrations doivent mapper leur modèle produit
 * vers ce type (adaptateur côté backend de chaque boutique).
 *
 * Doctrine : zéro dépendance au provider. Un produit = un objet JSON
 * sérialisable envoyé au pack via `config.produits` ou chargé depuis
 * `config.endpoints.urlProduits`.
 */
export type ProduitAxi = {
  /** Identifiant unique (SKU Shopify, product_id WooCommerce, etc.). */
  id: string;
  /** Nom affiché du produit. */
  nom: string;
  /** URL image principale (requise). Dimensions recommandées : 800×800. */
  imageUrl: string;
  /** URLs images supplémentaires (galerie). Max 5 affichées. */
  images?: string[];
  /** Description courte (1-2 phrases, max 160 chars affichés). */
  description?: string;
  /** Prix actuel (string pour éviter arrondis floats — ex: "29,90"). */
  prix: string;
  /** Prix barré (avant remise). Si fourni, affiché rayé + accent sur
   *  le prix actuel. */
  prixBarre?: string;
  /** Code devise ISO 4217 (EUR, USD, GBP, CHF, CAD…). Défaut EUR. */
  devise?: string;
  /** URL externe vers la fiche produit sur la boutique (Shopify, etc.). */
  lienBoutique: string;
  /** Libellé du bouton CTA. Défaut "Voir le produit". */
  texteBouton?: string;
  /** Niveau de stock pour pastille d'alerte. */
  stock?: "en_stock" | "faible" | "rupture";
  /** Badge visuel en coin de la card (ex: "NOUVEAU", "-30%", "BESTSELLER"). */
  badge?: string;
  /** Catégorie (filtrage futur). */
  categorie?: string;
  /** Tags libres. */
  tags?: string[];
  /** Métadonnées libres pour extension (couleur de badge, variants, etc.). */
  meta?: Record<string, unknown>;
};

/** Configuration de la zone produits (carousel). */
export type ConfigProduitsAxi = {
  /** Titre affiché au-dessus du carousel (optionnel). */
  titre?: string;
  /** Nombre de produits visibles simultanément (défaut responsive 1/2/3). */
  cardsVisibles?: 1 | 2 | 3;
  /** Afficher les flèches Prev/Next (défaut true). */
  avecFleches?: boolean;
  /** Afficher les dots de navigation (défaut true si > 1 produit). */
  avecDots?: boolean;
  /** Autoplay du carousel (délai en ms, ex: 5000). Désactivé par défaut. */
  autoplayMs?: number;
};

/* ────── Configuration racine ─────────────────────────────────── */

export type ConfigAxiChat = {
  channel: ChannelAxiChat;
  theme?: ThemeAxiChat;
  contexte?: ContexteAxiChat;
  fonctionnalites?: FonctionnalitesAxiChat;
  endpoints: EndpointsAxiChat;
  messagesInitiaux?: MessageAxi[];
  /** Configuration de la notation Gaugista (si fonctionnalites.notationGaugista). */
  notationGaugista?: NotationGaugistaConfig;
  /** Message d'accueil AXI (généré si absent, à partir du prénom). */
  accueilPersonnalise?: string;
  /** Placeholder du champ de saisie. */
  placeholderSaisie?: string;
  /** Callbacks optionnels. */
  surMessage?: (message: MessageAxi) => void;
  surOrdre?: (ordre: OrdreAxi) => void;
  /** Appelé à chaque repère visuel émis par AXI (section ou lien). */
  surRepere?: (repere: RepereAxi) => void;
  surFermeture?: () => void;
  /** Callback après envoi réussi de la notation Gaugista. */
  surNotation?: (notes: Record<string, number>, commentaire?: string) => void;
  /**
   * Callback déclenché quand l'utilisateur clique sur le bouton
   * « Nouvelle conversation » dans l'entête. Le parent est responsable
   * de créer un nouveau fil côté serveur et de rafraîchir l'historique
   * (via changement de clé de reload typiquement).
   */
  surNouvelleConversation?: () => void;
  /**
   * Clé de rafraîchissement : si fournie et qu'elle change, le
   * composant purge son état local (messages, brouillon) et refetche
   * l'historique. Utilisé pour basculer d'un fil à l'autre.
   */
  cleReload?: string;
  /**
   * Affichage de l'entête (nom AXI + sousTitre + boutons). Défaut
   * `true`. Mettre à `false` dans les variantes dashboard où l'entête
   * est redondant avec un bandeau externe (ex: back-office-copilote
   * sous la barre « Conversation avec AXI »).
   */
  avecEntete?: boolean;
  /**
   * Produits à afficher dans le carousel e-commerce (optionnel).
   * Si fourni, un carousel apparaît sous la liste des messages, au-
   * dessus de la zone de saisie. Pensé pour sites Shopify / WooCommerce
   * / boutiques custom où AXI parle avec un visiteur et suggère des
   * produits à acheter.
   */
  produits?: ProduitAxi[];
  /** Options d'affichage du carousel produits. */
  configProduits?: ConfigProduitsAxi;
  /** Callback déclenché au clic sur une card produit (image/nom). */
  surClicProduit?: (produit: ProduitAxi) => void;
  /** Callback déclenché au clic sur le CTA (bouton d'achat) d'une card. */
  surClicAcheter?: (produit: ProduitAxi) => void;
};
