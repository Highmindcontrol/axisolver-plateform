import { and, asc, desc, eq, isNull } from "drizzle-orm";

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
 * Insère un ou plusieurs messages. Un seul insert batch pour
 * atomicité. Le trigger SQL met à jour `derniere_activite_le`
 * automatiquement sur chaque insertion.
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
  await db.insert(copiloteMessages).values(
    messages.map((m) => ({
      conversationId,
      role: m.role,
      contenu: m.contenu,
      tokensInput: m.tokensInput ?? 0,
      tokensOutput: m.tokensOutput ?? 0,
    })),
  );
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
