"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server actions auth AxiSolver.
 *
 * Validation côté serveur (anti-contournement JS), erreurs
 * renvoyées en français directement (pas d'i18n V1 — le dashboard
 * client reste français en priorité). Le trigger
 * on_auth_user_created copie automatiquement les nouveaux
 * utilisateurs dans public.users, donc pas de bootstrap manuel.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const APRES_CONNEXION = "/dashboard";

/* ─── Connexion email/password ───────────────────────────────── */

export type EtatConnexion = { erreur: string | null };

export async function connexionAction(
  _prev: EtatConnexion,
  formData: FormData,
): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!email || !EMAIL_REGEX.test(email)) {
    return { erreur: "Adresse email invalide." };
  }
  if (!motDePasse) {
    return { erreur: "Mot de passe requis." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });
  if (error) {
    console.error("[connexion]", error.name, error.message);
    // Jamais révéler si l'email existe — surface d'erreur unifiée.
    return { erreur: "Email ou mot de passe incorrect." };
  }
  redirect(APRES_CONNEXION);
}

/* ─── Inscription email/password ──────────────────────────────── */

export type EtatInscription = { erreur: string | null };

export async function inscriptionAction(
  _prev: EtatInscription,
  formData: FormData,
): Promise<EtatInscription> {
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!nom || nom.length < 2) {
    return { erreur: "Votre nom est requis." };
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return { erreur: "Adresse email invalide." };
  }
  if (!motDePasse || motDePasse.length < 8) {
    return { erreur: "Mot de passe trop court (8 caractères minimum)." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: {
      data: { full_name: nom },
    },
  });
  if (error) {
    console.error("[inscription]", error.name, error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("exists")) {
      return { erreur: "Un compte existe déjà avec cette adresse." };
    }
    if (msg.includes("password")) {
      return { erreur: "Mot de passe refusé par Supabase (trop court ou trop faible)." };
    }
    return { erreur: "Impossible de créer le compte pour l'instant." };
  }
  if (!data.user) {
    return { erreur: "Impossible de créer le compte pour l'instant." };
  }
  redirect(APRES_CONNEXION);
}

/* ─── Mot de passe oublié ─────────────────────────────────────── */

export type EtatMotDePasseOublie = { erreur: string | null; ok?: boolean };

export async function motDePasseOublieAction(
  _prev: EtatMotDePasseOublie,
  formData: FormData,
): Promise<EtatMotDePasseOublie> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !EMAIL_REGEX.test(email)) {
    return { erreur: "Adresse email invalide." };
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/api/auth/confirm?next=/reinitialiser-mot-de-passe`,
  });
  if (error) {
    console.error("[mot-de-passe-oublie]", error.message);
    // Jamais révéler l'existence — toujours retourner ok.
  }
  return { erreur: null, ok: true };
}

/* ─── Réinitialisation mot de passe ──────────────────────────── */

export type EtatReinitialisation = { erreur: string | null; ok?: boolean };

export async function reinitialiserMotDePasseAction(
  _prev: EtatReinitialisation,
  formData: FormData,
): Promise<EtatReinitialisation> {
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!motDePasse || motDePasse.length < 8) {
    return { erreur: "Mot de passe trop court (8 caractères minimum)." };
  }
  if (motDePasse !== confirmation) {
    return { erreur: "Les deux mots de passe ne correspondent pas." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) {
    console.error("[reinitialiser]", error.message);
    return { erreur: "Impossible de mettre à jour le mot de passe." };
  }
  redirect(APRES_CONNEXION);
}

/* ─── Déconnexion ─────────────────────────────────────────────── */

export async function deconnexionAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
