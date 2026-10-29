"use server";

import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  workspaceInvitations,
  workspaceMembers,
  workspaces,
} from "@/lib/db/schema";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export type EtatAcceptation = {
  erreur: string | null;
};

/**
 * Valide le token d'invitation, inscrit (ou connecte) l'utilisateur,
 * puis l'ajoute comme membre du workspace cible et marque
 * l'invitation acceptée. Flow unifié : si l'email existe déjà → login
 * nécessaire. Sinon → création compte avec mot de passe fourni.
 */
export async function accepterInvitationAction(
  _prev: EtatAcceptation,
  formData: FormData,
): Promise<EtatAcceptation> {
  const token = String(formData.get("token") ?? "").trim();
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const prenom = String(formData.get("prenom") ?? "")
    .trim()
    .slice(0, 60);
  const nom = String(formData.get("nom") ?? "")
    .trim()
    .slice(0, 60);

  if (!token) return { erreur: "Lien d'invitation invalide." };
  if (!motDePasse || motDePasse.length < 8) {
    return { erreur: "Mot de passe trop court (8 caractères minimum)." };
  }

  // Valide le token
  let invitation;
  try {
    const [row] = await db
      .select({
        id: workspaceInvitations.id,
        workspaceId: workspaceInvitations.workspaceId,
        email: workspaceInvitations.email,
        statut: workspaceInvitations.statut,
      })
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.token, token),
          eq(workspaceInvitations.statut, "en_attente"),
          gt(workspaceInvitations.expireLe, new Date()),
        ),
      )
      .limit(1);
    invitation = row;
  } catch {
    return {
      erreur:
        "Multi-administration pas encore activée en production (migration SQL à appliquer).",
    };
  }

  if (!invitation) {
    return {
      erreur:
        "Invitation invalide ou expirée. Demandez à l'administrateur de vous renvoyer une invitation.",
    };
  }

  // Création de compte via l'Admin API Supabase : email_confirm à true
  // directement (le lien d'invitation valide déjà l'email), ce qui évite
  // l'envoi d'un email de confirmation parasite. Si l'email existe
  // déjà en base, on bascule sur un signInWithPassword classique.
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();
  const fullName =
    [prenom, nom].filter(Boolean).join(" ") || invitation.email;

  let userId: string | null = null;

  const { data: createData, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: motDePasse,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        prenom: prenom || null,
        nom: nom || null,
      },
    });

  if (createError) {
    const msg = createError.message.toLowerCase();
    const dejaExistant =
      msg.includes("already") ||
      msg.includes("exists") ||
      msg.includes("registered");

    if (!dejaExistant) {
      return { erreur: `Création de compte refusée : ${createError.message}` };
    }
    // Email déjà enregistré → connexion avec le mot de passe fourni.
  } else {
    userId = createData?.user?.id ?? null;
  }

  // Dans tous les cas on ouvre une session côté client en se connectant
  // avec le mot de passe (soit celui qu'on vient d'enregistrer, soit
  // celui déjà existant).
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: invitation.email,
      password: motDePasse,
    });

  if (signInError) {
    return {
      erreur:
        "Un compte existe déjà avec cette adresse. Si vous êtes son propriétaire, le mot de passe saisi est incorrect — réinitialisez-le via « Mot de passe oublié ».",
    };
  }
  userId = signInData.user?.id ?? userId;

  if (!userId) {
    return {
      erreur:
        "Session non établie après création du compte. Essayez de vous reconnecter.",
    };
  }

  // Ajoute le membre dans le workspace (idempotent sur la contrainte
  // unique (workspace_id, user_id))
  try {
    await db
      .insert(workspaceMembers)
      .values({
        workspaceId: invitation.workspaceId,
        userId,
        role: "admin",
      })
      .onConflictDoNothing();
  } catch (e) {
    return {
      erreur: `Ajout au workspace impossible : ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // Marque l'invitation acceptée
  try {
    await db
      .update(workspaceInvitations)
      .set({
        statut: "acceptee",
        accepteParUserId: userId,
        accepteLe: new Date(),
      })
      .where(eq(workspaceInvitations.id, invitation.id));
  } catch {
    // Non critique : le user est déjà membre, le token restera en
    // 'en_attente' mais sera purge par expiration.
  }

  redirect("/dashboard");
}

/**
 * Lecture publique du token : renvoie les infos minimales pour afficher
 * la page d'acceptation (email cible, nom workspace, date d'expiration).
 */
export async function lireInvitation(token: string) {
  try {
    const rows = await db
      .select({
        id: workspaceInvitations.id,
        email: workspaceInvitations.email,
        prenom: workspaceInvitations.prenom,
        nom: workspaceInvitations.nom,
        statut: workspaceInvitations.statut,
        expireLe: workspaceInvitations.expireLe,
        workspaceNom: workspaces.nom,
      })
      .from(workspaceInvitations)
      .innerJoin(
        workspaces,
        eq(workspaces.id, workspaceInvitations.workspaceId),
      )
      .where(eq(workspaceInvitations.token, token))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
