"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "@/lib/db";
import {
  workspaceInvitations,
  workspaceMembers,
  workspaces,
} from "@/lib/db/schema";
import { envoyerEmailInvitation } from "@/lib/services/envoyer-invitation";
import { getWorkspaceActif } from "@/lib/services/workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { afficherNomComplet } from "@/lib/auth/afficher-prenom";

export type EtatInvitation = {
  erreur: string | null;
  succes: boolean;
};

export type EtatRevocation = {
  erreur: string | null;
  succes: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUREE_INVITATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

/**
 * Invite un nouvel administrateur dans le workspace actif.
 * Crée une workspace_invitation + envoie l'email Brevo.
 */
export async function inviterAdminAction(
  _prev: EtatInvitation,
  formData: FormData,
): Promise<EtatInvitation> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 160);
  const prenom = String(formData.get("prenom") ?? "")
    .trim()
    .slice(0, 60);
  const nom = String(formData.get("nom") ?? "")
    .trim()
    .slice(0, 60);

  if (!email || !EMAIL_REGEX.test(email)) {
    return { erreur: "Adresse email invalide.", succes: false };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié.", succes: false };

  const workspace = await getWorkspaceActif(user.id);
  if (!workspace) {
    return {
      erreur:
        "Workspace indisponible. La migration multi-admin n'est pas encore appliquée en production.",
      succes: false,
    };
  }

  if (email === (user.email ?? "").toLowerCase()) {
    return {
      erreur:
        "Vous êtes déjà administrateur de ce compte, pas besoin de vous inviter vous-même.",
      succes: false,
    };
  }

  // Note : vérif « email déjà membre » reportée à l'acceptation du
  // token (nécessite l'admin API Supabase avec service_role, pas
  // disponible depuis une server action user).

  const token = crypto.randomBytes(24).toString("base64url");
  const expireLe = new Date(Date.now() + DUREE_INVITATION_MS);

  try {
    await db.insert(workspaceInvitations).values({
      workspaceId: workspace.id,
      email,
      prenom: prenom || null,
      nom: nom || null,
      token,
      creeParUserId: user.id,
      expireLe,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("relation") &&
      msg.includes("workspace_invitations") &&
      msg.includes("does not exist")
    ) {
      return {
        erreur:
          "Multi-administration pas encore activée en production (migration à appliquer).",
        succes: false,
      };
    }
    return { erreur: `Impossible d'enregistrer : ${msg}`, succes: false };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "axisolver.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const resultat = await envoyerEmailInvitation({
    destinataireEmail: email,
    destinatairePrenom: prenom || null,
    destinataireNom: nom || null,
    inviteParNom: afficherNomComplet(user) ?? user.email ?? "Un administrateur",
    nomWorkspace: workspace.nom,
    tokenInvitation: token,
    baseUrl,
  });

  if (!resultat.ok) {
    // L'invitation est en DB mais l'email n'est pas parti : on la
    // révoque pour éviter un token orphelin que personne n'ouvrira.
    try {
      await db
        .update(workspaceInvitations)
        .set({ statut: "revoquee" })
        .where(eq(workspaceInvitations.token, token));
    } catch {
      // Non critique si le update échoue.
    }
    return {
      erreur: `Email d'invitation non envoyé : ${resultat.raison}`,
      succes: false,
    };
  }

  revalidatePath("/dashboard/votre-compte");
  return { erreur: null, succes: true };
}

/**
 * Révoque une invitation en attente (passage à statut 'revoquee').
 * Le token devient inutilisable.
 */
export async function revoquerInvitationAction(
  _prev: EtatRevocation,
  formData: FormData,
): Promise<EtatRevocation> {
  const invitationId = String(formData.get("invitationId") ?? "").trim();
  if (!invitationId) {
    return { erreur: "Invitation invalide.", succes: false };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié.", succes: false };

  const workspace = await getWorkspaceActif(user.id);
  if (!workspace) {
    return { erreur: "Workspace introuvable.", succes: false };
  }

  try {
    await db
      .update(workspaceInvitations)
      .set({ statut: "revoquee" })
      .where(
        and(
          eq(workspaceInvitations.id, invitationId),
          eq(workspaceInvitations.workspaceId, workspace.id),
        ),
      );
  } catch (e) {
    return {
      erreur: `Impossible de révoquer : ${e instanceof Error ? e.message : String(e)}`,
      succes: false,
    };
  }

  revalidatePath("/dashboard/votre-compte");
  return { erreur: null, succes: true };
}

/**
 * Retire un co-administrateur du workspace. L'admin principal
 * (créateur du workspace) ne peut pas être retiré. Un admin peut
 * se retirer lui-même.
 */
export async function revoquerMembreAction(
  _prev: EtatRevocation,
  formData: FormData,
): Promise<EtatRevocation> {
  const userIdCible = String(formData.get("userIdCible") ?? "").trim();
  if (!userIdCible) {
    return { erreur: "Membre invalide.", succes: false };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié.", succes: false };

  const workspace = await getWorkspaceActif(user.id);
  if (!workspace) {
    return { erreur: "Workspace introuvable.", succes: false };
  }

  if (userIdCible === workspace.creeParUserId) {
    return {
      erreur:
        "L'administrateur principal (créateur du compte) ne peut pas être retiré.",
      succes: false,
    };
  }

  try {
    await db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspace.id),
          eq(workspaceMembers.userId, userIdCible),
        ),
      );
  } catch (e) {
    return {
      erreur: `Impossible de retirer le membre : ${e instanceof Error ? e.message : String(e)}`,
      succes: false,
    };
  }

  revalidatePath("/dashboard/votre-compte");
  return { erreur: null, succes: true };
}
