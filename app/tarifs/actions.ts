"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { creerSessionCheckout } from "@/lib/stripe/checkout";
import type { SlugPlan } from "@/lib/stripe/formules";

export type EtatSouscription = {
  erreur: string | null;
};

export async function souscrirePlanAction(
  _prev: EtatSouscription,
  formData: FormData,
): Promise<EtatSouscription> {
  const slug = String(formData.get("plan") ?? "").trim() as SlugPlan;
  if (!["text", "classique", "premium"].includes(slug)) {
    return { erreur: "Plan invalide." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Non connecté : on envoie vers inscription, le checkout reprendra après.
    redirect(`/inscription?retour=/tarifs?plan=${slug}`);
  }

  const resultat = await creerSessionCheckout({
    slug,
    user: { id: user.id, email: user.email ?? null },
  });

  if ("erreur" in resultat) {
    return { erreur: resultat.erreur };
  }

  redirect(resultat.url);
}
