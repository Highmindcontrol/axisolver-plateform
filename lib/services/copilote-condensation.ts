import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import {
  compterMessages,
  lireHistoriqueComplet,
  majMemoireLongue,
  type MessagePersiste,
} from "./copilote-memoire";

/**
 * Service de condensation long terme.
 *
 * Quand un fil dépasse `SEUIL_CONDENSATION` messages, on résume en
 * texte libre les plus anciens (hors fenêtre contexte de 60) et on
 * stocke ce résumé dans `copilote_conversations.memoire_longue`.
 *
 * Résultat : à chaque appel Claude, on envoie :
 *   - system prompt + memoire_longue (synthèse texte des anciens)
 *   - 60 derniers messages en clair
 *
 * Les messages bruts restent en base intégralement (jamais effacés).
 * Le résumé est juste un accélérateur pour tenir dans le contexte
 * Claude, pas une perte d'information.
 */

const SEUIL_CONDENSATION = 120; // au-delà, on résume les plus anciens
const FENETRE_RECENTE = 60; // on garde les N derniers en clair

export async function peutDeclencherCondensation(
  filId: string,
): Promise<boolean> {
  const n = await compterMessages(filId);
  return n >= SEUIL_CONDENSATION;
}

/**
 * Condense les anciens messages du fil en synthèse textuelle. Appel
 * Claude dédié avec un prompt résumeur. Idempotent : si plusieurs
 * appels concurrents, la dernière écriture gagne (pas de verrou,
 * acceptable car synthèse déterministe à ~5% près).
 */
export async function condenserFil(filId: string): Promise<void> {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) return;

  const tous = await lireHistoriqueComplet(filId);
  if (tous.length <= FENETRE_RECENTE) return;

  const anciens = tous.slice(0, tous.length - FENETRE_RECENTE);
  if (anciens.length === 0) return;

  const extrait = anciens
    .map(
      (m: MessagePersiste) =>
        `[${m.creeLe.toISOString().slice(0, 10)}] ${
          m.role === "user" ? "USER" : m.role === "assistant" ? "AXI" : "SYS"
        }: ${m.contenu}`,
    )
    .join("\n\n");

  const anthropic = new Anthropic({ apiKey: cle });
  const reponse = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    system: `Tu es l'archiviste d'AXI. Ton rôle : résumer de manière DENSE et FACTUELLE une conversation entre un admin et AXI (son copilote AxiSolver). Garde absolument : les décisions prises, les faits chiffrés mentionnés (dates, montants, scores, URLs, noms de sites, mots-clés), les engagements, les problèmes rencontrés. Jette le smalltalk, les reformulations, les politesses. Format : paragraphes thématiques courts, dates ISO quand pertinent. Pas d'opinion, pas d'enjolivure.`,
    messages: [
      {
        role: "user",
        content: `Résume cet historique de conversation (du plus ancien au plus récent) en 10-15 lignes maximum. Chaque fait doit pouvoir être retrouvé facilement si AXI est questionné dessus dans plusieurs mois.\n\n---\n\n${extrait}`,
      },
    ],
  });

  const bloc = reponse.content.find((b) => b.type === "text");
  const synthese = bloc && bloc.type === "text" ? bloc.text : null;
  if (!synthese) return;

  await majMemoireLongue(filId, synthese);
}
