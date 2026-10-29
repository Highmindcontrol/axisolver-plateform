"use server";

import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, seoAudits } from "@/lib/db/schema";
import { auditerSite } from "@/lib/engines/seo/auditer-site";
import { enArrierePlan } from "@/lib/background";

export type EtatAuditSeo = {
  erreur: string | null;
  ok?: boolean;
  auditId?: string;
};

export async function lancerAuditSeoAction(
  _prev: EtatAuditSeo,
  formData: FormData,
): Promise<EtatAuditSeo> {
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

  // Enregistre l'audit en « en_cours » pour qu'il apparaisse dans l'UI
  const [row] = await db
    .insert(seoAudits)
    .values({
      siteId: site.id,
      urlAuditee: url,
      declencheur: "manuel",
      statut: "en_cours",
      motsClesTestes: motsCles,
    })
    .returning({ id: seoAudits.id });

  // Audit lancé en arrière-plan — réponse immédiate pour éviter les
  // 500 par timeout Vercel.
  enArrierePlan(executerAuditSeoEnArrierePlan(row.id, url, motsCles));
  revalidatePath(`/dashboard/sites/${slug}/seo`);
  return { erreur: null, ok: true, auditId: row.id };
}

async function executerAuditSeoEnArrierePlan(
  auditId: string,
  url: string,
  motsCles: string[],
): Promise<void> {
  try {
    const resultat = await auditerSite({ url, motsCles });
    await db
      .update(seoAudits)
      .set({
        statut: "termine",
        scoreGlobal: resultat.scoreGlobal,
        scoreTechnique: resultat.scores.technique,
        scoreContenu: resultat.scores.contenu,
        scoreMotsCles: resultat.scores.mots_cles,
        scorePerformance: resultat.scores.performance,
        scoreMobile: resultat.scores.mobile,
        findings: resultat.findings,
        recommandations: resultat.recommandations,
        dureeMs: resultat.dureeMs,
        termineLe: new Date(),
      })
      .where(eq(seoAudits.id, auditId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db
      .update(seoAudits)
      .set({
        statut: "echec",
        erreur: msg,
        termineLe: new Date(),
      })
      .where(eq(seoAudits.id, auditId));
  }
}
