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

export type ThemeAxiChat = {
  mode: ModeTheme;
  /** Si mode = 'personnalise', fournir la palette complète. */
  palette?: Partial<PaletteTheme>;
  /** Rayons de coins (en Tailwind-like : 'sm', 'md', 'lg', 'xl', 'full'). */
  rayons?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Police CSS (ex: 'Inter, sans-serif'). Hérite du site par défaut. */
  police?: string;
  /** Densité verticale ('compact' | 'confortable' | 'spacieux'). */
  densite?: "compact" | "confortable" | "spacieux";
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
};
