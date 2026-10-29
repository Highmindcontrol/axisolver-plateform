"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EtatResetMdp = {
  erreur: string | null;
  succes: boolean;
};

export type EtatProfil = {
  erreur: string | null;
  succes: boolean;
};

/**
 * Enregistre le prénom et le nom de l'utilisateur dans ses
 * user_metadata Supabase. Permet d'utiliser le prénom dans les
 * salutations du dashboard plutôt que la portion locale de l'email.
 */
export async function modifierProfilAction(
  _prev: EtatProfil,
  formData: FormData,
): Promise<EtatProfil> {
  const prenom = String(formData.get("prenom") ?? "")
    .trim()
    .slice(0, 60);
  const nom = String(formData.get("nom") ?? "")
    .trim()
    .slice(0, 60);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié.", succes: false };

  const metadonneesExistantes =
    (user.user_metadata as Record<string, unknown> | undefined) ?? {};

  const { error } = await supabase.auth.updateUser({
    data: {
      ...metadonneesExistantes,
      prenom: prenom || null,
      nom: nom || null,
    },
  });

  if (error) {
    return {
      erreur: `Impossible d'enregistrer : ${error.message}`,
      succes: false,
    };
  }

  revalidatePath("/dashboard", "layout");
  return { erreur: null, succes: true };
}

/**
 * Envoie un email de réinitialisation de mot de passe à l'adresse
 * du user authentifié. L'email contient un lien magique vers
 * /reinitialiser-mot-de-passe qui ouvre le formulaire de saisie.
 */
export async function envoyerEmailResetMotDePasseAction(
  _prev: EtatResetMdp,
): Promise<EtatResetMdp> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { erreur: "Non authentifié.", succes: false };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "axisolver.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const redirectTo = `${proto}://${host}/reinitialiser-mot-de-passe`;

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo,
  });

  if (error) {
    return { erreur: `Impossible d'envoyer l'email : ${error.message}`, succes: false };
  }
  return { erreur: null, succes: true };
}
