import "server-only";

import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  adsAudits,
  conversations,
  seoAudits,
  securityAudits,
  securityIncidents,
  tickets,
  type AnnonceSerp,
} from "@/lib/db/schema";

/**
 * Agrégation des stats cumulées du site sur le mois courant (du 1er
 * du mois à maintenant). Alimente la section "Depuis le début du
 * mois" en haut de /dashboard/sites/[slug]/rapports.
 *
 * Diffère de `agregerStatsQuotidiennes` qui ne couvre que les 24
 * dernières heures : ici on raisonne cumulatif + on tire des infos
 * complémentaires des audits les plus récents (mots-clés SEO
 * positionnés, concurrents SERP, scores piliers).
 */

export type StatsMensuelles = {
  siteId: string;
  debutMois: Date;
  maintenant: Date;

  // Volumétrie cumulée
  nbVisiteursUniques: number;
  nbConversations: number;
  nbConversationsResolues: number;
  tauxResolutionPct: number;
  nbToursTotal: number;

  // Tickets du mois
  nbTicketsOuverts: number;
  nbTicketsChauds: number;
  nbTicketsUrgents: number;
  nbTicketsResolus: number;

  // Qualité
  scoreSatisfactionMoyen: number | null;
  topQuestionsMois: string[];

  // Intentions cumulées
  nbDemandesRdv: number;
  nbDemandesTarif: number;
  nbDemandesRappel: number;

  // SEO (dernier audit)
  seo: {
    disponible: boolean;
    scoreGlobal: number | null;
    motsClesTestes: string[];
    dateAudit: Date | null;
  };

  // Ads (dernier audit)
  ads: {
    disponible: boolean;
    scoreGlobal: number | null;
    concurrentsTop: Array<{ requete: string; nom: string; position: number }>;
    dateAudit: Date | null;
  };

  // Sécurité
  securite: {
    disponible: boolean;
    scoreGlobal: number | null;
    nbIncidentsMois: number;
    nbIncidentsCritiquesMois: number;
    dateAudit: Date | null;
  };
};

