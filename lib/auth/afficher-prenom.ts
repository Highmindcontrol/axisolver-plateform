import type { User } from "@supabase/supabase-js";

/**
 * Résolution du prénom à afficher dans l'interface.
 *
 * Priorité : `user_metadata.prenom` saisi dans Votre compte →
 * `user_metadata.full_name` (OAuth Google/LinkedIn) → fallback propre
 * sur la partie locale de l'email avec première lettre en majuscule.
 */
export function afficherPrenom(user: User | null | undefined): string | null {
  if (!user) return null;

  const meta = user.user_metadata as Record<string, unknown> | undefined;

  const prenomMeta = typeof meta?.prenom === "string" ? meta.prenom.trim() : "";
  if (prenomMeta) return capitaliser(prenomMeta);

  const fullName =
    typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
  if (fullName) {
    const premier = fullName.split(/\s+/)[0] ?? "";
    if (premier) return capitaliser(premier);
  }

  const email = user.email ?? "";
  const local = email.split("@")[0] ?? "";
  if (local) return capitaliser(local);

  return null;
}

/** Nom + prénom complet pour affichages longs (destinataire email). */
export function afficherNomComplet(user: User | null | undefined): string | null {
  if (!user) return null;

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const prenom = typeof meta?.prenom === "string" ? meta.prenom.trim() : "";
  const nom = typeof meta?.nom === "string" ? meta.nom.trim() : "";

  if (prenom && nom) return `${capitaliser(prenom)} ${capitaliser(nom)}`;
  if (prenom) return capitaliser(prenom);
  if (nom) return capitaliser(nom);

  const fullName =
    typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
  if (fullName) return fullName;

  return afficherPrenom(user);
}

function capitaliser(s: string): string {
  const propre = s.trim();
  if (!propre) return "";
  return propre.charAt(0).toUpperCase() + propre.slice(1);
}
