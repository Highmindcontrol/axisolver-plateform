import "server-only";

import { and, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { sites, workspaceMembers } from "@/lib/db/schema";

/**
 * Helper central pour les queries sites : construit un filtre SQL qui
 * autorise l'accès à un site si l'user en est le propriétaire legacy
 * (owner_user_id) OU s'il est membre d'un workspace propriétaire du
 * site (workspace_id), **en respectant le scope `sites_accessibles`
 * du co-admin** (doctrine multisite 31 oct 2026).
 *
 * Scope `sites_accessibles` :
 *   - `null` → full access (tous les sites du workspace)
 *   - `[]` → aucun (lecture seule, cas site supprimé)
 *   - `[uuid1, uuid2, …]` → limité à ces sites
 *
 * Fallback propre si la table workspace_members n'existe pas encore
 * en prod (migration 0016 pas appliquée) : limite à ownerUserId.
 */
export async function filtreSitesAccessibles(userId: string) {
  type MembreRow = {
    workspaceId: string;
    sitesAccessibles: string[] | null;
  };
  let membres: MembreRow[] = [];
  try {
    membres = await db
      .select({
        workspaceId: workspaceMembers.workspaceId,
        sitesAccessibles: workspaceMembers.sitesAccessibles,
      })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));
  } catch {
    membres = [];
  }

  if (membres.length === 0) {
    return eq(sites.ownerUserId, userId);
  }

  // Workspaces avec full access (sites_accessibles IS NULL)
  const workspacesFull = membres
    .filter((m) => m.sitesAccessibles === null)
    .map((m) => m.workspaceId);

  // Sites explicitement autorisés par scope limité (union de toutes
  // les listes non-null non-vides).
  const sitesExplicites: string[] = [];
  for (const m of membres) {
    if (Array.isArray(m.sitesAccessibles) && m.sitesAccessibles.length > 0) {
      sitesExplicites.push(...m.sitesAccessibles);
    }
  }

  const conditions = [eq(sites.ownerUserId, userId)];
  if (workspacesFull.length > 0) {
    conditions.push(inArray(sites.workspaceId, workspacesFull));
  }
  if (sitesExplicites.length > 0) {
    conditions.push(inArray(sites.id, sitesExplicites));
  }

  return or(...conditions)!;
}

/**
 * Détermine si un user est en « lecture seule » dans un workspace :
 * membre explicite avec `sites_accessibles = []` (son site a été
 * supprimé, pas réassigné). Le super admin doit lui attribuer un
 * nouveau site pour qu'il reprenne un accès.
 */
export async function estLectureSeuleDansWorkspace(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  try {
    const [row] = await db
      .select({ scope: workspaceMembers.sitesAccessibles })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    if (!row) return false;
    return Array.isArray(row.scope) && row.scope.length === 0;
  } catch {
    return false;
  }
}

/**
 * Retourne la liste des UUIDs de sites qu'un user peut voir DANS un
 * workspace précis. Utile pour les UI qui affichent la liste des
 * sites du scope courant (dropdown bascule, grille sites).
 *
 * - Si user non-membre du workspace → tableau vide
 * - Si full access → tous les sites du workspace
 * - Si scope limité → intersection sites_accessibles ∩ sites du workspace
 */
export async function sitesAccessiblesDansWorkspace(
  userId: string,
  workspaceId: string,
): Promise<string[]> {
  try {
    const [membre] = await db
      .select({ scope: workspaceMembers.sitesAccessibles })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    if (!membre) return [];

    // Full access → tous les sites du workspace
    if (membre.scope === null) {
      const tous = await db
        .select({ id: sites.id })
        .from(sites)
        .where(eq(sites.workspaceId, workspaceId));
      return tous.map((s) => s.id);
    }

    // Scope limité (ou vide) → intersection avec sites réellement
    // présents dans le workspace (filtre les uuid orphelins si un
    // site a été supprimé entre-temps).
    if (membre.scope.length === 0) return [];
    const resultats = await db
      .select({ id: sites.id })
      .from(sites)
      .where(
        and(
          eq(sites.workspaceId, workspaceId),
          inArray(sites.id, membre.scope),
        ),
      );
    return resultats.map((s) => s.id);
  } catch {
    return [];
  }
}

/** Nombre de sites actuels dans un workspace (utile pour la logique
 *  « sites 4+ facturés 29 €/mois chacun »). */
export async function compterSitesWorkspace(
  workspaceId: string,
): Promise<number> {
  try {
    const [row] = await db
      .select({ nb: sql<number>`count(*)::int` })
      .from(sites)
      .where(eq(sites.workspaceId, workspaceId));
    return row?.nb ?? 0;
  } catch {
    return 0;
  }
}
