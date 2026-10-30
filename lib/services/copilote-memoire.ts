import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";

import { embedUn } from "@/lib/axi-solver/connaissance/embeddings";
import { db } from "@/lib/db";
import { copiloteConversations, copiloteMessages } from "@/lib/db/schema";

/**
 * Service de mémoire persistante du chat copilote AXI (admin).
 *
 * Doctrine : AXI se souvient de TOUT depuis le premier jour. Zéro
 * perte de mémoire, zéro tronquage. On stocke chaque message en ligne
 * dédiée (jamais JSONB) pour permettre audit, embeddings futurs et
 * requêtes fines.
 *
 * Un fil = (user_id, site_slug) unique. Si site_slug est null, c'est
 * le fil global (admin pas focalisé sur un site).
 */

const FENETRE_CONTEXTE = 60; // nb max de derniers messages envoyés à Claude

export type MessagePersiste = {
  id: string;
  role: "user" | "assistant" | "system";
  contenu: string;
  creeLe: Date;
};

export type FilCopilote = {
  id: string;
  userId: string;
  siteSlug: string | null;
  titre: string;
  memoireLongue: string | null;
  creeLe: Date;
  derniereActiviteLe: Date;
};

/**
 * Récupère le fil existant pour (userId, siteSlug) ou en crée un nouveau.
 * Retourne toujours un fil (jamais null).
 */
export async function chargerOuCreerFil(
  userId: string,
  siteSlug: string | null,
): Promise<FilCopilote> {
  const [existant] = await db
    .select()
    .from(copiloteConversations)
    .where(
      and(
        eq(copiloteConversations.userId, userId),
        siteSlug === null
          ? isNull(copiloteConversations.siteSlug)
          : eq(copiloteConversations.siteSlug, siteSlug),
      ),
    )
    .orderBy(desc(copiloteConversations.derniereActiviteLe))
    .limit(1);

  if (existant) {
    return {
      id: existant.id,
      userId: existant.userId,
      siteSlug: existant.siteSlug,
      titre: existant.titre,
      memoireLongue: existant.memoireLongue,
      creeLe: existant.creeLe,
      derniereActiviteLe: existant.derniereActiviteLe,
    };
  }

  const [nouveau] = await db
    .insert(copiloteConversations)
    .values({
      userId,
      siteSlug,
      titre: siteSlug ? `Conversation ${siteSlug}` : "Conversation globale",
    })
    .returning();

  return {
    id: nouveau.id,
    userId: nouveau.userId,
    siteSlug: nouveau.siteSlug,
    titre: nouveau.titre,
    memoireLongue: nouveau.memoireLongue,
    creeLe: nouveau.creeLe,
    derniereActiviteLe: nouveau.derniereActiviteLe,
  };
}

/**
 * Lit les N derniers messages d'un fil, dans l'ordre chronologique
 * (plus ancien en premier). N = FENETRE_CONTEXTE par défaut.
 */
export async function lireMessagesContexte(
  conversationId: string,
  limite: number = FENETRE_CONTEXTE,
): Promise<MessagePersiste[]> {
  // On lit les N derniers (DESC) puis on inverse pour l'ordre chrono
  const rows = await db
    .select({
      id: copiloteMessages.id,
      role: copiloteMessages.role,
      contenu: copiloteMessages.contenu,
      creeLe: copiloteMessages.creeLe,
    })
    .from(copiloteMessages)
    .where(eq(copiloteMessages.conversationId, conversationId))
    .orderBy(desc(copiloteMessages.creeLe))
    .limit(limite);

  return rows
    .reverse()
    .map((r) => ({
      id: r.id,
      role: r.role as MessagePersiste["role"],
      contenu: r.contenu,
      creeLe: r.creeLe,
    }));
}

/**
 * Insère un ou plusieurs messages. Calcule l'embedding OpenAI pour
 * chacun (si OPENAI_API_KEY disponible) afin de permettre la
 * recherche sémantique long terme (RAG). Si l'embedding échoue,
 * on persiste quand même le message en base — mémoire brute avant
 * mémoire enrichie.
 *
 * Le trigger SQL met à jour `derniere_activite_le` automatiquement
 * sur chaque insertion.
 */
