"use server";

import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { and, eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { envoyerRapportQuotidien } from "@/lib/axi-solver/rapport/envoyer";

export type EtatEnvoiManuel = {
  erreur: string | null;
  ok?: boolean;
  destinataire?: string;
};

export async function renvoyerRapportMaintenantAction(
  _prev: EtatEnvoiManuel,
  formData: FormData,
): Promise<EtatEnvoiManuel> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { erreur: "slug manquant" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable." };

  const resultat = await envoyerRapportQuotidien({ siteId: site.id });
  if (resultat.ok) {
    return { erreur: null, ok: true, destinataire: resultat.destinataire };
  }
  return { erreur: resultat.raison };
}
