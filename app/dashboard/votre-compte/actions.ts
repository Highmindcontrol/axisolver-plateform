"use server";

import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EtatResetMdp = {
  erreur: string | null;
  succes: boolean;
};

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
