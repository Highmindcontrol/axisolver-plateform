import {
  type AnyPgColumn,
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  integer,
  boolean,
  pgEnum,
  primaryKey,
  index,
  uniqueIndex,
  vector,
  customType,
} from "drizzle-orm/pg-core";

/**
 * Schéma AxiSolver — fondations multi-tenant.
 *
 * Doctrine : chaque entreprise cliente a UN site_id. Toutes les
 * données propres au site (config, options d'accueil, base de
 * connaissances, tickets, conversations) sont rattachées à ce
 * site_id. L'instance axisolver.app elle-même est un site parmi
 * d'autres (dogfood).
 *
 * Tables fondatrices (LOT A) :
 *   · users              — shadow row sur auth.users (FK ok)
 *   · sites              — identité du site client + plan + domaines
 *   · site_configs       — paramétrage visuel + IA + voix + langue
 *   · site_options_accueil   — phrases cliquables dans l'ailette gauche
 *   · site_connaissance_sources — crawl URL/sitemap + upload PDF
 *
 * Tables à ajouter aux lots suivants :
 *   · base_connaissance_chunks (LOT B) — embeddings pgvector
 *   · conversations + messages (LOT B/E) — journal + reprise contexte
 *   · tickets (LOT E) — AXI-XXXX, modèle existant brief AxiSolver
 *   · verifications_domaine (LOT D)
 *   · stripe_subscriptions (LOT K)
 */

/* ─── Enums ─────────────────────────────────────────────────────── */

export const planSiteEnum = pgEnum("plan_site", [
  "beta",
  "starter",
  "pro",
  "enterprise",
]);

export const voixModeEnum = pgEnum("voix_mode", [
  "texte_seul",
  "navigateur",
  "premium_elevenlabs",
]);

export const sourceConnaissanceTypeEnum = pgEnum("source_connaissance_type", [
  "url",
  "sitemap",
  "pdf",
]);

export const sourceConnaissanceStatutEnum = pgEnum(
  "source_connaissance_statut",
  ["en_attente", "en_cours", "ingere", "echec"],
);

/* ─── Users (shadow row sur auth.users) ─────────────────────────── */
/* Alimentée par le trigger on_auth_user_created défini en SQL. */

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  nomAffiche: text("nom_affiche"),
  avatarUrl: text("avatar_url"),
  stripeCustomerId: text("stripe_customer_id"),
  creeLe: timestamp("cree_le", { withTimezone: true }).defaultNow().notNull(),
  majLe: timestamp("maj_le", { withTimezone: true }).defaultNow().notNull(),
});

/* ─── Sites ─────────────────────────────────────────────────────── */
/* Un site client = un snippet installé quelque part. */

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  // Nullable : permet des sites « système » Ataraxis (axisolver, coryphea,
  // gaugista, ataraxis.group…) rattachés à aucun compte client humain.
  ownerUserId: uuid("owner_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  // Workspace propriétaire (introduit par la migration 0016). Les
  // permissions passent par workspace_members (égalité stricte entre
  // co-admins). Legacy owner_user_id conservé pour historique.
  workspaceId: uuid("workspace_id").references((): AnyPgColumn => workspaces.id, {
    onDelete: "cascade",
  }),
  nomEntreprise: text("nom_entreprise").notNull(),
  // Nom affiché du site dans le dashboard (ex: « Coryphea »,
  // « Neuroactif »). Distinct de nom_entreprise qui reste pour la
  // raison sociale cliente (facturation). Nullable pour compat
  // avec les sites créés avant la migration 0017.
  nomSite: text("nom_site"),
  domainePrincipal: text("domaine_principal").notNull(),
  domainesAutorises: text("domaines_autorises").array().notNull().default([]),
  plan: planSiteEnum("plan").notNull().default("beta"),
  apiKeyHash: text("api_key_hash"),
  proprieteVerifieeLe: timestamp("propriete_verifiee_le", {
    withTimezone: true,
  }),
  proprieteMethode: text("propriete_methode"),
  tokenVerificationFichier: text("token_verification_fichier"),
  tokenVerificationDns: text("token_verification_dns"),
  tokenVerificationBalise: text("token_verification_balise"),
  actif: boolean("actif").notNull().default(true),
  creeLe: timestamp("cree_le", { withTimezone: true }).defaultNow().notNull(),
  majLe: timestamp("maj_le", { withTimezone: true }).defaultNow().notNull(),
});