export async function appendMessages(
  conversationId: string,
  messages: Array<{
    role: "user" | "assistant" | "system";
    contenu: string;
    tokensInput?: number;
    tokensOutput?: number;
  }>,
): Promise<void> {
  if (messages.length === 0) return;

  // Calcul embeddings en parallèle (meilleur effort — jamais bloquant)
  const embeddings = await Promise.all(
    messages.map((m) =>
      embedUn(m.contenu).catch(() => null as number[] | null),
    ),
  );

  await db.insert(copiloteMessages).values(
    messages.map((m, i) => ({
      conversationId,
      role: m.role,
      contenu: m.contenu,
      tokensInput: m.tokensInput ?? 0,
      tokensOutput: m.tokensOutput ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      embedding: (embeddings[i]
        ? (`[${embeddings[i]!.join(",")}]` as unknown)
        : null) as any,
    })),
  );
}

/**
 * Recherche sémantique dans TOUT l'historique de l'utilisateur, en
 * excluant les N derniers messages du fil courant (déjà en contexte
 * Claude). Permet à AXI de « se souvenir » d'un détail évoqué il y a
 * plusieurs mois.
 */
export async function chercherMessagesPertinents(options: {
  userId: string;
  conversationId: string;
  requete: string;
  limite?: number;
  seuilSimilarite?: number;
}): Promise<
  Array<{
    role: "user" | "assistant" | "system";
    contenu: string;
    creeLe: Date;
    similarite: number;
  }>
> {
  let embeddingRequete: number[];
  try {
    embeddingRequete = await embedUn(options.requete);
  } catch {
    return [];
  }

  const vecteurTexte = `[${embeddingRequete.join(",")}]`;
  try {
    const rows = await db.execute(sql`
      SELECT role, contenu, cree_le, similarite
      FROM copilote_rag_messages_pertinents(
        ${options.conversationId}::uuid,
        ${options.userId}::uuid,
        ${vecteurTexte}::vector,
        ${options.limite ?? 5}::integer,
        ${options.seuilSimilarite ?? 0.65}::float,
        60::integer
      )
    `);
    return (rows as unknown as Array<{
      role: string;
      contenu: string;
      cree_le: string | Date;
      similarite: number;
    }>).map((r) => ({
      role: r.role as "user" | "assistant" | "system",
      contenu: r.contenu,
      creeLe: new Date(r.cree_le),
      similarite: Number(r.similarite),
    }));
  } catch (e) {
    console.warn("[copilote-memoire] RAG indisponible", e);
    return [];
  }
}

/**
 * Compte le nombre total de messages d'un fil. Utilisé pour décider
 * s'il faut déclencher une condensation (résumé long terme).
 */
export async function compterMessages(
  conversationId: string,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(copiloteMessages)
    .where(eq(copiloteMessages.conversationId, conversationId));
  return Number(row?.n ?? 0);
}

/**
 * Met à jour la mémoire longue (synthèse texte) d'un fil. Utilisée
 * par le job de condensation qui résume les anciens messages.
 */
export async function majMemoireLongue(
  conversationId: string,
  memoireLongue: string,
): Promise<void> {
  await db
    .update(copiloteConversations)
    .set({ memoireLongue })
    .where(eq(copiloteConversations.id, conversationId));
}

/**
 * Lit TOUT l'historique d'un fil (sans limite). Utilisé pour
 * reconstruire l'historique affiché côté client au mount, ou pour
 * la condensation long terme en mémoire longue (V2).
 */
export async function lireHistoriqueComplet(
  conversationId: string,
): Promise<MessagePersiste[]> {
  const rows = await db
    .select({
      id: copiloteMessages.id,
      role: copiloteMessages.role,
      contenu: copiloteMessages.contenu,
      creeLe: copiloteMessages.creeLe,
    })
    .from(copiloteMessages)
    .where(eq(copiloteMessages.conversationId, conversationId))
    .orderBy(asc(copiloteMessages.creeLe));

  return rows.map((r) => ({
    id: r.id,
    role: r.role as MessagePersiste["role"],
    contenu: r.contenu,
    creeLe: r.creeLe,
  }));
}