export async function agregerStatsMensuelles(params: {
  siteId: string;
  maintenant?: Date;
}): Promise<StatsMensuelles> {
  const { siteId } = params;
  const maintenant = params.maintenant ?? new Date();
  const debutMois = new Date(
    Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1),
  );

  // ────── Conversations du mois ──────
  const convs = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.siteId, siteId),
        gte(conversations.creeLe, debutMois),
        lt(conversations.creeLe, maintenant),
      ),
    );

  const visiteursSet = new Set<string>();
  let nbToursTotal = 0;
  let nbConversationsResolues = 0;
  let nbDemandesRdv = 0;
  let nbDemandesTarif = 0;
  let nbDemandesRappel = 0;
  const compteurQuestions = new Map<string, number>();

  for (const c of convs) {
    if (c.visiteurId) visiteursSet.add(c.visiteurId);
    nbToursTotal += c.nbTours;

    const messages =
      (c.messages as Array<{ role: string; content: string }>) ?? [];

    // Résolue si dernière intervention vient de l'assistant
    if (
      messages.length > 0 &&
      messages[messages.length - 1]?.role !== "user"
    ) {
      nbConversationsResolues++;
    }

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
    if (/(tarif|prix|co[uû]t|combien|devis|budget)/.test(contenuUser)) {
      nbDemandesTarif++;
    }
    if (/(rappelez|rappelé|rappel|me contacter|me joindre)/.test(contenuUser)) {
      nbDemandesRappel++;
    }
  }

  const nbConversations = convs.length;
  const nbVisiteursUniques = visiteursSet.size;
  const tauxResolutionPct =
    nbConversations > 0
      ? Math.round((nbConversationsResolues / nbConversations) * 100)
      : 0;

  // Score de satisfaction moyen : même heuristique que quotidien
  // mais lissé sur le mois (base 100 - pénalités pondérées).
  let scoreSatisfactionMoyen: number | null = null;
  if (nbConversations > 0) {
    const partNonResolu =
      (nbConversations - nbConversationsResolues) / nbConversations;
    let score = 100;
    score -= Math.round(partNonResolu * 35);
    const toursMoyen = nbToursTotal / nbConversations;
    if (toursMoyen > 8) score -= 8;
    else if (toursMoyen > 5) score -= 4;
    scoreSatisfactionMoyen = Math.max(0, Math.min(100, score));
  }

  const topQuestionsMois = [...compteurQuestions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([q, nb]) => `${q} (×${nb})`);

  // ────── Tickets du mois ──────
  const ticketsMois = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.siteId, siteId),
        gte(tickets.creeLe, debutMois),
        lt(tickets.creeLe, maintenant),
      ),
    );
  const nbTicketsOuverts = ticketsMois.filter(
    (t) => t.statut === "ouvert" || t.statut === "en_cours",
  ).length;
  const nbTicketsChauds = ticketsMois.filter((t) => t.chaleur === "chaud").length;
  const nbTicketsUrgents = ticketsMois.filter((t) => t.chaleur === "urgent").length;
  const nbTicketsResolus = ticketsMois.filter(
    (t) => t.statut === "resolu_par_axi" || t.statut === "ferme",
  ).length;

  // Pénalités tickets dans le score satisfaction mensuel
  if (scoreSatisfactionMoyen !== null) {
    scoreSatisfactionMoyen -= nbTicketsChauds * 2;
    scoreSatisfactionMoyen -= nbTicketsUrgents * 5;
    scoreSatisfactionMoyen = Math.max(0, Math.min(100, scoreSatisfactionMoyen));
  }

  // ────── Audits SEO / Ads / Sécurité (dernier terminé) ──────
  const [auditSeo] = await db
    .select({
      scoreGlobal: seoAudits.scoreGlobal,
      motsClesTestes: seoAudits.motsClesTestes,
      termineLe: seoAudits.termineLe,
      creeLe: seoAudits.creeLe,
    })
    .from(seoAudits)
    .where(and(eq(seoAudits.siteId, siteId), eq(seoAudits.statut, "termine")))
    .orderBy(desc(seoAudits.creeLe))
    .limit(1)
    .catch(() => []);

  const [auditAds] = await db
    .select({
      scoreGlobal: adsAudits.scoreGlobal,
      annoncesConcurrentes: adsAudits.annoncesConcurrentes,
      termineLe: adsAudits.termineLe,
      creeLe: adsAudits.creeLe,
    })
    .from(adsAudits)
    .where(and(eq(adsAudits.siteId, siteId), eq(adsAudits.statut, "termine")))
    .orderBy(desc(adsAudits.creeLe))
    .limit(1)
    .catch(() => []);

  const [auditSec] = await db
    .select({
      scoreGlobal: securityAudits.scoreGlobal,
      termineLe: securityAudits.termineLe,
      creeLe: securityAudits.creeLe,
    })
    .from(securityAudits)
    .where(
      and(
        eq(securityAudits.siteId, siteId),
        eq(securityAudits.statut, "termine"),
      ),
    )
    .orderBy(desc(securityAudits.creeLe))
    .limit(1)
    .catch(() => []);

  // Incidents sécurité du mois
  const incidentsMois = await db
    .select({ severite: securityIncidents.severite })
    .from(securityIncidents)
    .where(
      and(
        eq(securityIncidents.siteId, siteId),
        gte(securityIncidents.detecteLe, debutMois),
      ),
    )
    .catch(() => []);
  const nbIncidentsMois = incidentsMois.length;
  const nbIncidentsCritiquesMois = incidentsMois.filter(
    (i) => i.severite === "critique",
  ).length;

  // Top 5 concurrents SERP (unique par domaine)
  const annonces = (auditAds?.annoncesConcurrentes as AnnonceSerp[]) ?? [];
  const concurrentsMap = new Map<
    string,
    { requete: string; nom: string; position: number }
  >();
  for (const a of annonces) {
    try {
      const host = new URL(a.url).hostname.replace(/^www\./, "");
      if (!concurrentsMap.has(host)) {
        concurrentsMap.set(host, {
          requete: a.requete,
          nom: host,
          position: a.position,
        });
      }
    } catch {
      // URL invalide : ignore
    }
  }
  const concurrentsTop = [...concurrentsMap.values()]
    .sort((a, b) => a.position - b.position)
    .slice(0, 5);

  return {
    siteId,
    debutMois,
    maintenant,
    nbVisiteursUniques,
    nbConversations,
    nbConversationsResolues,
    tauxResolutionPct,
    nbToursTotal,
    nbTicketsOuverts,
    nbTicketsChauds,
    nbTicketsUrgents,
    nbTicketsResolus,
    scoreSatisfactionMoyen,
    topQuestionsMois,
    nbDemandesRdv,
    nbDemandesTarif,
    nbDemandesRappel,
    seo: {
      disponible: !!auditSeo,
      scoreGlobal: auditSeo?.scoreGlobal ?? null,
      motsClesTestes: (auditSeo?.motsClesTestes as string[]) ?? [],
      dateAudit: auditSeo?.termineLe ?? auditSeo?.creeLe ?? null,
    },
    ads: {
      disponible: !!auditAds,
      scoreGlobal: auditAds?.scoreGlobal ?? null,
      concurrentsTop,
      dateAudit: auditAds?.termineLe ?? auditAds?.creeLe ?? null,
    },
    securite: {
      disponible: !!auditSec,
      scoreGlobal: auditSec?.scoreGlobal ?? null,
      nbIncidentsMois,
      nbIncidentsCritiquesMois,
      dateAudit: auditSec?.termineLe ?? auditSec?.creeLe ?? null,
    },
  };
}

function normaliserQuestion(texte: string): string {
  const nettoye = texte
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (nettoye.length < 10) return "";
  return nettoye.slice(0, 120) + (nettoye.length > 120 ? "…" : "");
}