/* ─── Site configs ──────────────────────────────────────────────── */
/* Un seul enregistrement par site. 1-1. */

export const remediationSecuriteModeEnum = pgEnum(
  "remediation_securite_mode",
  ["desactive", "validation", "automatique"],
);

export const siteConfigs = pgTable("site_configs", {
  siteId: uuid("site_id")
    .primaryKey()
    .references(() => sites.id, { onDelete: "cascade" }),
  nomAssistant: text("nom_assistant").notNull().default("AXI"),
  secteur: text("secteur"),
  ton: text("ton").notNull().default("professionnel_chaleureux"),
  modePrompt: text("mode_prompt")
    .notNull()
    .default("au_service_du_site_hote"),
  languesActives: text("langues_actives")
    .array()
    .notNull()
    .default(["fr"]),
  langueDefaut: text("langue_defaut").notNull().default("fr"),
  voixMode: voixModeEnum("voix_mode").notNull().default("texte_seul"),
  voixId: text("voix_id"),
  branding: jsonb("branding")
    .$type<BrandingConfig>()
    .notNull()
    .default({
      couleurPrincipale: "#4f46e5",
      couleurSecondaire: "#8b5cf6",
      logoUrl: null,
      position: "bas-droite",
      afficherPropulsePar: true,
      picto: "globe",
      archetypeLayout: "classique",
    }),
  mentionsLegalesUrl: text("mentions_legales_url"),
  politiqueConfUrl: text("politique_conf_url"),
  emailNotification: text("email_notification"),
  modeRemediationSecurite: remediationSecuriteModeEnum(
    "mode_remediation_securite",
  )
    .notNull()
    .default("desactive"),
  creeLe: timestamp("cree_le", { withTimezone: true }).defaultNow().notNull(),
  majLe: timestamp("maj_le", { withTimezone: true }).defaultNow().notNull(),
});

export type BrandingConfig = {
  couleurPrincipale: string;
  couleurSecondaire: string;
  logoUrl: string | null;
  position: "bas-droite" | "bas-gauche";
  afficherPropulsePar: boolean;
  /** Nom d'icône lucide (ex. "globe", "building-2") pour identifier
   *  le site dans la barre du haut du dashboard client. Optionnel
   *  pour compatibilité avec les sites créés avant 2026-10-29. */
  picto?: string;
  /** Archétype de mise en page du widget (ailettes contextuelles au
   *  métier). Voir lib/axi-solver/archetypes-layout.ts. Optionnel
   *  pour compatibilité, fallback « classique ». */
  archetypeLayout?: string;
};

/* ─── Options d'accueil ─────────────────────────────────────────── */
/* Phrases cliquables qui s'affichent dans l'ailette gauche tant que
 * le visiteur n'a pas encore parlé. Chaque clic équivaut à envoyer
 * la phrase comme message visiteur. */

export const siteOptionsAccueil = pgTable("site_options_accueil", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  ordre: integer("ordre").notNull().default(0),
  libelle: text("libelle").notNull(),
  actif: boolean("actif").notNull().default(true),
  creeLe: timestamp("cree_le", { withTimezone: true }).defaultNow().notNull(),
});

/* ─── Sources de base de connaissances ──────────────────────────── */
/* L'URL/sitemap/PDF uploadé par le propriétaire du site pour nourrir
 * le cerveau d'AxiSolver. Les chunks + embeddings associés arrivent
 * au LOT B dans la table base_connaissance_chunks. */

export const siteConnaissanceSources = pgTable("site_connaissance_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  type: sourceConnaissanceTypeEnum("type").notNull(),
  source: text("source").notNull(),
  nomAffichage: text("nom_affichage"),
  statut: sourceConnaissanceStatutEnum("statut")
    .notNull()
    .default("en_attente"),
  derniereIngestionLe: timestamp("derniere_ingestion_le", {
    withTimezone: true,
  }),
  derniereErreur: text("derniere_erreur"),
  nbChunks: integer("nb_chunks").notNull().default(0),
  creeLe: timestamp("cree_le", { withTimezone: true }).defaultNow().notNull(),
  majLe: timestamp("maj_le", { withTimezone: true }).defaultNow().notNull(),
});

