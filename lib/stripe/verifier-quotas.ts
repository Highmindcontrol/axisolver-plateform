import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sites,
  stripeSubscriptions,
  usageConversations,
} from "@/lib/db/schema";
import { FORMULES, type SlugPlan } from "./formules";

export type EtatAbonnement = {
  actif: boolean;
  plan: SlugPlan | null;
  statut: string | null;
  essaiActif: boolean;
  periodeFinLe: Date | null;
  /** Workspace lié à l'abonnement (doctrine multisite 31 oct 2026). */
  workspaceId: string | null;
  /** Nombre de sites au-delà des 3 inclus (chaque = +29 €/mois). */
  sitesSupplementaires: number;
  /** Conversations bonus cumulées (= sites_supplementaires × 100). */
  bonusConversations: number;
};

/**
 * Lit l'abonnement courant d'un utilisateur. Un abonnement est actif
 * si son statut est `trialing` ou `active`.
 */
export async function etatAbonnement(userId: string): Promise<EtatAbonnement> {
  const [sub] = await db
    .select()
    .from(stripeSubscriptions)
    .where(
      and(
        eq(stripeSubscriptions.userId, userId),
        inArray(stripeSubscriptions.statut, ["trialing", "active"]),
      ),
    )
    .limit(1);

  if (!sub) {
    return {
      actif: false,
      plan: null,
      statut: null,
      essaiActif: false,
      periodeFinLe: null,
      workspaceId: null,
      sitesSupplementaires: 0,
      bonusConversations: 0,
    };
  }

  return {
    actif: true,
    plan: sub.plan,
    statut: sub.statut,
    essaiActif: sub.statut === "trialing",
    periodeFinLe: sub.periodeFinLe,
    workspaceId: sub.workspaceId,
    sitesSupplementaires: sub.sitesSupplementaires ?? 0,
    bonusConversations: sub.bonusConversations ?? 0,
  };
}

/**
 * Compte le nombre de conversations consommées sur le mois courant.
 *
 * Doctrine multisite (31 oct 2026) : si l'abo a un `workspace_id`, on
 * agrège sur TOUS les sites du workspace (quota partagé entre les 3
 * sites inclus + sites supplémentaires). Sinon fallback legacy sur
 * agrégation par `usage_conversations.user_id`.
 */
export async function consommationMois(params: {
  userId: string;
  workspaceId?: string | null;
}): Promise<{
  nbConversations: number;
  nbMessages: number;
  bucketMois: string;
}> {
  const bucketMois = bucketMoisCourant();

  // Mode workspace : agrège sur tous les sites du workspace
  if (params.workspaceId) {
    const sitesWorkspace = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.workspaceId, params.workspaceId));
    const siteIds = sitesWorkspace.map((s) => s.id);
    if (siteIds.length === 0) {
      return { nbConversations: 0, nbMessages: 0, bucketMois };
    }
    const rows = await db
      .select({
        nbConversations: usageConversations.nbConversations,
        nbMessages: usageConversations.nbMessages,
      })
      .from(usageConversations)
      .where(
        and(
          inArray(usageConversations.siteId, siteIds),
          eq(usageConversations.bucketMois, bucketMois),
        ),
      );
    const nbConversations = rows.reduce(
      (acc, r) => acc + r.nbConversations,
      0,
    );
    const nbMessages = rows.reduce((acc, r) => acc + r.nbMessages, 0);
    return { nbConversations, nbMessages, bucketMois };
  }

  // Fallback legacy : par user_id
  const rows = await db
    .select({
      nbConversations: usageConversations.nbConversations,
      nbMessages: usageConversations.nbMessages,
    })
    .from(usageConversations)
    .where(
      and(
        eq(usageConversations.userId, params.userId),
        eq(usageConversations.bucketMois, bucketMois),
      ),
    );
  const nbConversations = rows.reduce((acc, r) => acc + r.nbConversations, 0);
  const nbMessages = rows.reduce((acc, r) => acc + r.nbMessages, 0);
  return { nbConversations, nbMessages, bucketMois };
}

/**
 * Vérifie que l'utilisateur peut encore recevoir des conversations
 * sur son plan. Retourne autorise=false si le quota est dépassé.
 *
 * Doctrine multisite : la limite est `FORMULES[plan].nbMax +
 * bonusConversations` où `bonusConversations = sitesSupplementaires × 100`.
 *
 * Mode fail-open : si l'utilisateur n'a aucun abonnement actif, on
 * autorise jusqu'à 50 conversations/mois en mode « découverte »
 * (bloquer complètement rendrait AxiSolver inutilisable pour les
 * sites système Ataraxis dogfood).
 */
export async function verifierQuotaConversations(params: {
  userId: string;
}): Promise<{
  autorise: boolean;
  raison?: string;
  consommees: number;
  limite: number;
  limiteBase: number;
  bonus: number;
  plan: SlugPlan | null;
}> {
  const abonnement = await etatAbonnement(params.userId);
  const consommation = await consommationMois({
    userId: params.userId,
    workspaceId: abonnement.workspaceId,
  });

  const limiteBase = abonnement.plan
    ? FORMULES[abonnement.plan].nbConversationsMoisMax
    : 50;
  const bonus = abonnement.bonusConversations;
  const limite = limiteBase + bonus;

  if (consommation.nbConversations >= limite) {
    const detailBonus =
      bonus > 0 ? ` (incl. ${bonus} bonus sites supplémentaires)` : "";
    return {
      autorise: false,
      raison: abonnement.plan
        ? `Quota mensuel du plan ${abonnement.plan} dépassé (${limite} conversations/mois${detailBonus}).`
        : `Quota de découverte dépassé (${limite} conversations/mois). Souscrivez un plan AxiSolver pour continuer.`,
      consommees: consommation.nbConversations,
      limite,
      limiteBase,
      bonus,
      plan: abonnement.plan,
    };
  }

  return {
    autorise: true,
    consommees: consommation.nbConversations,
    limite,
    limiteBase,
    bonus,
    plan: abonnement.plan,
  };
}

export function bucketMoisCourant(): string {
  // Format YYYY-MM pour un bucket mensuel.
  return new Date().toISOString().slice(0, 7);
}
