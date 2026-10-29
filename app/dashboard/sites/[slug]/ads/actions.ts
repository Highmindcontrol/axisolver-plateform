"use server";

import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, adsAudits } from "@/lib/db/schema";
import { auditerSite } from "@/lib/engines/ads/auditer-site";

export type EtatAuditAds = {
  erreur: string | null;
  ok?: boolean;
  auditId?: string;
};

export async function lancerAuditAdsAction(
  _prev: EtatAuditAds,
  formData: FormData,
): Promise<EtatAuditAds> {
  const slug = String(formData.get("slug") ?? "").trim();
  const motsClesRaw = String(formData.get("motsCles") ?? "").trim();
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

  const motsCles = motsClesRaw
    .split(/[\n,]/)
    .map((m) => m.trim())
    .filter((m) => m.length > 0)
    .slice(0, 5);

  const url = `https://${site.domainePrincipal}`;

  const [row] = await db
    .insert(adsAudits)
    .values({
      siteId: site.id,
      urlAuditee: url,
      declencheur: "manuel",
      statut: "en_cours",
      motsClesTestes: motsCles,
    })
    .returning({ id: adsAudits.id });

  try {
    const resultat = await auditerSite({ url, motsCles });

    await db
      .update(adsAudits)
      .set({
        statut: "termine",
        scoreGlobal: resultat.scoreGlobal,
        scoreTrackers: resultat.scores.trackers,
        scoreConsentement: resultat.scores.consentement,
        scoreVisibilite: resultat.scores.visibilite,
        scoreRemarketing: resultat.scores.remarketing,
        trackersDetectes: resultat.trackersDetectes,
        annoncesConcurrentes: resultat.annoncesConcurrentes,
        findings: resultat.findings,
        recommandations: resultat.recommandations,
        dureeMs: resultat.dureeMs,
        termineLe: new Date(),
      })
      .where(eq(adsAudits.id, row.id));

    revalidatePath(`/dashboard/sites/${slug}/ads`);
    return { erreur: null, ok: true, auditId: row.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db
      .update(adsAudits)
      .set({ statut: "echec", erreur: msg, termineLe: new Date() })
      .where(eq(adsAudits.id, row.id));
    return { erreur: msg };
  }
}
