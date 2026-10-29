import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profilsPlateforme } from "@/lib/db/schema";

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
