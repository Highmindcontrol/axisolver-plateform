import {
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
  vector,
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
  nomEntreprise: text("nom_entreprise").notNull(),
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
  actif: boolean("actif").notNull().default(true),
  creeLe: timestamp("cree_le", { withTimezone: true }).defaultNow().notNull(),
  majLe: timestamp("maj_le", { withTimezone: true }).defaultNow().notNull(),
});

/* ─── Site configs ──────────────────────────────────────────────── */
/* Un seul enregistrement par site. 1-1. */

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
    }),
  mentionsLegalesUrl: text("mentions_legales_url"),
  politiqueConfUrl: text("politique_conf_url"),
  emailNotification: text("email_notification"),
  creeLe: timestamp("cree_le", { withTimezone: true }).defaultNow().notNull(),
  majLe: timestamp("maj_le", { withTimezone: true }).defaultNow().notNull(),
});

export type BrandingConfig = {
  couleurPrincipale: string;
  couleurSecondaire: string;
  logoUrl: string | null;
  position: "bas-droite" | "bas-gauche";
  afficherPropulsePar: boolean;
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
