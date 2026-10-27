import "server-only";

import { and, eq, isNotNull } from "drizzle-orm";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, siteConfigs, users } from "@/lib/db/schema";
import { agregerStatsQuotidiennes } from "./agreger";
import { detecterOpportuniteUpsell } from "./upsell";
import { rendreRapportHtml } from "./rendre";

/**
 * Pipeline d'envoi du rapport quotidien pour UN site : charge les
 * infos, agrège les stats, détecte l'opportunité upsell, rend le HTML,
 * envoie via Brevo.
 *
 * Isolé pour pouvoir être lancé en tâche cron OU manuellement depuis
 * le dashboard (bouton « Renvoyer maintenant »).
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type ResultatEnvoi =
  | { ok: true; destinataire: string; nbStats: number }
  | { ok: false; raison: string; destinataire?: string };

export async function envoyerRapportQuotidien(params: {
  siteId: string;
  debut?: Date;
  fin?: Date;
}): Promise<ResultatEnvoi> {
  const [site] = await db
    .select()
    .from(sites)
    .where(eq(sites.id, params.siteId))
    .limit(1);
  if (!site) return { ok: false, raison: "Site introuvable" };

  const [config] = await db
    .select()
    .from(siteConfigs)
    .where(eq(siteConfigs.siteId, site.id))
    .limit(1);
  if (!config) return { ok: false, raison: "Config site introuvable" };

  // Email destinataire : config.email_notification si défini, sinon
  // email de l'owner (récupéré via Supabase Admin API).
  let destinataire = config.emailNotification ?? "";
  if (!destinataire && site.ownerUserId) {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.auth.admin.getUserById(site.ownerUserId);
    destinataire = data.user?.email ?? "";
  }
  if (!destinataire) {
    return {
      ok: false,
      raison: `Aucun email destinataire configuré pour ${site.slug}`,
    };
  }

  const stats = await agregerStatsQuotidiennes({
    siteId: site.id,
    debut: params.debut,
    fin: params.fin,
  });

  // Pas de rapport si zéro activité (évite le spam)
  if (stats.nbConversations === 0) {
    return {
      ok: false,
      raison: `Aucune conversation sur la période pour ${site.slug} — rapport non envoyé`,
      destinataire,
    };
  }

  const opportunite = detecterOpportuniteUpsell(stats);
  const urlDashboard =
    (process.env.NEXT_PUBLIC_APP_URL ?? "https://axisolver.app") +
    `/dashboard/sites/${site.slug}`;

  const html = rendreRapportHtml({
    nomEntreprise: site.nomEntreprise,
    domainePrincipal: site.domainePrincipal,
    slug: site.slug,
    stats,
    opportunite,
    urlDashboard,
  });

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, raison: "BREVO_API_KEY manquante en prod", destinataire };
    }
    console.log("[rapport] (dev) simulation envoi :", {
      destinataire,
      site: site.slug,
      stats: {
        conversations: stats.nbConversations,
        visiteurs: stats.nbVisiteursUniques,
        tickets: stats.nbTicketsOuverts + stats.nbTicketsResolus,
      },
      opportunite: opportunite.nature,
    });
    return { ok: true, destinataire, nbStats: stats.nbConversations };
  }

  const subject = `Rapport AxiSolver — ${site.nomEntreprise} · ${stats.nbVisiteursUniques} visiteur·s hier`;
  const expediteurEmail =
    process.env.CONTACT_FROM_EMAIL ?? "noreply@axisolver.app";
  const expediteurNom = process.env.CONTACT_FROM_NAME ?? "AxiSolver";

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: expediteurNom, email: expediteurEmail },
        to: [{ email: destinataire }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        raison: `Brevo ${res.status} ${res.statusText} : ${detail}`,
        destinataire,
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, raison: msg, destinataire };
  }

  return { ok: true, destinataire, nbStats: stats.nbConversations };
}

/**
 * Envoie les rapports quotidiens pour TOUS les sites actifs.
 * Utilisé par le cron Vercel. Boucle avec gestion d'erreur
 * individuelle (une erreur sur un site ne bloque pas les autres).
 */
export async function envoyerTousLesRapports(): Promise<{
  total: number;
  envoyes: number;
  echecs: Array<{ slug: string; raison: string }>;
}> {
  const sitesActifs = await db
    .select()
    .from(sites)
    .where(and(eq(sites.actif, true), isNotNull(sites.ownerUserId)));

  let envoyes = 0;
  const echecs: Array<{ slug: string; raison: string }> = [];

  for (const site of sitesActifs) {
    try {
      const res = await envoyerRapportQuotidien({ siteId: site.id });
      if (res.ok) envoyes++;
      else echecs.push({ slug: site.slug, raison: res.raison });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      echecs.push({ slug: site.slug, raison: msg });
    }
  }

  return { total: sitesActifs.length, envoyes, echecs };
}
