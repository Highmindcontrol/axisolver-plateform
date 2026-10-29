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
  | "widget-flottant" // bulle bas-droite sur site visiteur
  | "widget-embarque" // iframe/div dans une page du site
  | "plein-ecran"; // overlay immersif (modale conversation)

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

/* ────── Configuration racine ─────────────────────────────────── */

export type ConfigAxiChat = {
  channel: ChannelAxiChat;
  theme?: ThemeAxiChat;
  contexte?: ContexteAxiChat;
  fonctionnalites?: FonctionnalitesAxiChat;
  endpoints: EndpointsAxiChat;
  messagesInitiaux?: MessageAxi[];
  /** Message d'accueil AXI (généré si absent, à partir du prénom). */
  accueilPersonnalise?: string;
  /** Placeholder du champ de saisie. */
  placeholderSaisie?: string;
  /** Callbacks optionnels. */
  surMessage?: (message: MessageAxi) => void;
  surOrdre?: (ordre: OrdreAxi) => void;
  surFermeture?: () => void;
};
