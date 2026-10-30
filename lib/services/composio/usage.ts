import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { composioUsageMensuel } from "@/lib/db/schema";

/**
 * Metering mensuel de l'usage Composio, pour :
 *   - alerter l'admin à 80 % du quota de son pack
 *   - facturer l'overage au-delà de 100 %
 *   - calculer notre coût interne consolidé (dashboard super-admin)
 *
 * Appelé par chaque wrapper de tool après exécution réussie.
 *
 * Coût estimé en cents (centièmes d'euro) :
 *   - 1 tool call = 0.0003 USD ≈ 0.028 cent  → arrondi à 0.03 cent
 *   - 1 trigger = 0.003 USD ≈ 0.28 cent      → arrondi à 0.28 cent
 * On garde l'unité « cents » pour éviter les floats.
 */

const COUT_TOOL_CALL_CENTS = 0.03;
const COUT_TRIGGER_CENTS = 0.28;

export function bucketMoisCourant(d: Date = new Date()): string {
  const an = d.getUTCFullYear();
  const mois = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${an}-${mois}`;
}

/**
 * Incrémente le compteur mensuel pour (user, site, pack, connecteur).
 * Upsert : crée la ligne si absente, sinon ajoute aux compteurs.
 */
export async function enregistrerUsage(params: {
  userId: string;
  siteId: string | null;
  packSlug: string;
  connectorSlug: string;
  nbToolCalls?: number;
  nbTriggers?: number;
}): Promise<void> {
  const bucket = bucketMoisCourant();
  const nbCalls = params.nbToolCalls ?? 0;
  const nbTrigs = params.nbTriggers ?? 0;
  const coutCentsAjout = Math.ceil(
    nbCalls * COUT_TOOL_CALL_CENTS + nbTrigs * COUT_TRIGGER_CENTS,
  );

  try {
    await db
      .insert(composioUsageMensuel)
      .values({
        userId: params.userId,
        siteId: params.siteId,
        packSlug: params.packSlug,
        connectorSlug: params.connectorSlug,
        bucketMois: bucket,
        nbToolCalls: nbCalls,
        nbTriggers: nbTrigs,
        coutEstimeCents: coutCentsAjout,
      })
      .onConflictDoUpdate({
        target: [
          composioUsageMensuel.userId,
          composioUsageMensuel.siteId,
          composioUsageMensuel.packSlug,
          composioUsageMensuel.connectorSlug,
          composioUsageMensuel.bucketMois,
        ],
        set: {
          nbToolCalls: sql`${composioUsageMensuel.nbToolCalls} + ${nbCalls}`,
          nbTriggers: sql`${composioUsageMensuel.nbTriggers} + ${nbTrigs}`,
          coutEstimeCents: sql`${composioUsageMensuel.coutEstimeCents} + ${coutCentsAjout}`,
          majLe: sql`now()`,
        },
      });
  } catch (e) {
    console.warn("[composio-usage] enregistrement échoué", e);
  }
}

/**
 * Lit l'usage mensuel courant d'un user × pack × connecteur.
 * Retourne null si aucune ligne (pas encore d'usage ce mois).
 */
export async function lireUsageMensuel(params: {
  userId: string;
  siteId: string | null;
  packSlug: string;
  connectorSlug: string;
}): Promise<{
  nbToolCalls: number;
  nbTriggers: number;
  coutEstimeCents: number;
} | null> {
  const bucket = bucketMoisCourant();
  const siteCond = params.siteId
    ? eq(composioUsageMensuel.siteId, params.siteId)
    : sql`${composioUsageMensuel.siteId} IS NULL`;

  const [row] = await db
    .select({
      nbToolCalls: composioUsageMensuel.nbToolCalls,
      nbTriggers: composioUsageMensuel.nbTriggers,
      coutEstimeCents: composioUsageMensuel.coutEstimeCents,
    })
    .from(composioUsageMensuel)
    .where(
      and(
        eq(composioUsageMensuel.userId, params.userId),
        siteCond,
        eq(composioUsageMensuel.packSlug, params.packSlug),
        eq(composioUsageMensuel.connectorSlug, params.connectorSlug),
        eq(composioUsageMensuel.bucketMois, bucket),
      ),
    )
    .limit(1);

  if (!row) return null;
  return row;
}

/**
 * Vérifie si l'usage dépasse le quota configuré pour ce pack ×
 * connecteur. Permet au wrapper de refuser l'appel ou de facturer
 * en overage. Les quotas sont centralisés dans
 * `lib/services/composio/quotas.ts` (lot suivant).
 */
export async function depasseQuota(params: {
  userId: string;
  siteId: string | null;
  packSlug: string;
  connectorSlug: string;
  quotaToolCalls: number;
  quotaTriggers: number;
}): Promise<{
  depasse: boolean;
  ratioAtteint: number;
  nbToolCalls: number;
  nbTriggers: number;
}> {
  const usage = await lireUsageMensuel(params);
  const nbCalls = usage?.nbToolCalls ?? 0;
  const nbTrigs = usage?.nbTriggers ?? 0;
  const ratioCalls = params.quotaToolCalls > 0 ? nbCalls / params.quotaToolCalls : 0;
  const ratioTrigs = params.quotaTriggers > 0 ? nbTrigs / params.quotaTriggers : 0;
  const ratioMax = Math.max(ratioCalls, ratioTrigs);
  return {
    depasse: ratioMax >= 1,
    ratioAtteint: ratioMax,
    nbToolCalls: nbCalls,
    nbTriggers: nbTrigs,
  };
}
