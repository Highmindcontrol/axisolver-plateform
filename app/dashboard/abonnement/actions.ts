"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { creerSessionPortail } from "@/lib/stripe/portail";

export type EtatPortail = {
  erreur: string | null;
};

export async function ouvrirPortailStripeAction(
  _prev: EtatPortail,
): Promise<EtatPortail> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  const resultat = await creerSessionPortail({ userId: user.id });
  if ("erreur" in resultat) return { erreur: resultat.erreur };

  redirect(resultat.url);
}
