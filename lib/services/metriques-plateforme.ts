import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  sites,
  stripeSubscriptions,
  usageConversations,
  users,
} from "@/lib/db/schema";
import { FORMULES, type SlugPlan } from "@/lib/stripe/formules";

/**
 * Métriques globales de la plateforme AxiSolver pour le back-office
 * super-admin. Toutes les requêtes sont enveloppées en try/catch :
 * si une table manque (migration non appliquée), on renvoie 0.
 */

export type MetriquesPlateforme = {
  nbClientsTotal: number;
  nbClientsNouveauxCeMois: number;
  nbSitesTotal: number;
  mrrEurHt: number;
  nbAbonnementsActifs: number;
  nbEssaisEnCours: number;
  nbAnnulationsEnCours: number;
  repartitionFormules: Array<{
    plan: SlugPlan;
    nomFormule: string;
    nbAbonnements: number;
    revenuMensuelHt: number;
  }>;
  nbConversationsCeMois: number;
  nbMessagesCeMois: number;
  topSitesConversations: Array<{
    siteSlug: string;
    nomSite: string;
    nbConversations: number;
  }>;
};

export async function lireMetriquesPlateforme(): Promise<MetriquesPlateforme> {
  const bucketMois = formatBucketMois(new Date());
  const debutMois = debutDuMois(new Date());

  const [
    nbClientsTotal,
    nbClientsNouveauxCeMois,
    nbSitesTotal,
    abonnements,
    conversationsMois,
    topSites,
  ] = await Promise.all([
    compterClients(),
    compterClientsNouveaux(debutMois),
    compterSites(),
    agregerAbonnements(),
    agregerConversationsMois(bucketMois),
    classerTopSites(bucketMois),
  ]);

  return {
    nbClientsTotal,
    nbClientsNouveauxCeMois,
    nbSitesTotal,
    mrrEurHt: abonnements.mrrEurHt,
    nbAbonnementsActifs: abonnements.nbActifs,
    nbEssaisEnCours: abonnements.nbEssais,
    nbAnnulationsEnCours: abonnements.nbAnnulations,
    repartitionFormules: abonnements.repartition,
    nbConversationsCeMois: conversationsMois.nbConversations,
    nbMessagesCeMois: conversationsMois.nbMessages,
    topSitesConversations: topSites,
  };
}

async function compterClients(): Promise<number> {
  try {
    const [row] = await db.select({ n: count() }).from(users);
    return Number(row?.n ?? 0);
  } catch {
    return 0;
  }
}

async function compterClientsNouveaux(depuis: Date): Promise<number> {
  try {
    const [row] = await db
      .select({ n: count() })
      .from(users)
      .where(gte(users.creeLe, depuis));
    return Number(row?.n ?? 0);
  } catch {
    return 0;
  }
}

async function compterSites(): Promise<number> {
  try {
    const [row] = await db.select({ n: count() }).from(sites);
    return Number(row?.n ?? 0);
  } catch {
    return 0;
  }
}

async function agregerAbonnements(): Promise<{
  mrrEurHt: number;
  nbActifs: number;
  nbEssais: number;
  nbAnnulations: number;
  repartition: MetriquesPlateforme["repartitionFormules"];
}> {
  try {
    const lignes = await db
      .select({
        plan: stripeSubscriptions.plan,
        statut: stripeSubscriptions.statut,
        annule: stripeSubscriptions.annuleFinDePeriode,
        n: count(),
      })
      .from(stripeSubscriptions)
      .groupBy(
        stripeSubscriptions.plan,
        stripeSubscriptions.statut,
        stripeSubscriptions.annuleFinDePeriode,
      );

    const parPlan = new Map<SlugPlan, number>();
    let mrrEurHt = 0;
    let nbActifs = 0;
    let nbEssais = 0;
    let nbAnnulations = 0;

    for (const l of lignes) {
      const plan = l.plan as SlugPlan;
      const nb = Number(l.n);
      const formule = FORMULES[plan];
      if (!formule) continue;

      if (l.statut === "active") {
        nbActifs += nb;
        mrrEurHt += nb * formule.prixMensuelHt;
        parPlan.set(plan, (parPlan.get(plan) ?? 0) + nb);
        if (l.annule) nbAnnulations += nb;
      } else if (l.statut === "trialing") {
        nbEssais += nb;
      }
    }

    const repartition: MetriquesPlateforme["repartitionFormules"] = (
      Object.keys(FORMULES) as SlugPlan[]
    ).map((plan) => {
      const nbAbonnements = parPlan.get(plan) ?? 0;
      return {
        plan,
        nomFormule: FORMULES[plan].nom,
        nbAbonnements,
        revenuMensuelHt: nbAbonnements * FORMULES[plan].prixMensuelHt,
      };
    });

    return { mrrEurHt, nbActifs, nbEssais, nbAnnulations, repartition };
  } catch {
    return {
      mrrEurHt: 0,
      nbActifs: 0,
      nbEssais: 0,
      nbAnnulations: 0,
      repartition: (Object.keys(FORMULES) as SlugPlan[]).map((plan) => ({
        plan,
        nomFormule: FORMULES[plan].nom,
        nbAbonnements: 0,
        revenuMensuelHt: 0,
      })),
    };
  }
}

async function agregerConversationsMois(
  bucketMois: string,
): Promise<{ nbConversations: number; nbMessages: number }> {
  try {
    const [row] = await db
      .select({
        nbConv: sum(usageConversations.nbConversations),
        nbMsg: sum(usageConversations.nbMessages),
      })
      .from(usageConversations)
      .where(eq(usageConversations.bucketMois, bucketMois));
    return {
      nbConversations: Number(row?.nbConv ?? 0),
      nbMessages: Number(row?.nbMsg ?? 0),
    };
  } catch {
    return { nbConversations: 0, nbMessages: 0 };
  }
}

async function classerTopSites(
  bucketMois: string,
): Promise<MetriquesPlateforme["topSitesConversations"]> {
  try {
    const lignes = await db
      .select({
        siteSlug: sites.slug,
        nomSite: sql<string>`COALESCE(${sites.nomSite}, ${sites.nomEntreprise})`,
        nbConversations: sum(usageConversations.nbConversations),
      })
      .from(usageConversations)
      .innerJoin(sites, eq(sites.id, usageConversations.siteId))
      .where(eq(usageConversations.bucketMois, bucketMois))
      .groupBy(sites.slug, sites.nomSite, sites.nomEntreprise)
      .orderBy(desc(sum(usageConversations.nbConversations)))
      .limit(10);
    return lignes.map((l) => ({
      siteSlug: l.siteSlug,
      nomSite: l.nomSite,
      nbConversations: Number(l.nbConversations),
    }));
  } catch {
    return [];
  }
}

function formatBucketMois(d: Date): string {
  const an = d.getUTCFullYear();
  const mois = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${an}-${mois}`;
}

function debutDuMois(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