/* ─── Chunks de base de connaissances + embeddings pgvector (LOT B) ─ */
/* Chaque source ingérée (URL, sitemap, PDF) est découpée en chunks de
 * ~300-500 tokens, puis embedded via OpenAI text-embedding-3-small
 * (dimension 1536). Un index HNSW sur l'embedding permet la recherche
 * par similarité cosinus en millisecondes. Le tool call
 * `chercher_base_connaissances` du /api/chat lit cette table. */

export const baseConnaissanceChunks = pgTable(
  "base_connaissance_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => siteConnaissanceSources.id, {
        onDelete: "cascade",
      }),
    position: integer("position").notNull().default(0),
    texte: text("texte").notNull(),
    tokens: integer("tokens").notNull().default(0),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    meta: jsonb("meta").$type<ChunkMeta>().notNull().default({}),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // Index HNSW cosine pour la recherche sémantique rapide
    index("idx_chunks_embedding_hnsw").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
    // Index BTree sur site_id pour filtrer avant le vectoriel
    index("idx_chunks_site_id").on(t.siteId),
    index("idx_chunks_source_id").on(t.sourceId),
  ],
);

/** Métadonnées d'un chunk — ce qui permet de citer la source. */
export type ChunkMeta = {
  /** URL d'origine si crawl web */
  url?: string;
  /** Titre de la page / document */
  titre?: string;
  /** Numéro de page pour les PDF */
  page?: number;
  /** Section / titre H2-H3 si extrait d'une structure */
  section?: string;
};

/* ─── Conversations + tickets (LOT E.6) ─────────────────────────── */

export const chaleurTicketEnum = pgEnum("chaleur_ticket", [
  "froid",
  "tiede",
  "chaud",
  "urgent",
]);

export const statutTicketEnum = pgEnum("statut_ticket", [
  "resolu_par_axi",
  "ouvert",
  "en_cours",
  "transfere",
  "ferme",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    visiteurId: text("visiteur_id"),
    userAgent: text("user_agent"),
    url: text("url"),
    debutLe: timestamp("debut_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finLe: timestamp("fin_le", { withTimezone: true }),
    messages: jsonb("messages")
      .$type<MessageConversation[]>()
      .notNull()
      .default([]),
    resumeAxi: text("resume_axi"),
    nbTours: integer("nb_tours").notNull().default(0),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("idx_conversations_site_id").on(t.siteId)],
);

export type MessageConversation = {
  role: "user" | "assistant";
  content: string;
  horodatage: string;
};

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(
      () => conversations.id,
      { onDelete: "set null" },
    ),
    statut: statutTicketEnum("statut").notNull().default("ouvert"),
    chaleur: chaleurTicketEnum("chaleur").notNull().default("tiede"),
    prenom: text("prenom"),
    email: text("email"),
    telephone: text("telephone"),
    resume: text("resume"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    majLe: timestamp("maj_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_tickets_site_id").on(t.siteId),
    index("idx_tickets_statut").on(t.statut),
  ],
);

/* ─── Audits SEO (LOT H) ────────────────────────────────────────── */

export const auditSeoStatutEnum = pgEnum("audit_seo_statut", [
  "en_cours",
  "termine",
  "echec",
]);

export const auditSeoDeclencheurEnum = pgEnum("audit_seo_declencheur", [
  "manuel",
  "auto_mensuel",
  "api",
]);

export const seoAudits = pgTable(
  "seo_audits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    urlAuditee: text("url_auditee").notNull(),
    declencheur: auditSeoDeclencheurEnum("declencheur").notNull().default("manuel"),
    statut: auditSeoStatutEnum("statut").notNull().default("en_cours"),
    scoreGlobal: integer("score_global"),
    scoreTechnique: integer("score_technique"),
    scoreContenu: integer("score_contenu"),
    scoreMotsCles: integer("score_mots_cles"),
    scorePerformance: integer("score_performance"),
    scoreMobile: integer("score_mobile"),
    findings: jsonb("findings").$type<FindingSeo[]>().notNull().default([]),
    recommandations: jsonb("recommandations")
      .$type<RecommandationSeo[]>()
      .notNull()
      .default([]),
    motsClesTestes: text("mots_cles_testes").array().notNull().default([]),
    dureeMs: integer("duree_ms"),
    erreur: text("erreur"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    termineLe: timestamp("termine_le", { withTimezone: true }),
  },
  (t) => [
    index("idx_seo_audits_site_id").on(t.siteId),
    index("idx_seo_audits_cree_le").on(t.creeLe),
  ],
);

