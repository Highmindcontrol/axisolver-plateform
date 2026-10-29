"use server";

import { revalidatePath } from "next/cache";

import {
  creerToken,
  revoquerToken,
  supprimerToken,
} from "@/lib/services/forteresse";
import { estSuperAdmin } from "@/lib/services/super-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EtatToken = {
  erreur: string | null;
  tokenClair?: string;
  succes?: string;
};

/**
 * Crée un nouveau token Forteresse. Le token CLAIR est renvoyé une
 * seule fois dans l'état — l'UI doit l'afficher à l'utilisateur avec
 * un avertissement « notez-le, il ne sera plus jamais visible ».
 */
export async function creerTokenAction(
  _etat: EtatToken,
  formData: FormData,
): Promise<EtatToken> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié." };

  if (!(await estSuperAdmin(user.id))) {
    return { erreur: "Seul un super_admin peut créer un token." };
  }

  const nom = formData.get("nom");
  if (typeof nom !== "string" || !nom.trim()) {
    return { erreur: "Nom du token manquant." };
  }

  try {
    const { token } = await creerToken(nom.trim(), user.id);
    revalidatePath("/dashboard/super-admin/forteresse");
    return {
      erreur: null,
      tokenClair: token,
      succes: "Token créé. Note-le immédiatement.",
    };
  } catch (e) {
    console.error("[forteresse] creerToken:", e);
    return { erreur: "Erreur lors de la création du token." };
  }
}

export async function revoquerTokenAction(
  _etat: EtatToken,
  formData: FormData,
): Promise<EtatToken> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié." };

  if (!(await estSuperAdmin(user.id))) {
    return { erreur: "Seul un super_admin peut révoquer un token." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { erreur: "Identifiant manquant." };

  try {
    await revoquerToken(id);
  } catch (e) {
    console.error("[forteresse] revoquerToken:", e);
    return { erreur: "Erreur lors de la révocation." };
  }

  revalidatePath("/dashboard/super-admin/forteresse");
  return { erreur: null, succes: "Token révoqué." };
}

export async function supprimerTokenAction(
  _etat: EtatToken,
  formData: FormData,
): Promise<EtatToken> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié." };

  if (!(await estSuperAdmin(user.id))) {
    return { erreur: "Seul un super_admin peut supprimer un token." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { erreur: "Identifiant manquant." };

  try {
    await supprimerToken(id);
  } catch (e) {
    console.error("[forteresse] supprimerToken:", e);
    return { erreur: "Erreur lors de la suppression." };
  }

  revalidatePath("/dashboard/super-admin/forteresse");
  return { erreur: null, succes: "Token supprimé définitivement." };
}
