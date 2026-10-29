import "server-only";

import { and, eq, isNotNull } from "drizzle-orm";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  siteConfigs,
  siteRapportDestinataires,
  sites,
  users,
} from "@/lib/db/schema";
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
    nomEntreprise: site.nomSite ?? site.nomEntreprise,
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

  const nomSite = site.nomSite ?? site.nomEntreprise;
  const subject = `Rapport AxiSolver — ${nomSite} · ${stats.nbVisiteursUniques} visiteur·s hier`;
  const expediteurEmail =
    process.env.CONTACT_FROM_EMAIL ?? "noreply@axisolver.app";
  const expediteurNom = process.env.CONTACT_FROM_NAME ?? "AxiSolver";

  // Envoi à l'admin principal (sans bannière)
  const resPrincipal = await envoyerViaBrevo({
    apiKey,
    expediteurEmail,
    expediteurNom,
    subject,
    html,
    to: destinataire,
  });
  if (!resPrincipal.ok) {
    return {
      ok: false,
      raison: resPrincipal.raison,
      destinataire,
    };
  }

  // Envoi aux destinataires supplémentaires : récupère chaque ligne
  // + nom de celui qui les a ajoutés pour la mention. Tolère l'absence
  // de la table (migration 0018 pas appliquée).
  try {
    const supabase = createSupabaseAdminClient();
    const destSupp = await db
      .select({
        email: siteRapportDestinataires.email,
        prenom: siteRapportDestinataires.prenom,
        ajouteParUserId: siteRapportDestinataires.ajouteParUserId,
      })
      .from(siteRapportDestinataires)
      .where(eq(siteRapportDestinataires.siteId, site.id));

    for (const d of destSupp) {
      let nomAjouteur = "l'administrateur du compte";
      if (d.ajouteParUserId) {
        try {
          const { data } = await supabase.auth.admin.getUserById(
            d.ajouteParUserId,
          );
          const meta = (data.user?.user_metadata ?? {}) as Record<
            string,
            unknown
          >;
          const prenom =
            typeof meta.prenom === "string" ? meta.prenom.trim() : "";
          const nom = typeof meta.nom === "string" ? meta.nom.trim() : "";
          const complet = [prenom, nom].filter(Boolean).join(" ");
          nomAjouteur = complet || data.user?.email || nomAjouteur;
        } catch {
          // Fallback silencieux : "l'administrateur du compte"
        }
      }

      const salutation = d.prenom
        ? `Bonjour ${d.prenom},`
        : "Bonjour,";
      const banniere = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px; background:#eef2ff; border-left:3px solid #4f46e5; border-radius:8px;">
  <tr>
    <td style="padding:14px 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px; color:#312e81; line-height:1.5;">
      ${salutation}<br/>
      Vous recevez cet email car <strong>${nomAjouteur}</strong> vous a ajouté comme
      destinataire du rapport quotidien AxiSolver pour le site
      <strong>${nomSite}</strong>.
    </td>
  </tr>
</table>`;

      const htmlAvecBanniere = html.replace(
        /(<body[^>]*>)/i,
        `$1${banniere}`,
      );

      await envoyerViaBrevo({
        apiKey,
        expediteurEmail,
        expediteurNom,
        subject,
        html: htmlAvecBanniere,
        to: d.email,
        toName: d.prenom ?? undefined,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      !(
        msg.includes("relation") &&
        msg.includes("site_rapport_destinataires") &&
        msg.includes("does not exist")
      )
    ) {
      console.error("[rapport] envoi destinataires supp échec:", msg);
    }
  }

  return { ok: true, destinataire, nbStats: stats.nbConversations };
}

/** Envoi d'un email via Brevo. Factorisé pour main + destinataires supp. */
async function envoyerViaBrevo(params: {
  apiKey: string;
  expediteurEmail: string;
  expediteurNom: string;
  subject: string;
  html: string;
  to: string;
  toName?: string;
}): Promise<{ ok: true } | { ok: false; raison: string }> {
  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": params.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: params.expediteurNom, email: params.expediteurEmail },
        to: [
          params.toName
            ? { email: params.to, name: params.toName }
            : { email: params.to },
        ],
        subject: params.subject,
        htmlContent: params.html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        raison: `Brevo ${res.status} ${res.statusText} : ${detail}`,
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, raison: e instanceof Error ? e.message : String(e) };
  }
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