/** Un constat atomique issu de l'audit (ex. « title tag absent »). */
export type FindingSeo = {
  pilier: "technique" | "contenu" | "mots_cles" | "performance" | "mobile";
  code: string;
  severite: "critique" | "haute" | "moyenne" | "basse" | "info";
  message: string;
  details?: Record<string, unknown>;
};

/** Action priorisée dérivée d'un ou plusieurs findings. */
export type RecommandationSeo = {
  titre: string;
  description: string;
  priorite: "critique" | "haute" | "moyenne" | "basse";
  effort: "faible" | "moyen" | "eleve";
  impact: "faible" | "moyen" | "fort";
  pilier: "technique" | "contenu" | "mots_cles" | "performance" | "mobile";
  pris_en_charge_axi?: {
    pack: string;
    cout_sans_axi: string;
    cout_avec_axi: string;
  };
};

/* ─── Audits sécurité (LOT I) ───────────────────────────────────── */

export const auditSecurityStatutEnum = pgEnum("audit_security_statut", [
  "en_cours",
  "termine",
  "echec",
]);

export const auditSecurityDeclencheurEnum = pgEnum(
  "audit_security_declencheur",
  ["manuel", "auto_mensuel", "api", "monitoring"],
);

export const securityAudits = pgTable(
  "security_audits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    urlAuditee: text("url_auditee").notNull(),
    declencheur: auditSecurityDeclencheurEnum("declencheur")
      .notNull()
      .default("manuel"),
    statut: auditSecurityStatutEnum("statut").notNull().default("en_cours"),
    scoreGlobal: integer("score_global"),
    scoreHeaders: integer("score_headers"),
    scoreTls: integer("score_tls"),
    scoreExposition: integer("score_exposition"),
    scoreCookies: integer("score_cookies"),
    scoreContenu: integer("score_contenu"),
    scoreReputation: integer("score_reputation"),
    findings: jsonb("findings")
      .$type<FindingSecurity[]>()
      .notNull()
      .default([]),
    recommandations: jsonb("recommandations")
      .$type<RecommandationSecurity[]>()
      .notNull()
      .default([]),
    certificatSslExpireeLe: timestamp("certificat_ssl_expiree_le", {
      withTimezone: true,
    }),
    dureeMs: integer("duree_ms"),
    erreur: text("erreur"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    termineLe: timestamp("termine_le", { withTimezone: true }),
  },
  (t) => [
    index("idx_security_audits_site_id").on(t.siteId),
    index("idx_security_audits_cree_le").on(t.creeLe),
  ],
);

/** Constat atomique issu de l'audit security (ex. « HSTS absent »). */
export type FindingSecurity = {
  pilier:
    | "headers"
    | "tls"
    | "exposition"
    | "cookies"
    | "contenu"
    | "reputation";
  code: string;
  severite: "critique" | "haute" | "moyenne" | "basse" | "info";
  message: string;
  details?: Record<string, unknown>;
};

/** Action priorisée dérivée d'un ou plusieurs findings security. */
export type RecommandationSecurity = {
  titre: string;
  description: string;
  priorite: "critique" | "haute" | "moyenne" | "basse";
  effort: "faible" | "moyen" | "eleve";
  impact: "faible" | "moyen" | "fort";
  pilier: FindingSecurity["pilier"];
  pris_en_charge_axi?: {
    pack: string;
    cout_sans_axi: string;
    cout_avec_axi: string;
  };
};

export const incidentSecurityTypeEnum = pgEnum("incident_security_type", [
  "ssl_expiration_proche",
  "ssl_expiree",
  "site_indisponible",
  "hash_html_change",
  "noindex_apparu",
  "redirection_suspecte",
  "cert_invalide",
]);

export const incidentSecurityStatutEnum = pgEnum("incident_security_statut", [
  "ouvert",
  "resolu",
  "ignore",
]);

export const incidentSecuriteSeveriteEnum = pgEnum(
  "incident_security_severite",
  ["critique", "haute", "moyenne", "basse"],
);

