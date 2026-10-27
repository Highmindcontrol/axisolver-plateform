import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { stripeSubscriptions, usageConversations } from "@/lib/db/schema";
import { FORMULES, type SlugPlan } from "./formules";

export type EtatAbonnement = {
  actif: boolean;
  plan: SlugPlan | null;
  statut: string | null;
  essaiActif: boolean;
  periodeFinLe: Date | null;
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
    };
  }

  return {
    actif: true,
    plan: sub.plan,
    statut: sub.statut,
    essaiActif: sub.statut === "trialing",
    periodeFinLe: sub.periodeFinLe,
  };
}

/**
 * Compte le nombre de conversations consommées par un utilisateur sur
 * le mois courant, tous sites confondus.
 */
export async function consommationMois(userId: string): Promise<{
  nbConversations: number;
  nbMessages: number;
  bucketMois: string;
}> {
  const bucketMois = bucketMoisCourant();
  const rows = await db
    .select({
      nbConversations: usageConversations.nbConversations,
      nbMessages: usageConversations.nbMessages,
    })
    .from(usageConversations)
    .where(
      and(
        eq(usageConversations.userId, userId),
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
  plan: SlugPlan | null;
}> {
  const [abonnement, consommation] = await Promise.all([
    etatAbonnement(params.userId),
    consommationMois(params.userId),
  ]);

  const limite = abonnement.plan
    ? FORMULES[abonnement.plan].nbConversationsMoisMax
    : 50;

  if (consommation.nbConversations >= limite) {
    return {
      autorise: false,
      raison: abonnement.plan
        ? `Quota mensuel du plan ${abonnement.plan} dépassé (${limite} conversations/mois).`
        : `Quota de découverte dépassé (${limite} conversations/mois). Souscrivez un plan AxiSolver pour continuer.`,
      consommees: consommation.nbConversations,
      limite,
      plan: abonnement.plan,
    };
  }

  return {
    autorise: true,
    consommees: consommation.nbConversations,
    limite,
    plan: abonnement.plan,
  };
}

export function bucketMoisCourant(): string {
  // Format YYYY-MM pour un bucket mensuel.
  return new Date().toISOString().slice(0, 7);
}
