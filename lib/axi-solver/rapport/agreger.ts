import "server-only";

import { and, eq, gte, lt, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  adsAudits,
  conversations,
  seoAudits,
  securityAudits,
  securityIncidents,
  tickets,
  type FindingAds,
  type FindingSecurity,
  type FindingSeo,
  type RecommandationAds,
  type RecommandationSecurity,
  type RecommandationSeo,
} from "@/lib/db/schema";

/**
 * Agrégation des stats d'activité d'un site AxiSolver sur une période
 * (par défaut : les dernières 24h).
 *
 * Utilisée par le rapport quotidien envoyé chaque matin par Brevo.
 * Retourne des chiffres interprétables + une analyse qualitative
 * (demandes récurrentes, demandes non résolues) qui alimente le
 * pattern cheval de Troie upsell AXI Initial.
 */

export type AlerteSecurite = {
  severite: "info" | "attention" | "critique";
  message: string;
};

/** Résumé synthétique d'un pilier (Ads/SEO/Sécurité) pour le rapport. */
export type ResumePilier = {
  disponible: boolean; // true si un audit terminé existe
  scoreGlobal: number | null; // 0-100
  statut: "ok" | "attention" | "critique" | "indisponible";
  dateAudit: Date | null;
  nbRecosCritiques: number;
  nbRecosHautes: number;
  topRecos: Array<{ titre: string; priorite: string }>; // top 3
};

/** Résumé Sécurité : résumé pilier + incidents ouverts par sévérité. */
export type ResumeSecurite = ResumePilier & {
  nbIncidentsOuverts: number;
  nbIncidentsCritiques: number;
  nbIncidentsHauts: number;
  sslExpirationJours: number | null; // null si pas d'info
};

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

  // Activité horaire : 24 valeurs (conversations par heure UTC)
  activiteHoraire: number[];

  // Score satisfaction visiteur (heuristique 0-100)
  scoreSatisfaction: number;

  // Comparaison avec la même journée la semaine précédente
  comparaisonSemainePrec: {
    nbConversations: number;
    nbVisiteursUniques: number;
    deltaConversationsPct: number | null; // null si semaine préc. à 0
    deltaVisiteursPct: number | null;
  };

  // Alertes sécurité remontées (SSL, incidents ouverts, audits KO)
  alertesSecurite: AlerteSecurite[];

  // Résumés piliers Ads / SEO / Sécurité (sections dédiées du rapport)
  resumeAds: ResumePilier;
  resumeSeo: ResumePilier;
  resumeSecurite: ResumeSecurite;
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
  const nbVisiteursUniques = visiteursSet.size;
  const nbToursMoyen =
    nbConversations > 0 ? Math.round((nbToursTotal / nbConversations) * 10) / 10 : 0;

  // Activité horaire : 24 cases (0h → 23h UTC)
  const activiteHoraire = Array<number>(24).fill(0);
  for (const conv of conversationsPeriode) {
    const h = new Date(conv.creeLe).getUTCHours();
    activiteHoraire[h] = (activiteHoraire[h] ?? 0) + 1;
  }

  // Score satisfaction (heuristique 0-100). Base 100, pénalités pour
  // tickets chauds/urgents, conversations non résolues, tours moyens
  // excessifs. Pondération simple et interprétable.
  let scoreSatisfaction = 100;
  if (nbConversations > 0) {
    const partNonResolu = conversationsSansResolution / nbConversations;
    scoreSatisfaction -= Math.round(partNonResolu * 35);
  }
  scoreSatisfaction -= nbTicketsChauds * 4;
  scoreSatisfaction -= nbTicketsUrgents * 10;
  if (nbToursMoyen > 8) scoreSatisfaction -= 8;
  else if (nbToursMoyen > 5) scoreSatisfaction -= 4;
  scoreSatisfaction = Math.max(0, Math.min(100, scoreSatisfaction));

  // Comparaison avec J-7 : même durée, 7 jours avant
  const dureeMs = fin.getTime() - debut.getTime();
  const debutSemPrec = new Date(debut.getTime() - 7 * 24 * 60 * 60 * 1000);
  const finSemPrec = new Date(debutSemPrec.getTime() + dureeMs);
  let convSemPrec: Array<{ visiteurId: string | null }> = [];
  try {
    convSemPrec = await db
      .select({ visiteurId: conversations.visiteurId })
      .from(conversations)
      .where(
        and(
          eq(conversations.siteId, siteId),
          gte(conversations.creeLe, debutSemPrec),
          lt(conversations.creeLe, finSemPrec),
        ),
      );
  } catch (e) {
    console.error("[agreger] comparaison semaine préc. échec:", e);
  }
  const visiteursSemPrec = new Set<string>();
  for (const c of convSemPrec) {
    if (c.visiteurId) visiteursSemPrec.add(c.visiteurId);
  }
  const nbConversationsSemPrec = convSemPrec.length;
  const nbVisiteursSemPrec = visiteursSemPrec.size;
  const deltaConversationsPct =
    nbConversationsSemPrec > 0
      ? Math.round(
          ((nbConversations - nbConversationsSemPrec) / nbConversationsSemPrec) *
            100,
        )
      : null;
  const deltaVisiteursPct =
    nbVisiteursSemPrec > 0
      ? Math.round(
          ((nbVisiteursUniques - nbVisiteursSemPrec) / nbVisiteursSemPrec) *
            100,
        )
      : null;

  // Alertes sécurité : dernier audit + incidents ouverts
  const alertesSecurite: AlerteSecurite[] = [];
  try {
    const [dernierAudit] = await db
      .select({
        statut: securityAudits.statut,
        scoreGlobal: securityAudits.scoreGlobal,
        creeLe: securityAudits.creeLe,
      })
      .from(securityAudits)
      .where(eq(securityAudits.siteId, siteId))
      .orderBy(desc(securityAudits.creeLe))
      .limit(1);
    if (dernierAudit?.statut === "termine" && dernierAudit.scoreGlobal != null) {
      if (dernierAudit.scoreGlobal < 50) {
        alertesSecurite.push({
          severite: "critique",
          message: `Score sécurité critique : ${dernierAudit.scoreGlobal}/100. Ouvrez l'onglet Sécurité pour agir.`,
        });
      } else if (dernierAudit.scoreGlobal < 75) {
        alertesSecurite.push({
          severite: "attention",
          message: `Score sécurité à surveiller : ${dernierAudit.scoreGlobal}/100.`,
        });
      }
    }

    const incidentsOuverts = await db
      .select({ severite: securityIncidents.severite })
      .from(securityIncidents)
      .where(
        and(
          eq(securityIncidents.siteId, siteId),
          eq(securityIncidents.statut, "ouvert"),
        ),
      );
    const nbCritiques = incidentsOuverts.filter(
      (i) => i.severite === "critique",
    ).length;
    const nbEleves = incidentsOuverts.filter(
      (i) => i.severite === "haute",
    ).length;
    if (nbCritiques > 0) {
      alertesSecurite.push({
        severite: "critique",
        message: `${nbCritiques} incident${nbCritiques > 1 ? "s" : ""} critique${nbCritiques > 1 ? "s" : ""} ouvert${nbCritiques > 1 ? "s" : ""}.`,
      });
    }
    if (nbEleves > 0) {
      alertesSecurite.push({
        severite: "attention",
        message: `${nbEleves} incident${nbEleves > 1 ? "s" : ""} de sévérité élevée en cours.`,
      });
    }
  } catch (e) {
    console.error("[agreger] alertes sécurité échec:", e);
  }

  // Résumés Ads / SEO / Sécurité — dernier audit "termine" par pilier
  const resumeAds = await resumerAds(siteId);
  const resumeSeo = await resumerSeo(siteId);
  const resumeSecurite = await resumerSecurite(siteId);

  return {
    siteId,
    debut,
    fin,
    nbConversations,
    nbVisiteursUniques,
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
    activiteHoraire,
    scoreSatisfaction,
    comparaisonSemainePrec: {
      nbConversations: nbConversationsSemPrec,
      nbVisiteursUniques: nbVisiteursSemPrec,
      deltaConversationsPct,
      deltaVisiteursPct,
    },
    alertesSecurite,
    resumeAds,
    resumeSeo,
    resumeSecurite,
  };
}