/**
 * Charge un fil par son ID avec vérification d'ownership.
 * Retourne null si le fil n'existe pas ou appartient à un autre user.
 */
export async function lireFilParId(
  filId: string,
  userId: string,
): Promise<FilCopilote | null> {
  const [row] = await db
    .select()
    .from(copiloteConversations)
    .where(
      and(
        eq(copiloteConversations.id, filId),
        eq(copiloteConversations.userId, userId),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    siteSlug: row.siteSlug,
    titre: row.titre,
    memoireLongue: row.memoireLongue,
    creeLe: row.creeLe,
    derniereActiviteLe: row.derniereActiviteLe,
  };
}

/**
 * Crée explicitement un nouveau fil pour (userId, siteSlug). Ne
 * réutilise JAMAIS un fil existant (contrairement à chargerOuCreerFil).
 * Utilisé par le bouton « Nouvelle conversation ».
 */
export async function creerNouveauFil(
  userId: string,
  siteSlug: string | null,
  titre?: string,
): Promise<FilCopilote> {
  const [row] = await db
    .insert(copiloteConversations)
    .values({
      userId,
      siteSlug,
      titre: titre ?? "Nouvelle conversation",
    })
    .returning();
  return {
    id: row.id,
    userId: row.userId,
    siteSlug: row.siteSlug,
    titre: row.titre,
    memoireLongue: row.memoireLongue,
    creeLe: row.creeLe,
    derniereActiviteLe: row.derniereActiviteLe,
  };
}

/**
 * Liste tous les fils d'un user (optionnellement filtrés par site)
 * avec un enrichissement : nb de messages + premier message user
 * (pour affichage dans le journal des conversations).
 */
export async function lireFilsParSite(
  userId: string,
  siteSlug: string | null,
): Promise<
  Array<{
    id: string;
    titre: string;
    siteSlug: string | null;
    creeLe: Date;
    derniereActiviteLe: Date;
    nbMessages: number;
    premierMessage: string | null;
  }>
> {
  const whereClauses = [eq(copiloteConversations.userId, userId)];
  if (siteSlug === null) {
    whereClauses.push(isNull(copiloteConversations.siteSlug));
  } else {
    whereClauses.push(eq(copiloteConversations.siteSlug, siteSlug));
  }

  const fils = await db
    .select()
    .from(copiloteConversations)
    .where(and(...whereClauses))
    .orderBy(desc(copiloteConversations.derniereActiviteLe));

  // Enrichissement par fil : count + premier message user. Un passage
  // SQL par fil (acceptable car ≤ ~50 fils par site/user typique).
  const enrichis = await Promise.all(
    fils.map(async (f) => {
      const [cnt] = await db
        .select({ n: count() })
        .from(copiloteMessages)
        .where(eq(copiloteMessages.conversationId, f.id));
      const [premier] = await db
        .select({ contenu: copiloteMessages.contenu })
        .from(copiloteMessages)
        .where(
          and(
            eq(copiloteMessages.conversationId, f.id),
            eq(copiloteMessages.role, "user"),
          ),
        )
        .orderBy(asc(copiloteMessages.creeLe))
        .limit(1);
      return {
        id: f.id,
        titre: f.titre,
        siteSlug: f.siteSlug,
        creeLe: f.creeLe,
        derniereActiviteLe: f.derniereActiviteLe,
        nbMessages: Number(cnt?.n ?? 0),
        premierMessage: premier?.contenu ?? null,
      };
    }),
  );

  return enrichis;
}

/**
 * Met à jour le titre d'un fil. Vérifie ownership.
 * Retourne true si mise à jour effectuée.
 */
export async function majTitreFil(
  filId: string,
  userId: string,
  titre: string,
): Promise<boolean> {
  const titreNettoye = titre.trim().slice(0, 200);
  if (!titreNettoye) return false;
  const res = await db
    .update(copiloteConversations)
    .set({ titre: titreNettoye })
    .where(
      and(
        eq(copiloteConversations.id, filId),
        eq(copiloteConversations.userId, userId),
      ),
    )
    .returning({ id: copiloteConversations.id });
  return res.length > 0;
}
