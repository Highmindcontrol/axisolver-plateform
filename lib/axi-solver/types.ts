/**
 * Types partagés pour l'écosystème AxiSolver.
 *
 * Un `TenantConfig` est l'identité et la doctrine commerciale d'une
 * entreprise cliente qui a installé le widget AxiSolver sur son site.
 */

/** Tutoiement / vouvoiement par défaut pour les réponses du widget. */
export type Formalite = "tu" | "vous";

/** Niveau de chaleur estimé d'un ticket (pour priorisation équipe). */
export type ChaleurTicket = "froid" | "tiede" | "chaud" | "urgent";

/** Statut d'un ticket dans le journal admin. */
export type StatutTicket = "ouvert" | "en_cours" | "resolu" | "transfere";

/** Liens internes du site de l'entreprise cliente que l'AxiSolver peut
 *  pousser en réponse. Chaque entrée associe un libellé (ce que l'AXI
 *  dira) à un chemin ou URL (ce que le widget rendra cliquable). */
export type LienOrientation = {
  libelle: string;
  cible: string;
  description?: string;
};

/** Configuration complète d'un tenant AxiSolver. */
export type TenantConfig = {
  /** Identifiant interne stable (slug URL-safe). */
  slug: string;
  /** Nom affiché de l'entreprise cliente. */
  nomEntreprise: string;
  /** Secteur / métier court (ex : « cabinet d'avocats », « agence immobilière »). */
  secteur: string;
  /** Baseline / promesse courte de l'entreprise (une phrase). */
  baseline?: string;
  /** Site web principal (sans https://). */
  siteDomaine: string;
  /** Formalité par défaut dans les réponses. */
  formalite: Formalite;
  /** Prénom du dirigeant / interlocuteur principal pour les emails de ticket. */
  prenomDirigeant?: string;
  /** Email de notification des nouveaux tickets. */
  emailNotification: string;
  /** Langues supportées (ISO 639-1). FR par défaut. */
  langues: string[];
  /** Services ou produits que propose l'entreprise. Nourrit la doctrine métier. */
  servicesProposes: string[];
  /** Sujets sensibles que l'AXI doit traiter avec précaution ou éviter. */
  sujetsSensibles?: string[];
  /** Liens internes du site vers lesquels orienter le visiteur. */
  liensOrientation: LienOrientation[];
  /** Horaires d'ouverture (pour promesse de rappel réaliste). */
  horairesOuverture?: string;
  /** Config visuelle du widget. */
  branding: {
    couleurPrimaire: string;
    couleurTexte: string;
    position: "bottom-right" | "bottom-left";
    logoUrl?: string;
  };
  /** Si le tenant a aussi un AXI Hub déployé (protocole Duo activable). */
  axiHubDeploye?: boolean;
};

/** Message d'une conversation (tour de parole). */
export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  audioUrl?: string;
  createdAt: string;
};

/** État d'une conversation en cours. */
export type Conversation = {
  id: string;
  tenantSlug: string;
  visitorId?: string;
  status: "active" | "closed" | "escalated";
  messages: Message[];
  ticketReference?: string;
  createdAt: string;
  updatedAt: string;
};

/** Un ticket qualifié transmis à l'équipe humaine. */
export type Ticket = {
  reference: string;
  tenantSlug: string;
  conversationId: string;
  visitor: {
    prenom?: string;
    telephone?: string;
    email?: string;
  };
  resume: string;
  chaleur: ChaleurTicket;
  statut: StatutTicket;
  createdAt: string;
};