export const securityIncidents = pgTable(
  "security_incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    type: incidentSecurityTypeEnum("type").notNull(),
    severite: incidentSecuriteSeveriteEnum("severite").notNull(),
    statut: incidentSecurityStatutEnum("statut").notNull().default("ouvert"),
    message: text("message").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().default({}),
    detecteLe: timestamp("detecte_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    resoluLe: timestamp("resolu_le", { withTimezone: true }),
    notifieLe: timestamp("notifie_le", { withTimezone: true }),
  },
  (t) => [
    index("idx_security_incidents_site_id").on(t.siteId),
    index("idx_security_incidents_statut").on(t.statut),
    index("idx_security_incidents_detecte_le").on(t.detecteLe),
  ],
);

/* ─── Interventions AXI Security Shield (remédiation, migration 0020) */

export const interventionSecuriteStatutEnum = pgEnum(
  "intervention_securite_statut",
  [
    "en_attente_validation",
    "programmee",
    "en_cours",
    "terminee",
    "echec",
    "refusee",
    "annulee",
  ],
);

export const securiteInterventions = pgTable(
  "securite_interventions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    auditId: uuid("audit_id").references(() => securityAudits.id, {
      onDelete: "set null",
    }),
    findingCode: text("finding_code").notNull(),
    pilier: text("pilier").notNull(),
    titre: text("titre").notNull(),
    descriptionAction: text("description_action").notNull(),
    statut: interventionSecuriteStatutEnum("statut")
      .notNull()
      .default("en_attente_validation"),
    modeDeclenche: remediationSecuriteModeEnum("mode_declenche")
      .notNull()
      .default("validation"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    programmeePour: timestamp("programmee_pour", { withTimezone: true }),
    executeLe: timestamp("execute_le", { withTimezone: true }),
    termineLe: timestamp("termine_le", { withTimezone: true }),
    resultat: jsonb("resultat"),
    erreur: text("erreur"),
    valideParUserId: uuid("valide_par_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    valideLe: timestamp("valide_le", { withTimezone: true }),
  },
  (t) => [
    index("idx_securite_interventions_site").on(t.siteId),
    index("idx_securite_interventions_statut").on(t.statut),
    index("idx_securite_interventions_cree_le").on(t.creeLe),
  ],
);

/* ─── Accès au site pour AXI Security Shield (migration 0021) ──── */

export const securityShieldAccesTypeEnum = pgEnum(
  "security_shield_acces_type",
  [
    "ssh",
    "ftp",
    "sftp",
    "wordpress_rest",
    "cloudflare_api",
    "cpanel_api",
    "plesk_api",
    "github_repo",
  ],
);

export const siteAccesSecurite = pgTable(
  "site_acces_securite",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    type: securityShieldAccesTypeEnum("type").notNull(),
    libelle: text("libelle").notNull(),
    parametresPublics: jsonb("parametres_publics")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    credentielsChiffres: customType<{
      data: Buffer;
      driverData: Buffer;
    }>({
      dataType() {
        return "bytea";
      },
    })("credentiels_chiffres").notNull(),
    credentielsMeta: jsonb("credentiels_meta")
      .$type<{ iv: string; tag: string }>()
      .notNull()
      .default({ iv: "", tag: "" }),
    actif: boolean("actif").notNull().default(true),
    derniereConnexionLe: timestamp("derniere_connexion_le", {
      withTimezone: true,
    }),
    derniereConnexionOk: boolean("derniere_connexion_ok"),
    derniereConnexionErreur: text("derniere_connexion_erreur"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    majLe: timestamp("maj_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    creeParUserId: uuid("cree_par_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("idx_site_acces_securite_site").on(t.siteId),
    index("idx_site_acces_securite_type").on(t.type),
  ],
);

/* ─── Monitoring périodique (snapshots pour détection changements) ─ */

export const securityMonitorings = pgTable(
  "security_monitorings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    statusHttp: integer("status_http"),
    hashHtml: text("hash_html"),
    certificatExpireeLe: timestamp("certificat_expiree_le", {
      withTimezone: true,
    }),
    certificatEmetteur: text("certificat_emetteur"),
    tempsReponseMs: integer("temps_reponse_ms"),
    erreur: text("erreur"),
    mesureLe: timestamp("mesure_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_security_monitorings_site_id").on(t.siteId),
    index("idx_security_monitorings_mesure_le").on(t.mesureLe),
  ],
);

