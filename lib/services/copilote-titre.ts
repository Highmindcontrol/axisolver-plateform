import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { copiloteConversations } from "@/lib/db/schema";

import {
  lireHistoriqueComplet,
  majTitreFil,
  type MessagePersiste,
} from "./copilote-memoire";

/**
 * Génération automatique du titre d'une conversation copilote.
 *
 * Doctrine : au bout de ~6 messages dans un fil encore marqué par un
 * titre par défaut ("Conversation globale", "Conversation <slug>",
 * "Nouvelle conversation"), on demande à Claude Haiku de résumer le
 * sujet en 4-5 mots. Appel bon marché (~1 cent / titre), fait en
 * arrière-plan via waitUntil pour ne pas bloquer la réponse à l'admin.
 *
 * Idempotent : si plusieurs appels concurrents sur le même fil, la
 * dernière écriture gagne (pas de verrou, acceptable).
 */

const TITRES_PAR_DEFAUT = [
  "Nouvelle conversation",
  "Conversation globale",
];
const SEUIL_GENERATION = 6; // nb messages à partir duquel on titre

/**
 * Vrai si le titre actuel du fil est un titre généré par défaut
 * (jamais touché par l'utilisateur ni par Claude). On ne régénère
 * JAMAIS un titre manuellement renommé.
 */
export function estTitreParDefaut(titre: string): boolean {
  if (!titre) return true;
  if (TITRES_PAR_DEFAUT.includes(titre.trim())) return true;
  if (titre.startsWith("Conversation ")) return true;
  return false;
}

/**
 * Génère un titre pour un fil si et seulement si :
 *   - il a au moins SEUIL_GENERATION messages
 *   - son titre est un défaut (jamais renommé)
 * Appel Claude Haiku, 4-5 mots, pas de ponctuation finale.
 */
export async function genererTitreSiPertinent(
  filId: string,
  userId: string,
): Promise<void> {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) return;

  // Vérifie le titre actuel + lit les messages
  const [fil] = await db
    .select({
      id: copiloteConversations.id,
      titre: copiloteConversations.titre,
      userId: copiloteConversations.userId,
    })
    .from(copiloteConversations)
    .where(
      and(
        eq(copiloteConversations.id, filId),
        eq(copiloteConversations.userId, userId),
      ),
    )
    .limit(1);
  if (!fil) return;
  if (!estTitreParDefaut(fil.titre)) return;

  const messages = await lireHistoriqueComplet(filId);
  if (messages.length < SEUIL_GENERATION) return;

  // On prend les 10 premiers messages — assez pour comprendre le
  // sujet, pas trop pour rester bon marché.
  const extrait = messages
    .slice(0, 10)
    .map(
      (m: MessagePersiste) =>
        `${m.role === "user" ? "ADMIN" : "AXI"}: ${m.contenu.slice(0, 400)}`,
    )
    .join("\n");

  const anthropic = new Anthropic({ apiKey: cle });
  const reponse = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 60,
    system:
      "Tu reçois un extrait de conversation entre un admin et son copilote IA AXI. Résume le sujet principal en 4 à 6 mots, en français, sans ponctuation finale, sans guillemets. Exemples : 'Audit SEO du site Coryphea', 'Préparation campagne Ads Q4', 'Problème accès admin Shopify'. Rends UNIQUEMENT le titre, rien d'autre.",
    messages: [
      {
        role: "user",
        content: `Résume ce fil en 4-6 mots :\n\n${extrait}`,
      },
    ],
  });

  const bloc = reponse.content.find((b) => b.type === "text");
  const brut = bloc && bloc.type === "text" ? bloc.text.trim() : "";
  if (!brut) return;

  // Nettoyage : retire guillemets et ponctuation finale
  const titre = brut
    .replace(/^["«»'`]+|["«»'`]+$/g, "")
    .replace(/[.!?,;:]+$/g, "")
    .trim()
    .slice(0, 100);
  if (!titre) return;

  await majTitreFil(filId, userId, titre);
}
