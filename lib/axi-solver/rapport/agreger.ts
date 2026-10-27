import "server-only";

import { and, eq, gte, lt, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, tickets } from "@/lib/db/schema";

/**
 * Agrégation des stats d'activité d'un site AxiSolver sur une période
 * (par défaut : les dernières 24h).
 *
 * Utilisée par le rapport quotidien envoyé chaque matin par Brevo.
 * Retourne des chiffres interprétables + une analyse qualitative
 * (demandes récurrentes, demandes non résolues) qui alimente le
 * pattern cheval de Troie upsell AXI Initial.
 */

export type StatsQuotidiennes = {
  siteId: string;
  debut: Date;
  fin: Date;

  // Volumétrie
  nbConversations: number;
  nbVisiteursUniques: number;
  nbToursTotal: number;
  nbToursMoyen: number;

  // Tickets
  nbTicketsOuverts: number;
  nbTicketsChauds: number;
  nbTicketsUrgents: number;
  nbTicketsResolus: number;

  // Qualité
  topQuestions: string[];
  conversationsSansResolution: number;

  // Pour pattern upsell
  nbDemandesRdv: number;
  nbDemandesTarif: number;
  nbDemandesRappel: number;
};

export async function agregerStatsQuotidiennes(params: {
  siteId: string;
  debut?: Date;
  fin?: Date;
}): Promise<StatsQuotidiennes> {
  const { siteId } = params;
  const fin = params.fin ?? new Date();
  const debut =
    params.debut ?? new Date(fin.getTime() - 24 * 60 * 60 * 1000);

  // Conversations de la période
  const conversationsPeriode = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.siteId, siteId),
        gte(conversations.creeLe, debut),
        lt(conversations.creeLe, fin),
      ),
    );

  const visiteursSet = new Set<string>();
  let nbToursTotal = 0;
  const compteurQuestions = new Map<string, number>();
  let nbDemandesRdv = 0;
  let nbDemandesTarif = 0;
  let nbDemandesRappel = 0;
  let conversationsSansResolution = 0;

  for (const conv of conversationsPeriode) {
    if (conv.visiteurId) visiteursSet.add(conv.visiteurId);
    nbToursTotal += conv.nbTours;

    const messages =
      (conv.messages as Array<{ role: string; content: string }>) ?? [];

    const premierUser = messages.find((m) => m.role === "user");
    if (premierUser) {
      const normalise = normaliserQuestion(premierUser.content);
      if (normalise) {
        compteurQuestions.set(
          normalise,
          (compteurQuestions.get(normalise) ?? 0) + 1,
        );
      }
    }

    // Détecte les intentions dans tous les messages user
    const contenuUser = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content.toLowerCase())
      .join(" ");

    if (
      /(rendez-vous|rdv|rencontre|rencontrer|caler un (meeting|appel))/.test(
        contenuUser,
      )
    ) {
      nbDemandesRdv++;
    }
    if (
      /(tarif|prix|co[uû]t|combien|devis|budget)/.test(contenuUser)
    ) {
      nbDemandesTarif++;
    }
    if (/(rappelez|rappelé|rappel|me contacter|me joindre)/.test(contenuUser)) {
      nbDemandesRappel++;
    }

    // Si pas de message assistant ou si fin brutale (dernier message = user)
    if (
      messages.length === 0 ||
      messages[messages.length - 1]?.role === "user"
    ) {
      conversationsSansResolution++;
    }
  }

  // Tickets de la période
  const ticketsPeriode = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.siteId, siteId),
        gte(tickets.creeLe, debut),
        lt(tickets.creeLe, fin),
      ),
    );

  const nbTicketsOuverts = ticketsPeriode.filter(
    (t) => t.statut === "ouvert" || t.statut === "en_cours",
  ).length;
  const nbTicketsChauds = ticketsPeriode.filter(
    (t) => t.chaleur === "chaud",
  ).length;
  const nbTicketsUrgents = ticketsPeriode.filter(
    (t) => t.chaleur === "urgent",
  ).length;
  const nbTicketsResolus = ticketsPeriode.filter(
    (t) => t.statut === "resolu_par_axi" || t.statut === "ferme",
  ).length;

  // Top 5 questions (par fréquence)
  const topQuestions = [...compteurQuestions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([q, nb]) => `${q} (×${nb})`);

  const nbConversations = conversationsPeriode.length;
  const nbToursMoyen =
    nbConversations > 0 ? Math.round((nbToursTotal / nbConversations) * 10) / 10 : 0;

  return {
    siteId,
    debut,
    fin,
    nbConversations,
    nbVisiteursUniques: visiteursSet.size,
    nbToursTotal,
    nbToursMoyen,
    nbTicketsOuverts,
    nbTicketsChauds,
    nbTicketsUrgents,
    nbTicketsResolus,
    topQuestions,
    conversationsSansResolution,
    nbDemandesRdv,
    nbDemandesTarif,
    nbDemandesRappel,
  };
}

/** Normalise une question pour clustering simple (lowercase, trim, tronque). */
function normaliserQuestion(texte: string): string {
  const nettoye = texte
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (nettoye.length < 10) return "";
  return nettoye.slice(0, 120) + (nettoye.length > 120 ? "…" : "");
}