/** Statut dérivé d'un score (0-100). Même seuils que le dashboard. */
function statutDepuisScore(
  score: number | null,
): "ok" | "attention" | "critique" | "indisponible" {
  if (score === null) return "indisponible";
  if (score >= 75) return "ok";
  if (score >= 50) return "attention";
  return "critique";
}

/** Résume le dernier audit Ads terminé pour la section rapport. */
async function resumerAds(siteId: string): Promise<ResumePilier> {
  const vide: ResumePilier = {
    disponible: false,
    scoreGlobal: null,
    statut: "indisponible",
    dateAudit: null,
    nbRecosCritiques: 0,
    nbRecosHautes: 0,
    topRecos: [],
  };
  try {
    const [audit] = await db
      .select({
        scoreGlobal: adsAudits.scoreGlobal,
        recommandations: adsAudits.recommandations,
        termineLe: adsAudits.termineLe,
        creeLe: adsAudits.creeLe,
      })
      .from(adsAudits)
      .where(and(eq(adsAudits.siteId, siteId), eq(adsAudits.statut, "termine")))
      .orderBy(desc(adsAudits.creeLe))
      .limit(1);
    if (!audit) return vide;
    const recos = (audit.recommandations as RecommandationAds[]) ?? [];
    return {
      disponible: true,
      scoreGlobal: audit.scoreGlobal ?? null,
      statut: statutDepuisScore(audit.scoreGlobal ?? null),
      dateAudit: audit.termineLe ?? audit.creeLe,
      nbRecosCritiques: recos.filter((r) => r.priorite === "critique").length,
      nbRecosHautes: recos.filter((r) => r.priorite === "haute").length,
      topRecos: recos
        .filter((r) => r.priorite === "critique" || r.priorite === "haute")
        .slice(0, 3)
        .map((r) => ({ titre: r.titre, priorite: r.priorite })),
    };
  } catch (e) {
    console.error("[agreger] résumé Ads échec:", e);
    return vide;
  }
}

