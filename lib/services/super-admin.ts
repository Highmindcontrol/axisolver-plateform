import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  profilsPlateforme,
  sites,
  stripeSubscriptions,
  users,
  workspaceMembers,
} from "@/lib/db/schema";

export type RolePlateforme =
  | "super_admin"
  | "admin_plateforme"
  | "contributeur";

export type ProfilPlateforme = {
  userId: string;
  role: RolePlateforme;
  notes: string | null;
  creeLe: Date;
};

/**
 * Services rôles plateforme (back-office AxiSolver).
 *
 * Doctrine : rôle plateforme = orthogonal au rôle workspace. Un super-admin
 * de la plateforme reste admin « normal » de son propre workspace.
 *
 * Résistant à l'absence de la table (try/catch) : tant que la migration
 * 0024 n'est pas appliquée en prod, estSuperAdmin renvoie false (défaut
 * sécurisé). Dès que la table existe, François (flemoing@gmail.com) est
 * super_admin via l'INSERT initial de la migration.
 */

export async function lireProfilPlateforme(
  userId: string,
): Promise<ProfilPlateforme | null> {
  try {
    const [row] = await db
      .select({
        userId: profilsPlateforme.userId,
        role: profilsPlateforme.role,
        notes: profilsPlateforme.notes,
        creeLe: profilsPlateforme.creeLe,
      })
      .from(profilsPlateforme)
      .where(eq(profilsPlateforme.userId, userId))
      .limit(1);
    if (!row) return null;
    return {
      userId: row.userId,
      role: row.role as RolePlateforme,
      notes: row.notes,
      creeLe: row.creeLe,
    };
  } catch {
    return null;
  }
}

export async function estSuperAdmin(userId: string): Promise<boolean> {
  const profil = await lireProfilPlateforme(userId);
  return profil?.role === "super_admin";
}

export async function aAccesSuperAdmin(userId: string): Promise<boolean> {
  const profil = await lireProfilPlateforme(userId);
  if (!profil) return false;
  return (
    profil.role === "super_admin" || profil.role === "admin_plateforme"
  );
}

export type UtilisateurPlateforme = {
  userId: string;
  email: string | null;
  nomAffiche: string | null;
  creeLe: Date;
  rolePlateforme: RolePlateforme | null;
  planAbonnement: string | null;
  statutAbonnement: string | null;
  nbSites: number;
};

export async function listerUtilisateurs(options: {
  recherche?: string;
  limit?: number;
  offset?: number;
}): Promise<{ liste: UtilisateurPlateforme[]; total: number }> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const terme = options.recherche?.trim();

  try {
    const condRecherche = terme
      ? or(
          ilike(users.email, `%${terme}%`),
          ilike(users.nomAffiche, `%${terme}%`),
        )
      : undefined;

    const [totalRow] = await db
      .select({ n: count() })
      .from(users)
      .where(condRecherche);
    const total = Number(totalRow?.n ?? 0);

    const rows = await db
      .select({
        userId: users.id,
        email: users.email,
        nomAffiche: users.nomAffiche,
        creeLe: users.creeLe,
        rolePlateforme: profilsPlateforme.role,
        planAbonnement: stripeSubscriptions.plan,
        statutAbonnement: stripeSubscriptions.statut,
        nbSites: sql<number>`(
          SELECT COUNT(DISTINCT s."id")
          FROM ${sites} s
          LEFT JOIN ${workspaceMembers} wm ON wm."workspace_id" = s."workspace_id"
          WHERE s."owner_user_id" = ${users.id}
             OR wm."user_id" = ${users.id}
        )`,
      })
      .from(users)
      .leftJoin(
        profilsPlateforme,
        eq(profilsPlateforme.userId, users.id),
      )
      .leftJoin(
        stripeSubscriptions,
        and(
          eq(stripeSubscriptions.userId, users.id),
          eq(stripeSubscriptions.statut, "active"),
        ),
      )
      .where(condRecherche)
      .orderBy(desc(users.creeLe))
      .limit(limit)
      .offset(offset);

    return {
      total,
      liste: rows.map((r) => ({
        userId: r.userId,
        email: r.email,
        nomAffiche: r.nomAffiche,
        creeLe: r.creeLe,
        rolePlateforme: (r.rolePlateforme ?? null) as RolePlateforme | null,
        planAbonnement: r.planAbonnement ?? null,
        statutAbonnement: r.statutAbonnement ?? null,
        nbSites: Number(r.nbSites ?? 0),
      })),
    };
  } catch {
    return { total: 0, liste: [] };
  }
}

export async function compterSuperAdmins(): Promise<number> {
  try {
    const [row] = await db
      .select({ n: count() })
      .from(profilsPlateforme)
      .where(eq(profilsPlateforme.role, "super_admin"));
    return Number(row?.n ?? 0);
  } catch {
    return 0;
  }
}

export async function assignerRolePlateforme(
  userId: string,
  role: RolePlateforme,
  creeParUserId: string,
  notes?: string,
): Promise<void> {
  await db
    .insert(profilsPlateforme)
    .values({
      userId,
      role,
      creeParUserId,
      notes: notes ?? null,
    })
    .onConflictDoUpdate({
      target: profilsPlateforme.userId,
      set: {
        role,
        notes: notes ?? null,
        majLe: new Date(),
      },
    });
}

export async function retirerRolePlateforme(userId: string): Promise<void> {
  await db.delete(profilsPlateforme).where(eq(profilsPlateforme.userId, userId));
}