/* ─── Rate limiting /api/chat (shield widget LOT I.3) ───────────── */

export const rateLimitsChat = pgTable(
  "rate_limits_chat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    visiteurCle: text("visiteur_cle").notNull(),
    bucketMinute: text("bucket_minute").notNull(),
    bucketJour: text("bucket_jour").notNull(),
    nbMsgsMinute: integer("nb_msgs_minute").notNull().default(0),
    nbMsgsJour: integer("nb_msgs_jour").notNull().default(0),
    bloqueJusqua: timestamp("bloque_jusqua", { withTimezone: true }),
    derniereActiviteLe: timestamp("derniere_activite_le", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_rate_limits_chat_site_visiteur").on(t.siteId, t.visiteurCle),
    index("idx_rate_limits_chat_bucket_jour").on(t.bucketJour),
  ],
);

/* ─── Facturation Stripe (LOT K) ────────────────────────────────── */

export const planAbonnementEnum = pgEnum("plan_abonnement", [
  "text-s",
  "text-l",
  "premium-s",
  "premium-l",
  "pack-web-s",
  "pack-web-l",
]);

export const statutAbonnementEnum = pgEnum("statut_abonnement", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
]);

export const stripeSubscriptions = pgTable(
  "stripe_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
    stripePriceId: text("stripe_price_id").notNull(),
    plan: planAbonnementEnum("plan").notNull(),
    statut: statutAbonnementEnum("statut").notNull(),
    periodeFinLe: timestamp("periode_fin_le", { withTimezone: true }),
    annuleFinDePeriode: boolean("annule_fin_de_periode")
      .notNull()
      .default(false),
    essaiFinLe: timestamp("essai_fin_le", { withTimezone: true }),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    majLe: timestamp("maj_le", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_stripe_subscriptions_user_id").on(t.userId)],
);

/* ─── Comptage conversations par site et par mois ──────────────── */

export const usageConversations = pgTable(
  "usage_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bucketMois: text("bucket_mois").notNull(),
    nbConversations: integer("nb_conversations").notNull().default(0),
    nbMessages: integer("nb_messages").notNull().default(0),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    majLe: timestamp("maj_le", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_usage_conversations_user_bucket").on(t.userId, t.bucketMois),
    index("idx_usage_conversations_site_bucket").on(t.siteId, t.bucketMois),
  ],
);

/* ─── Audits publicité / Ads (LOT J) ────────────────────────────── */

export const auditAdsStatutEnum = pgEnum("audit_ads_statut", [
  "en_cours",
  "termine",
  "echec",
]);

export const auditAdsDeclencheurEnum = pgEnum("audit_ads_declencheur", [
  "manuel",
  "auto_mensuel",
  "api",
]);

export const adsAudits = pgTable(
  "ads_audits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    urlAuditee: text("url_auditee").notNull(),
    declencheur: auditAdsDeclencheurEnum("declencheur")
      .notNull()
      .default("manuel"),
    statut: auditAdsStatutEnum("statut").notNull().default("en_cours"),
    scoreGlobal: integer("score_global"),
    scoreTrackers: integer("score_trackers"),
    scoreConsentement: integer("score_consentement"),
    scoreVisibilite: integer("score_visibilite"),
    scoreRemarketing: integer("score_remarketing"),
    trackersDetectes: jsonb("trackers_detectes")
      .$type<TrackerDetecte[]>()
      .notNull()
      .default([]),
    annoncesConcurrentes: jsonb("annonces_concurrentes")
      .$type<AnnonceSerp[]>()
      .notNull()
      .default([]),
    findings: jsonb("findings").$type<FindingAds[]>().notNull().default([]),
    recommandations: jsonb("recommandations")
      .$type<RecommandationAds[]>()
      .notNull()
      .default([]),
    motsClesTestes: text("mots_cles_testes").array().notNull().default([]),
    dureeMs: integer("duree_ms"),
    erreur: text("erreur"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    termineLe: timestamp("termine_le", { withTimezone: true }),
  },
  (t) => [
    index("idx_ads_audits_site_id").on(t.siteId),
    index("idx_ads_audits_cree_le").on(t.creeLe),
  ],
);

export type TrackerDetecte = {
  code: string;
  nom: string;
  categorie: "analytics" | "publicite" | "remarketing" | "attribution" | "cmp";
  id?: string;
};

export type AnnonceSerp = {
  requete: string;
  position: number;
  titre: string;
  url: string;
  description?: string;
};

export type FindingAds = {
  pilier: "trackers" | "consentement" | "visibilite" | "remarketing";
  code: string;
  severite: "critique" | "haute" | "moyenne" | "basse" | "info";
  message: string;
  details?: Record<string, unknown>;
};

export type RecommandationAds = {
  titre: string;
  description: string;
  priorite: "critique" | "haute" | "moyenne" | "basse";
  effort: "faible" | "moyen" | "eleve";
  impact: "faible" | "moyen" | "fort";
  pilier: FindingAds["pilier"];
  pris_en_charge_axi?: {
    pack: string;
    cout_sans_axi: string;
    cout_avec_axi: string;
  };
};

/* ─── Membres additionnels d'un site (futur, LOT E) ─────────────── */
/* Un site peut avoir plusieurs humains qui l'administrent (ex. le
 * propriétaire + son community manager). Préparé mais pas exploité
 * en V1 — ownerUserId sur sites suffit. */

export const siteMembres = pgTable(
  "site_membres",
  {
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("admin"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.siteId, t.userId] })],
);