/** Résume le dernier audit SEO terminé pour la section rapport. */
async function resumerSeo(siteId: string): Promise<ResumePilier> {
  const vide: ResumePilier = {
    disponible: false,
    scoreGlobal: null,
    statut: "indisponible",
    dateAudit: null,
    nbRecosCritiques: 0,
    nbRecosHautes: 0,
    topRecos: [],
  };
  try {
    const [audit] = await db
      .select({
        scoreGlobal: seoAudits.scoreGlobal,
        recommandations: seoAudits.recommandations,
        termineLe: seoAudits.termineLe,
        creeLe: seoAudits.creeLe,
      })
      .from(seoAudits)
      .where(and(eq(seoAudits.siteId, siteId), eq(seoAudits.statut, "termine")))
      .orderBy(desc(seoAudits.creeLe))
      .limit(1);
    if (!audit) return vide;
    const recos = (audit.recommandations as RecommandationSeo[]) ?? [];
    return {
      disponible: true,
      scoreGlobal: audit.scoreGlobal ?? null,
      statut: statutDepuisScore(audit.scoreGlobal ?? null),
      dateAudit: audit.termineLe ?? audit.creeLe,
      nbRecosCritiques: recos.filter((r) => r.priorite === "critique").length,
      nbRecosHautes: recos.filter((r) => r.priorite === "haute").length,
      topRecos: recos
        .filter((r) => r.priorite === "critique" || r.priorite === "haute")
        .slice(0, 3)
        .map((r) => ({ titre: r.titre, priorite: r.priorite })),
    };
  } catch (e) {
    console.error("[agreger] résumé SEO échec:", e);
    return vide;
  }
}

/** Résume le dernier audit Sécurité + incidents ouverts. */
async function resumerSecurite(siteId: string): Promise<ResumeSecurite> {
  const vide: ResumeSecurite = {
    disponible: false,
    scoreGlobal: null,
    statut: "indisponible",
    dateAudit: null,
    nbRecosCritiques: 0,
    nbRecosHautes: 0,
    topRecos: [],
    nbIncidentsOuverts: 0,
    nbIncidentsCritiques: 0,
    nbIncidentsHauts: 0,
    sslExpirationJours: null,
  };
  try {
    const [audit] = await db
      .select({
        scoreGlobal: securityAudits.scoreGlobal,
        recommandations: securityAudits.recommandations,
        certificatSslExpireeLe: securityAudits.certificatSslExpireeLe,
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
      .limit(1);

    const incidents = await db
      .select({ severite: securityIncidents.severite })
      .from(securityIncidents)
      .where(
        and(
          eq(securityIncidents.siteId, siteId),
          eq(securityIncidents.statut, "ouvert"),
        ),
      );

    const nbIncidentsCritiques = incidents.filter(
      (i) => i.severite === "critique",
    ).length;
    const nbIncidentsHauts = incidents.filter(
      (i) => i.severite === "haute",
    ).length;

    if (!audit) {
      return {
        ...vide,
        nbIncidentsOuverts: incidents.length,
        nbIncidentsCritiques,
        nbIncidentsHauts,
      };
    }

    const recos = (audit.recommandations as RecommandationSecurity[]) ?? [];
    const sslJours = audit.certificatSslExpireeLe
      ? Math.round(
          (new Date(audit.certificatSslExpireeLe).getTime() - Date.now()) /
            (24 * 60 * 60 * 1000),
        )
      : null;

    // Dégrade le statut si incidents ouverts, même si le score est bon
    let statut = statutDepuisScore(audit.scoreGlobal ?? null);
    if (nbIncidentsCritiques > 0) statut = "critique";
    else if (nbIncidentsHauts > 0 && statut === "ok") statut = "attention";

    return {
      disponible: true,
      scoreGlobal: audit.scoreGlobal ?? null,
      statut,
      dateAudit: audit.termineLe ?? audit.creeLe,
      nbRecosCritiques: recos.filter((r) => r.priorite === "critique").length,
      nbRecosHautes: recos.filter((r) => r.priorite === "haute").length,
      topRecos: recos
        .filter((r) => r.priorite === "critique" || r.priorite === "haute")
        .slice(0, 3)
        .map((r) => ({ titre: r.titre, priorite: r.priorite })),
      nbIncidentsOuverts: incidents.length,
      nbIncidentsCritiques,
      nbIncidentsHauts,
      sslExpirationJours: sslJours,
    };
  } catch (e) {
    console.error("[agreger] résumé Sécurité échec:", e);
    return vide;
  }
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
