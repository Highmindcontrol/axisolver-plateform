"use server";

import { revalidatePath } from "next/cache";

import {
  enregistrerCout,
  supprimerCout,
  type CategorieCoutFournisseur,
} from "@/lib/services/couts-fournisseurs";
import { estSuperAdmin } from "@/lib/services/super-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EtatSaisie = { erreur: string | null; succes?: string };

const CATEGORIES_VALIDES: CategorieCoutFournisseur[] = [
  "ia_llm",
  "voix",
  "infra",
  "paiements",
  "email",
  "seo",
  "outillage",
  "autre",
];

/**
 * Enregistre ou met à jour un coût mensuel (upsert sur bucket_mois +
 * fournisseur + catégorie). Seul un super_admin peut écrire ; un
 * admin_plateforme consulte uniquement.
 */
export async function enregistrerCoutAction(
  _etat: EtatSaisie,
  formData: FormData,
): Promise<EtatSaisie> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié." };

  if (!(await estSuperAdmin(user.id))) {
    return { erreur: "Seul un super_admin peut saisir des coûts." };
  }

  const bucketMois = formData.get("bucketMois");
  const fournisseur = formData.get("fournisseur");
  const categorie = formData.get("categorie");
  const montantRaw = formData.get("montant");
  const notes = formData.get("notes");

  if (typeof bucketMois !== "string" || !/^\d{4}-\d{2}$/.test(bucketMois)) {
    return { erreur: "Mois invalide." };
  }
  if (typeof fournisseur !== "string" || !fournisseur.trim()) {
    return { erreur: "Fournisseur manquant." };
  }
  if (
    typeof categorie !== "string" ||
    !CATEGORIES_VALIDES.includes(categorie as CategorieCoutFournisseur)
  ) {
    return { erreur: "Catégorie invalide." };
  }
  const montant = typeof montantRaw === "string" ? parseFloat(montantRaw.replace(",", ".")) : NaN;
  if (!Number.isFinite(montant) || montant < 0) {
    return { erreur: "Montant invalide (nombre positif attendu)." };
  }

  try {
    await enregistrerCout({
      bucketMois,
      fournisseur: fournisseur.trim(),
      categorie: categorie as CategorieCoutFournisseur,
      montantEurHt: Math.round(montant * 100) / 100,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      saisiParUserId: user.id,
    });
  } catch (e) {
    console.error("[super-admin] enregistrerCout:", e);
    return { erreur: "Erreur lors de l'enregistrement." };
  }

  revalidatePath("/dashboard/super-admin/couts");
  return { erreur: null, succes: "Coût enregistré." };
}

export async function supprimerCoutAction(
  _etat: EtatSaisie,
  formData: FormData,
): Promise<EtatSaisie> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non authentifié." };

  if (!(await estSuperAdmin(user.id))) {
    return { erreur: "Seul un super_admin peut supprimer un coût." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { erreur: "Identifiant manquant." };

  try {
    await supprimerCout(id);
  } catch (e) {
    console.error("[super-admin] supprimerCout:", e);
    return { erreur: "Erreur lors de la suppression." };
  }

  revalidatePath("/dashboard/super-admin/couts");
  return { erreur: null, succes: "Coût supprimé." };
}
