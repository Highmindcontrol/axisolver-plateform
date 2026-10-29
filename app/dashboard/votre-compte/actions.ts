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

export type EtatSociete = {
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
  const telephone = String(formData.get("telephone") ?? "")
    .trim()
    .slice(0, 32);

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
      telephone: telephone || null,
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
 * Enregistre les informations société dans user_metadata.societe.
 * Ces champs servent à la facturation Stripe (customer.address +
 * tax_ids) et aux factures. Tout est optionnel pour V1 — l'admin
 * peut compléter progressivement.
 */
export async function modifierSocieteAction(
  _prev: EtatSociete,
  formData: FormData,
): Promise<EtatSociete> {
  const raisonSociale = cleanField(formData.get("raisonSociale"), 120);
  const numeroTva = cleanField(formData.get("numeroTva"), 32);
  const siret = cleanField(formData.get("siret"), 32);
  const adresseLigne1 = cleanField(formData.get("adresseLigne1"), 120);
  const adresseLigne2 = cleanField(formData.get("adresseLigne2"), 120);
  const codePostal = cleanField(formData.get("codePostal"), 16);
  const ville = cleanField(formData.get("ville"), 80);
  const pays = cleanField(formData.get("pays"), 60);
  const emailFacturation = cleanField(formData.get("emailFacturation"), 160);

  if (emailFacturation && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFacturation)) {
    return {
      erreur: "L'adresse email de facturation est invalide.",
      succes: false,
    };
  }

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
      societe: {
        raisonSociale: raisonSociale || null,
        numeroTva: numeroTva || null,
        siret: siret || null,
        adresseLigne1: adresseLigne1 || null,
        adresseLigne2: adresseLigne2 || null,
        codePostal: codePostal || null,
        ville: ville || null,
        pays: pays || null,
        emailFacturation: emailFacturation || null,
      },
    },
  });

  if (error) {
    return {
      erreur: `Impossible d'enregistrer : ${error.message}`,
      succes: false,
    };
  }

  revalidatePath("/dashboard/votre-compte");
  return { erreur: null, succes: true };
}

function cleanField(valeur: FormDataEntryValue | null, maxLen: number): string {
  return String(valeur ?? "")
    .trim()
    .slice(0, maxLen);
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
