import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { securiteInterventions } from "@/lib/db/schema";

/**
 * CRUD du journal des interventions AXI Security Shield.
 * Repository du pack — réutilisable AxiSolver + AxiHub.
 */

export type StatutIntervention =
  | "en_attente_validation"
  | "programmee"
  | "en_cours"
  | "terminee"
  | "echec"
  | "refusee"
  | "annulee";

export type ModeDeclenche = "desactive" | "validation" | "automatique";

export type Intervention = {
  id: string;
  siteId: string;
  auditId: string | null;
  findingCode: string;
  pilier: string;
  titre: string;
  descriptionAction: string;
  statut: StatutIntervention;
  modeDeclenche: ModeDeclenche;
  creeLe: Date;
  programmeePour: Date | null;
  executeLe: Date | null;
  termineLe: Date | null;
  resultat: unknown;
  erreur: string | null;
  valideParUserId: string | null;
  valideLe: Date | null;
};

export async function listerInterventions(
  siteId: string,
  limite = 50,
): Promise<Intervention[]> {
  try {
    const rows = await db
      .select()
      .from(securiteInterventions)
      .where(eq(securiteInterventions.siteId, siteId))
      .orderBy(desc(securiteInterventions.creeLe))
      .limit(limite);
    return rows as unknown as Intervention[];
  } catch {
    return [];
  }
}

export async function creerIntervention(params: {
  siteId: string;
  auditId?: string | null;
  findingCode: string;
  pilier: string;
  titre: string;
  descriptionAction: string;
  statut: StatutIntervention;
  modeDeclenche: ModeDeclenche;
  valideParUserId?: string;
}): Promise<{ id: string }> {
  const [row] = await db
    .insert(securiteInterventions)
    .values({
      siteId: params.siteId,
      auditId: params.auditId ?? null,
      findingCode: params.findingCode,
      pilier: params.pilier,
      titre: params.titre,
      descriptionAction: params.descriptionAction,
      statut: params.statut,
      modeDeclenche: params.modeDeclenche,
      valideParUserId: params.valideParUserId ?? null,
      valideLe: params.valideParUserId ? new Date() : null,
    })
    .returning({ id: securiteInterventions.id });
  return { id: row.id };
}

export async function marquerExecution(params: {
  interventionId: string;
  siteId: string;
  statut: StatutIntervention;
  resultat?: unknown;
  erreur?: string | null;
}): Promise<void> {
  const now = new Date();
  const patch: Record<string, unknown> = {
    statut: params.statut,
  };
  if (params.statut === "en_cours") {
    patch.executeLe = now;
  } else if (
    params.statut === "terminee" ||
    params.statut === "echec" ||
    params.statut === "refusee" ||
    params.statut === "annulee"
  ) {
    patch.termineLe = now;
  }
  if (params.resultat !== undefined) patch.resultat = params.resultat;
  if (params.erreur !== undefined) patch.erreur = params.erreur;

  await db
    .update(securiteInterventions)
    .set(patch)
    .where(
      and(
        eq(securiteInterventions.id, params.interventionId),
        eq(securiteInterventions.siteId, params.siteId),
      ),
    );
}

export async function recupererIntervention(
  interventionId: string,
  siteId: string,
): Promise<Intervention | null> {
  const [row] = await db
    .select()
    .from(securiteInterventions)
    .where(
      and(
        eq(securiteInterventions.id, interventionId),
        eq(securiteInterventions.siteId, siteId),
      ),
    )
    .limit(1);
  return (row as unknown as Intervention) ?? null;
}