/* ─── Workspaces (compte client multi-admin, migration 0016) ────── */
/* Un workspace regroupe plusieurs admins ayant les mêmes droits sur
 * un ensemble de sites. Les permissions passent par workspace_members.
 */

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nom: text("nom").notNull(),
    creeParUserId: uuid("cree_par_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    majLe: timestamp("maj_le", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_workspaces_cree_par").on(t.creeParUserId)],
);

export const workspaceRoleEnum = pgEnum("workspace_role", ["admin"]);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("admin"),
    ajouteLe: timestamp("ajoute_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("workspace_members_workspace_user_unique").on(
      t.workspaceId,
      t.userId,
    ),
    index("idx_workspace_members_user").on(t.userId),
    index("idx_workspace_members_workspace").on(t.workspaceId),
  ],
);

export const workspaceInvitationStatutEnum = pgEnum(
  "workspace_invitation_statut",
  ["en_attente", "acceptee", "expiree", "revoquee"],
);

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    prenom: text("prenom"),
    nom: text("nom"),
    token: text("token").notNull().unique(),
    statut: workspaceInvitationStatutEnum("statut")
      .notNull()
      .default("en_attente"),
    creeParUserId: uuid("cree_par_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
    accepteParUserId: uuid("accepte_par_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    accepteLe: timestamp("accepte_le", { withTimezone: true }),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_workspace_invitations_token").on(t.token),
    index("idx_workspace_invitations_workspace").on(t.workspaceId),
    index("idx_workspace_invitations_email").on(t.email),
  ],
);

/* ─── Destinataires supplémentaires du rapport quotidien ─────── */

export const siteRapportDestinataires = pgTable(
  "site_rapport_destinataires",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    prenom: text("prenom"),
    ajouteParUserId: uuid("ajoute_par_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("site_rapport_destinataires_site_email_unique").on(
      t.siteId,
      t.email,
    ),
    index("idx_site_rapport_destinataires_site").on(t.siteId),
  ],
);

/* ─── Archivage des rapports quotidiens envoyés (migration 0019) ── */

export const rapportsQuotidiens = pgTable(
  "rapports_quotidiens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .defaultNow()
      .notNull(),
    periodeDebut: timestamp("periode_debut", { withTimezone: true }).notNull(),
    periodeFin: timestamp("periode_fin", { withTimezone: true }).notNull(),
    stats: jsonb("stats").notNull().default({}),
    opportunite: jsonb("opportunite"),
    html: text("html").notNull(),
    destinatairePrincipal: text("destinataire_principal"),
    nbDestinatairesSupp: integer("nb_destinataires_supp").notNull().default(0),
    statutEnvoi: text("statut_envoi").notNull().default("envoye"),
    mode: text("mode").notNull().default("auto"),
  },
  (t) => [
    index("idx_rapports_quotidiens_site").on(t.siteId),
    index("idx_rapports_quotidiens_cree_le").on(t.creeLe),
  ],
);
