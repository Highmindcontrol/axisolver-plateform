"use server";

import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, securityAudits, securityIncidents } from "@/lib/db/schema";
import { auditerSite } from "@/lib/engines/security/auditer-site";
import {
  changerMode,
  creerIntervention,
  executerIntervention,
} from "@/lib/packs/security-shield";
import { CATALOGUE } from "@/lib/engines/security/recommandations";
import { enArrierePlan } from "@/lib/background";

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
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
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

  // Audit lancé en arrière-plan — réponse immédiate pour éviter les
  // 500 par timeout Vercel. L'UI poll via AutoRefresh jusqu'à ce que
  // le statut passe de 'en_cours' à 'termine' ou 'echec'.
  enArrierePlan(executerAuditSecurityEnArrierePlan(row.id, url));
  revalidatePath(`/dashboard/sites/${slug}/securite`);
  return { erreur: null, ok: true, auditId: row.id };
}

async function executerAuditSecurityEnArrierePlan(
  auditId: string,
  url: string,
): Promise<void> {
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
      .where(eq(securityAudits.id, auditId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db
      .update(securityAudits)
      .set({ statut: "echec", erreur: msg, termineLe: new Date() })
      .where(eq(securityAudits.id, auditId));
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
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
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

/**
 * Change le mode de remédiation AXI Security Shield pour un site :
 * - desactive : AXI n'intervient jamais, se contente d'auditer et alerter
 * - validation : AXI propose les actions, l'utilisateur valide chacune
 * - automatique : AXI exécute dès qu'il détecte un problème qu'il sait traiter
 */
export type EtatModeRemediation = {
  erreur: string | null;
  ok?: boolean;
  mode?: "desactive" | "validation" | "automatique";
};

export async function definirModeRemediationAction(
  _prev: EtatModeRemediation,
  formData: FormData,
): Promise<EtatModeRemediation> {
  const slug = String(formData.get("slug") ?? "").trim();
  const mode = String(formData.get("mode") ?? "").trim();
  if (!slug) return { erreur: "slug manquant" };
  if (!["desactive", "validation", "automatique"].includes(mode)) {
    return { erreur: "mode invalide" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable." };

  try {
    await changerMode({
      siteId: site.id,
      mode: mode as "desactive" | "validation" | "automatique",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { erreur: `Impossible d'enregistrer : ${msg}` };
  }

  revalidatePath(`/dashboard/sites/${slug}/securite`);
  return {
    erreur: null,
    ok: true,
    mode: mode as "desactive" | "validation" | "automatique",
  };
}

/**
 * Déclenche la remédiation d'une recommandation : crée une intervention,
 * puis appelle le plugin WordPress AXI Security Shield pour appliquer
 * concrètement la correction côté site.
 */
export type EtatDeclencherRemediation = {
  erreur: string | null;
  succes: boolean;
  journal?: string;
};

export async function declencherRemediationAction(
  _prev: EtatDeclencherRemediation,
  formData: FormData,
): Promise<EtatDeclencherRemediation> {
  const slug = String(formData.get("slug") ?? "").trim();
  const findingCode = String(formData.get("findingCode") ?? "").trim();
  const auditId = String(formData.get("auditId") ?? "").trim() || undefined;

  if (!slug || !findingCode) {
    return { erreur: "paramètres manquants", succes: false };
  }

  const reco = CATALOGUE[findingCode];
  if (!reco) {
    return { erreur: "Code de recommandation inconnu.", succes: false };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté.", succes: false };

  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) return { erreur: "Site introuvable.", succes: false };

  // Crée l'intervention
  let interventionId: string;
  try {
    const res = await creerIntervention({
      siteId: site.id,
      auditId: auditId ?? null,
      findingCode,
      pilier: reco.pilier,
      titre: reco.titre,
      descriptionAction:
        reco.pris_en_charge_axi?.cout_avec_axi ?? reco.description,
      statut: "programmee",
      modeDeclenche: "validation",
      valideParUserId: user.id,
    });
    interventionId = res.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("securite_interventions")) {
      return {
        erreur:
          "Migration 0020 pas encore appliquée. Lance le SQL puis réessaie.",
        succes: false,
      };
    }
    return { erreur: `Impossible de créer l'intervention : ${msg}`, succes: false };
  }

  // Exécute immédiatement
  const resultat = await executerIntervention({
    interventionId,
    siteId: site.id,
  });

  revalidatePath(`/dashboard/sites/${slug}/securite`);
  return {
    erreur: resultat.ok ? null : resultat.journal,
    succes: resultat.ok,
    journal: resultat.journal,
  };
}
