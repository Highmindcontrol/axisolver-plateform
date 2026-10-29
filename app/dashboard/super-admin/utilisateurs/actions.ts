"use server";

import { revalidatePath } from "next/cache";

import {
  assignerRolePlateforme,
  compterSuperAdmins,
  estSuperAdmin,
  lireProfilPlateforme,
  retirerRolePlateforme,
  type RolePlateforme,
} from "@/lib/services/super-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EtatMutation = { erreur: string | null; succes?: string };

/**
 * Promeut (ou met à jour) le rôle plateforme d'un utilisateur.
 * Seuls les super_admin peuvent le faire. Impossible de rétrograder
 * le dernier super_admin encore présent.
 */
export async function assignerRoleAction(
  _etat: EtatMutation,
  formData: FormData,
): Promise<EtatMutation> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié" };

  if (!(await estSuperAdmin(user.id))) {
    return { erreur: "Seul un super_admin peut assigner un rôle." };
  }

  const targetUserId = formData.get("userId");
  const roleRaw = formData.get("role");
  if (typeof targetUserId !== "string" || !targetUserId) {
    return { erreur: "Utilisateur cible manquant." };
  }
  if (
    roleRaw !== "super_admin" &&
    roleRaw !== "admin_plateforme" &&
    roleRaw !== "contributeur"
  ) {
    return { erreur: "Rôle invalide." };
  }
  const role = roleRaw as RolePlateforme;

  const profilActuel = await lireProfilPlateforme(targetUserId);
  if (
    profilActuel?.role === "super_admin" &&
    role !== "super_admin" &&
    (await compterSuperAdmins()) <= 1
  ) {
    return {
      erreur: "Impossible de rétrograder le dernier super_admin.",
    };
  }

  try {
    await assignerRolePlateforme(targetUserId, role, user.id);
  } catch (e) {
    console.error("[super-admin] assignerRole:", e);
    return { erreur: "Erreur lors de l'assignation du rôle." };
  }

  revalidatePath("/dashboard/super-admin/utilisateurs");
  return { erreur: null, succes: "Rôle mis à jour." };
}

/**
 * Retire le rôle plateforme d'un utilisateur (il redevient user
 * standard). Impossible pour le dernier super_admin.
 */
export async function retirerRoleAction(
  _etat: EtatMutation,
  formData: FormData,
): Promise<EtatMutation> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié" };

  if (!(await estSuperAdmin(user.id))) {
    return { erreur: "Seul un super_admin peut retirer un rôle." };
  }

  const targetUserId = formData.get("userId");
  if (typeof targetUserId !== "string" || !targetUserId) {
    return { erreur: "Utilisateur cible manquant." };
  }

  const profilActuel = await lireProfilPlateforme(targetUserId);
  if (!profilActuel) return { erreur: "Cet utilisateur n'a aucun rôle." };

  if (
    profilActuel.role === "super_admin" &&
    (await compterSuperAdmins()) <= 1
  ) {
    return {
      erreur: "Impossible de retirer le dernier super_admin.",
    };
  }

  try {
    await retirerRolePlateforme(targetUserId);
  } catch (e) {
    console.error("[super-admin] retirerRole:", e);
    return { erreur: "Erreur lors du retrait du rôle." };
  }

  revalidatePath("/dashboard/super-admin/utilisateurs");
  return { erreur: null, succes: "Rôle retiré." };
}
