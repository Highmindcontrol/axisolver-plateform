"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, securityAudits, securityIncidents } from "@/lib/db/schema";
import { auditerSite } from "@/lib/engines/security/auditer-site";

export type EtatAuditSecurity = {
  erreur: string | null;
  ok?: boolean;
  auditId?: string;
};

export async function lancerAuditSecurityAction(
  _prev: EtatAuditSecurity,
  formData: FormData,
): Promise<EtatAuditSecurity> {
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
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable." };

  const url = `https://${site.domainePrincipal}`;

  const [row] = await db
    .insert(securityAudits)
    .values({
      siteId: site.id,
      urlAuditee: url,
      declencheur: "manuel",
      statut: "en_cours",
    })
    .returning({ id: securityAudits.id });

  try {
    const resultat = await auditerSite({ url });

    await db
      .update(securityAudits)
      .set({
        statut: "termine",
        scoreGlobal: resultat.scoreGlobal,
        scoreHeaders: resultat.scores.headers,
        scoreTls: resultat.scores.tls,
        scoreExposition: resultat.scores.exposition,
        scoreCookies: resultat.scores.cookies,
        scoreContenu: resultat.scores.contenu,
        scoreReputation: resultat.scores.reputation,
        findings: resultat.findings,
        recommandations: resultat.recommandations,
        certificatSslExpireeLe: resultat.certificatSslExpireeLe,
        dureeMs: resultat.dureeMs,
        termineLe: new Date(),
      })
      .where(eq(securityAudits.id, row.id));

    revalidatePath(`/dashboard/sites/${slug}/securite`);
    return { erreur: null, ok: true, auditId: row.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db
      .update(securityAudits)
      .set({ statut: "echec", erreur: msg, termineLe: new Date() })
      .where(eq(securityAudits.id, row.id));
    return { erreur: msg };
  }
}

export type EtatResolutionIncident = {
  erreur: string | null;
  ok?: boolean;
};

export async function resoudreIncidentAction(
  _prev: EtatResolutionIncident,
  formData: FormData,
): Promise<EtatResolutionIncident> {
  const incidentId = String(formData.get("incidentId") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!incidentId || !slug) return { erreur: "paramètres manquants" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable." };

  await db
    .update(securityIncidents)
    .set({ statut: "resolu", resoluLe: new Date() })
    .where(
      and(
        eq(securityIncidents.id, incidentId),
        eq(securityIncidents.siteId, site.id),
      ),
    );

  revalidatePath(`/dashboard/sites/${slug}/securite`);
  return { erreur: null, ok: true };
}
