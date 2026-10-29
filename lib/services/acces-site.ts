import "server-only";

import { eq, inArray, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { sites, workspaceMembers } from "@/lib/db/schema";

/**
 * Helper central pour les queries sites : construit un filtre SQL qui
 * autorise l'accès à un site si l'user en est le propriétaire legacy
 * (owner_user_id) OU s'il est membre d'un workspace propriétaire du
 * site (workspace_id).
 *
 * Fallback propre si la table workspace_members n'existe pas encore
 * en prod (migration 0016 pas appliquée) : limite à ownerUserId.
 */
export async function filtreSitesAccessibles(userId: string) {
  let workspaceIds: string[] = [];
  try {
    const rows = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));
    workspaceIds = rows.map((r) => r.workspaceId);
  } catch {
    workspaceIds = [];
  }

  if (workspaceIds.length === 0) {
    return eq(sites.ownerUserId, userId);
  }

  return or(
    eq(sites.ownerUserId, userId),
    inArray(sites.workspaceId, workspaceIds),
  )!;
}
