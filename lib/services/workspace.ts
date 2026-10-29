import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  sites,
  workspaceInvitations,
  workspaceMembers,
  workspaces,
} from "@/lib/db/schema";

/**
 * Services workspace multi-admin.
 *
 * Résistant à l'absence des tables en prod (fallback propre tant que
 * la migration 0016 n'est pas appliquée) : chaque fonction try/catch
 * et renvoie un fallback vide ou basé sur ownerUserId legacy.
 *
 * Doctrine : tous les membres d'un workspace ont le même rôle 'admin'.
 * Pas de hiérarchie, pas de propriétaire unique.
 */

export type MembreWorkspace = {
  userId: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  ajouteLe: Date;
  estCreateur: boolean;
};

export type InvitationWorkspace = {
  id: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  statut: "en_attente" | "acceptee" | "expiree" | "revoquee";
  expireLe: Date;
  creeLe: Date;
};

export type WorkspaceActif = {
  id: string;
  nom: string;
  creeParUserId: string;
};

/**
 * Retourne le workspace actif de l'utilisateur. Pour V1, un user
 * n'a qu'un seul workspace (celui créé à son inscription ou celui
 * dont il est membre après invitation). Retourne null si la table
 * workspaces n'existe pas encore en prod — l'appelant fera le
 * fallback sur l'ancien système ownerUserId.
 */
export async function getWorkspaceActif(
  userId: string,
): Promise<WorkspaceActif | null> {
  try {
    const [row] = await db
      .select({
        id: workspaces.id,
        nom: workspaces.nom,
        creeParUserId: workspaces.creeParUserId,
      })
      .from(workspaces)
      .innerJoin(
        workspaceMembers,
        eq(workspaceMembers.workspaceId, workspaces.id),
      )
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

/**
 * Idempotent : retourne le workspace actif, et le crée si l'user
 * n'en a pas encore. Appelé par les pages qui ont besoin d'une
 * garantie de workspace (comme Votre compte > Co-administrateurs).
 *
 * `nomDefaut` sert à nommer le workspace si on doit le créer
 * (typiquement l'email de l'user).
 *
 * Gère proactivement le cas où la shadow row public.users n'existe
 * pas encore pour l'user (créations antérieures au trigger de sync
 * auth.users → public.users) : insert ON CONFLICT DO NOTHING sur
 * users avant la création du workspace.
 */
export async function ensureWorkspaceActif(
  userId: string,
  nomDefaut: string,
): Promise<WorkspaceActif | null> {
  const existant = await getWorkspaceActif(userId);
  if (existant) return existant;

  // Garantit la shadow row public.users (évite échec FK sur
  // cree_par_user_id si le user vient d'auth sans trigger de sync).
  try {
    await db.execute(
      sql`INSERT INTO users (id) VALUES (${userId}) ON CONFLICT DO NOTHING`,
    );
  } catch (e) {
    console.error("[ensureWorkspaceActif] shadow users insert failed:", e);
  }

  try {
    const [cree] = await db
      .insert(workspaces)
      .values({
        nom: `${nomDefaut} — compte`,
        creeParUserId: userId,
      })
      .returning({
        id: workspaces.id,
        nom: workspaces.nom,
        creeParUserId: workspaces.creeParUserId,
      });

    if (!cree) {
      console.error("[ensureWorkspaceActif] insert workspace returned no row");
      return null;
    }

    await db
      .insert(workspaceMembers)
      .values({
        workspaceId: cree.id,
        userId,
        role: "admin",
      })
      .onConflictDoNothing();

    return cree;
  } catch (e) {
    console.error(
      "[ensureWorkspaceActif] création workspace échouée :",
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}

/**
 * Liste les membres actifs d'un workspace (avec métadonnées user
 * récupérées côté Supabase Auth par l'appelant si besoin). Retourne
 * les workspace_members en l'état ; l'appelant fera la jointure
 * avec les infos user de son choix.
 */
export async function listerMembres(
  workspaceId: string,
): Promise<
  Array<{
    userId: string;
    ajouteLe: Date;
    estCreateur: boolean;
  }>
> {
  try {
    const [workspace] = await db
      .select({ creeParUserId: workspaces.creeParUserId })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    const createurId = workspace?.creeParUserId ?? null;

    const rows = await db
      .select({
        userId: workspaceMembers.userId,
        ajouteLe: workspaceMembers.ajouteLe,
      })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId))
      .orderBy(workspaceMembers.ajouteLe);

    return rows.map((r) => ({
      userId: r.userId,
      ajouteLe: r.ajouteLe,
      estCreateur: createurId === r.userId,
    }));
  } catch {
    return [];
  }
}

/**
 * Liste les invitations en attente d'un workspace. Masque
 * automatiquement les invitations expirées (expire_le < now).
 */
export async function listerInvitationsEnAttente(
  workspaceId: string,
): Promise<InvitationWorkspace[]> {
  try {
    const rows = await db
      .select({
        id: workspaceInvitations.id,
        email: workspaceInvitations.email,
        prenom: workspaceInvitations.prenom,
        nom: workspaceInvitations.nom,
        statut: workspaceInvitations.statut,
        expireLe: workspaceInvitations.expireLe,
        creeLe: workspaceInvitations.creeLe,
      })
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, workspaceId),
          eq(workspaceInvitations.statut, "en_attente"),
          gt(workspaceInvitations.expireLe, new Date()),
        ),
      )
      .orderBy(workspaceInvitations.creeLe);
    return rows;
  } catch {
    return [];
  }
}

/**
 * Vérifie qu'un user est membre actif du workspace. Utilisé comme
 * garde-fou dans les server actions sensibles. Fallback false en cas
 * d'erreur (tables absentes).
 */
export async function estMembreWorkspace(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return !!row;
  } catch {
    return false;
  }
}

/**
 * Vérifie qu'un user a accès à un site : soit via ownership legacy
 * (owner_user_id), soit via workspace membership. Pattern unifié qui
 * couvre à la fois les sites migrés et les sites pré-workspace.
 */
export async function aAccesSite(
  userId: string,
  siteId: string,
): Promise<boolean> {
  try {
    const [row] = await db
      .select({
        ownerUserId: sites.ownerUserId,
        workspaceId: sites.workspaceId,
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1);
    if (!row) return false;
    if (row.ownerUserId === userId) return true;
    if (row.workspaceId) {
      return await estMembreWorkspace(userId, row.workspaceId);
    }
    return false;
  } catch {
    return false;
  }
}
