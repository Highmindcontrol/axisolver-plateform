import "server-only";

import type {
  ResumePilier,
  ResumeSecurite,
  StatsQuotidiennes,
} from "./agreger";
import type { OpportuniteUpsell } from "./upsell";
import { barChartHoraireSvg } from "./chart-svg";

/**
 * Rendu HTML du rapport quotidien AxiSolver.
 *
 * Design cohérent avec les templates auth : gradient indigo/violet,
 * cards slate, typo system. Email-ready (tables, inline styles, pas
 * de JS, taille raisonnable).
 */

export function rendreRapportHtml(params: {
  nomEntreprise: string;
  domainePrincipal: string;
  slug: string;
  stats: StatsQuotidiennes;
  opportunite: OpportuniteUpsell;
  urlDashboard: string;
}): string {
  const { nomEntreprise, domainePrincipal, slug, stats, opportunite, urlDashboard } = params;

  const dateFR = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(stats.debut);

  const sectionUpsell = opportunite.nature
    ? `
    <tr>
      <td style="padding:0 32px 28px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg,#f0f1ff,#f8f0ff);border:1px solid #ddd6fe;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:20px 22px">
              <p style="margin:0 0 6px;font-size:10px;font-weight:600;color:#6d28d9;letter-spacing:1.5px;text-transform:uppercase">💡 Opportunité détectée</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#1e1b4b">${escapeHtml(opportunite.message)}</p>
              ${
                opportunite.gainEstimé
                  ? `<p style="margin:0 0 14px;font-size:12px;color:#5b21b6"><strong>Gain estimé :</strong> ${escapeHtml(opportunite.gainEstimé)}</p>`
                  : ""
              }
              <p style="margin:0;text-align:left">
                <a href="${escapeHtml(opportunite.cta.url)}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#8b5cf6);color:#fff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:999px">${escapeHtml(opportunite.cta.libelle)} →</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : "";

  const sectionTopQuestions =
    stats.topQuestions.length > 0
      ? `
    <tr>
      <td style="padding:0 32px 28px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a">Top questions des visiteurs</p>
        <ul style="margin:0;padding:0 0 0 18px;font-size:13px;line-height:1.7;color:#334155">
          ${stats.topQuestions.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}
        </ul>
      </td>
    </tr>`
      : "";

  // ────── Section Évolution vs semaine précédente ──────
  const comp = stats.comparaisonSemainePrec;
  const flecheDelta = (d: number | null) =>
    d === null
      ? "—"
      : d > 0
        ? `<span style="color:#059669;font-weight:600">▲ +${d}%</span>`
        : d < 0
          ? `<span style="color:#dc2626;font-weight:600">▼ ${d}%</span>`
          : `<span style="color:#64748b;font-weight:600">= 0%</span>`;
  const sectionEvolution =
    comp.nbConversations > 0 || comp.nbVisiteursUniques > 0
      ? `
    <tr>
      <td style="padding:0 32px 24px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a">Comparaison avec la semaine précédente</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
          <tr>
            <td style="padding:14px 16px;font-size:12px;color:#334155">
              <strong style="color:#0f172a">Conversations :</strong>
              ${stats.nbConversations} aujourd'hui vs ${comp.nbConversations} il y a 7j · ${flecheDelta(comp.deltaConversationsPct)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 16px 14px;font-size:12px;color:#334155">
              <strong style="color:#0f172a">Visiteurs uniques :</strong>
              ${stats.nbVisiteursUniques} vs ${comp.nbVisiteursUniques} · ${flecheDelta(comp.deltaVisiteursPct)}
            </td>
          </tr>
        </table>
      </td>
    </tr>`
      : "";

  // ────── Section Score de satisfaction ──────
  const score = stats.scoreSatisfaction;
  const couleurScore =
    score >= 80 ? "#059669" : score >= 60 ? "#d97706" : "#dc2626";
  const libelleScore =
    score >= 80 ? "Excellent" : score >= 60 ? "Correct" : "À améliorer";
  const sectionScore =
    stats.nbConversations > 0
      ? `
    <tr>
      <td style="padding:0 32px 24px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px">
          <tr>
            <td style="padding:16px 18px">
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#64748b;letter-spacing:1px;text-transform:uppercase">Score de satisfaction visiteur</p>
              <div style="font-size:28px;font-weight:800;color:${couleurScore};line-height:1.1">${score}<span style="font-size:14px;color:#94a3b8;font-weight:500">/100</span></div>
              <p style="margin:4px 0 0;font-size:12px;color:${couleurScore};font-weight:600">${libelleScore}</p>
              <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;line-height:1.5">Score basé sur le taux de résolution, les tickets chauds/urgents et la longueur des conversations.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
      : "";

  // ────── Section Intentions détectées ──────
  const totalIntentions =
    stats.nbDemandesRdv + stats.nbDemandesTarif + stats.nbDemandesRappel;
  const sectionIntentions =
    totalIntentions > 0
      ? `
    <tr>
      <td style="padding:0 32px 24px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a">Ce que vos visiteurs voulaient</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td width="33%" style="padding-right:6px;vertical-align:top">
              ${renderCarteStat("Demandes RDV", String(stats.nbDemandesRdv), "")}
            </td>
            <td width="34%" style="padding:0 3px;vertical-align:top">
              ${renderCarteStat("Demandes tarifs", String(stats.nbDemandesTarif), "")}
            </td>
            <td width="33%" style="padding-left:6px;vertical-align:top">
              ${renderCarteStat("Demandes rappel", String(stats.nbDemandesRappel), "")}
            </td>
          </tr>
        </table>
      </td>
    </tr>`
      : "";

  // ────── Section Pics d'activité (bar chart) ──────
  const sectionActiviteHoraire =
    stats.nbConversations > 0
      ? `
    <tr>
      <td style="padding:0 32px 24px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a">Pics d'activité (24 dernières heures, UTC)</p>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 10px">
          ${barChartHoraireSvg({ valeurs: stats.activiteHoraire, couleur: "#4f46e5" })}
        </div>
      </td>
    </tr>`
      : "";

  // ────── Section Pilier Ads ──────
  const sectionAds = renderSectionPilier({
    titre: "Publicité",
    emoji: "📣",
    resume: stats.resumeAds,
    urlDashboard: `${urlDashboard}/ads`,
    libelleOkCourt: "Trackers correctement installés, visibilité SERP conforme.",
    libelleCtaAbsent: "Lancer un premier audit publicité",
  });

  // ────── Section Pilier SEO ──────
  const sectionSeo = renderSectionPilier({
    titre: "SEO",
    emoji: "🔍",
    resume: stats.resumeSeo,
    urlDashboard: `${urlDashboard}/seo`,
    libelleOkCourt: "Fondations SEO en place, pas de point bloquant détecté.",
    libelleCtaAbsent: "Lancer un premier audit SEO",
  });

  // ────── Section Pilier Sécurité (détaillée) ──────
  const sectionSecuriteDetaillee = renderSectionSecurite({
    resume: stats.resumeSecurite,
    urlDashboard: `${urlDashboard}/securite`,
  });

  // ────── Section Alertes sécurité (bandeau résumé top page) ──────
  const sectionAlertesSecurite =
    stats.alertesSecurite.length > 0
      ? `
    <tr>
      <td style="padding:0 32px 24px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a">Alertes sécurité</p>
        ${stats.alertesSecurite
          .map((a) => {
            const bg =
              a.severite === "critique"
                ? "#fef2f2"
                : a.severite === "attention"
                  ? "#fffbeb"
                  : "#eff6ff";
            const brd =
              a.severite === "critique"
                ? "#fecaca"
                : a.severite === "attention"
                  ? "#fde68a"
                  : "#bfdbfe";
            const col =
              a.severite === "critique"
                ? "#991b1b"
                : a.severite === "attention"
                  ? "#92400e"
                  : "#1e40af";
            const icon =
              a.severite === "critique"
                ? "⛔"
                : a.severite === "attention"
                  ? "⚠️"
                  : "ℹ️";
            return `<div style="background:${bg};border:1px solid ${brd};border-radius:10px;padding:12px 14px;margin-bottom:8px;color:${col};font-size:12px;line-height:1.5">
              <span style="margin-right:8px">${icon}</span>${escapeHtml(a.message)}
            </div>`;
          })
          .join("")}
      </td>
    </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Rapport quotidien AxiSolver — ${escapeHtml(nomEntreprise)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;padding:40px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border-radius:16px;box-shadow:0 4px 20px rgba(15,23,42,.06);overflow:hidden">

          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#8b5cf6);padding:28px 32px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;font-weight:800;font-size:16px;vertical-align:middle">A</span>
                    <span style="color:#fff;font-weight:700;font-size:16px;margin-left:10px;vertical-align:middle">AxiSolver</span>
                  </td>
                  <td style="text-align:right">
                    <span style="color:rgba(255,255,255,.85);font-size:11px;letter-spacing:1px;text-transform:uppercase">Rapport quotidien</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 10px">
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#4f46e5;letter-spacing:1.5px;text-transform:uppercase">${escapeHtml(dateFR)}</p>
              <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3">Hier sur ${escapeHtml(nomEntreprise)}</h1>
              <p style="margin:0 0 18px;font-size:13px;color:#64748b"><a href="https://${escapeHtml(domainePrincipal)}" style="color:#64748b;text-decoration:none">${escapeHtml(domainePrincipal)}</a></p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 20px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="50%" style="padding-right:8px;vertical-align:top">
                    ${renderCarteStat("Visiteurs accueillis", String(stats.nbVisiteursUniques), `${stats.nbConversations} conversation·s`)}
                  </td>
                  <td width="50%" style="padding-left:8px;vertical-align:top">
                    ${renderCarteStat("Tours en moyenne", stats.nbToursMoyen.toFixed(1), `${stats.nbToursTotal} tours au total`)}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px"></td>
                </tr>
                <tr>
                  <td width="50%" style="padding-right:8px;vertical-align:top">
                    ${renderCarteStat(
                      "Tickets AXI créés",
                      String(stats.nbTicketsOuverts + stats.nbTicketsResolus),
                      `${stats.nbTicketsChauds} chaud·s · ${stats.nbTicketsUrgents} urgent·s`,
                    )}
                  </td>
                  <td width="50%" style="padding-left:8px;vertical-align:top">
                    ${renderCarteStat(
                      "Taux de résolution",
                      stats.nbConversations > 0
                        ? `${Math.round(((stats.nbConversations - stats.conversationsSansResolution) / stats.nbConversations) * 100)}%`
                        : "—",
                      `${stats.conversationsSansResolution} non résolue·s`,
                    )}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${sectionEvolution}

          ${sectionScore}

          ${sectionAlertesSecurite}

          ${sectionIntentions}

          ${sectionActiviteHoraire}

          ${sectionTopQuestions}

          ${sectionAds}

          ${sectionSeo}

          ${sectionSecuriteDetaillee}

          ${sectionUpsell}

          <tr>
            <td style="padding:0 32px 32px">
              <p style="margin:0 0 14px;text-align:center">
                <a href="${escapeHtml(urlDashboard)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;font-weight:600;font-size:13px;padding:11px 22px;border-radius:999px">Voir le détail dans le dashboard →</a>
              </p>
              <p style="margin:0;text-align:center;font-size:11px;color:#94a3b8">AxiSolver vous envoie ce rapport chaque matin.<br>
                <a href="${escapeHtml(urlDashboard)}/configuration" style="color:#94a3b8">Changer la fréquence ou se désinscrire</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px;background:#f8fafc;text-align:center">
              <p style="margin:0;font-size:11px;color:#94a3b8">AxiSolver est édité par Ataraxis Holding Ltd — <a href="https://axisolver.app" style="color:#4f46e5;text-decoration:none">axisolver.app</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderCarteStat(label: string, valeur: string, detail: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
    <tr>
      <td style="padding:16px 18px">
        <p style="margin:0 0 4px;font-size:10px;font-weight:600;color:#64748b;letter-spacing:1px;text-transform:uppercase">${escapeHtml(label)}</p>
        <p style="margin:0 0 2px;font-size:24px;font-weight:800;color:#0f172a">${escapeHtml(valeur)}</p>
        <p style="margin:0;font-size:11px;color:#94a3b8">${escapeHtml(detail)}</p>
      </td>
    </tr>
  </table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Palette couleurs selon le statut d'un pilier. */
function paletteStatut(
  statut: "ok" | "attention" | "critique" | "indisponible",
) {
  switch (statut) {
    case "ok":
      return { bg: "#f0fdf4", brd: "#bbf7d0", txt: "#166534", pill: "#dcfce7", pillTxt: "#166534", label: "Tout va bien" };
    case "attention":
      return { bg: "#fffbeb", brd: "#fde68a", txt: "#92400e", pill: "#fef3c7", pillTxt: "#92400e", label: "À surveiller" };
    case "critique":
      return { bg: "#fef2f2", brd: "#fecaca", txt: "#991b1b", pill: "#fee2e2", pillTxt: "#991b1b", label: "Action requise" };
    case "indisponible":
    default:
      return { bg: "#f8fafc", brd: "#e2e8f0", txt: "#475569", pill: "#f1f5f9", pillTxt: "#475569", label: "Non audité" };
  }
}

/** Formate une date UTC vers "il y a X jours" lisible. */
function tempsEcoule(d: Date | null): string {
  if (!d) return "jamais";
  const diffJours = Math.max(
    0,
    Math.floor((Date.now() - new Date(d).getTime()) / (24 * 60 * 60 * 1000)),
  );
  if (diffJours === 0) return "aujourd'hui";
  if (diffJours === 1) return "hier";
  if (diffJours < 30) return `il y a ${diffJours} jours`;
  const mois = Math.floor(diffJours / 30);
  return mois === 1 ? "il y a 1 mois" : `il y a ${mois} mois`;
}

/** Rendu générique d'une section pilier (Ads ou SEO). */
function renderSectionPilier(params: {
  titre: string;
  emoji: string;
  resume: ResumePilier;
  urlDashboard: string;
  libelleOkCourt: string;
  libelleCtaAbsent: string;
}): string {
  const { titre, emoji, resume, urlDashboard, libelleOkCourt, libelleCtaAbsent } = params;
  const p = paletteStatut(resume.statut);

  const corps = resume.disponible
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px">
        <tr>
          <td style="font-size:12px;color:${p.txt};line-height:1.6">
            <strong>Score :</strong> ${resume.scoreGlobal ?? "—"}/100 · <strong>Dernier audit :</strong> ${tempsEcoule(resume.dateAudit)}
            ${
              resume.nbRecosCritiques + resume.nbRecosHautes > 0
                ? `<br/><strong>À traiter :</strong> ${resume.nbRecosCritiques} critique${resume.nbRecosCritiques > 1 ? "s" : ""} · ${resume.nbRecosHautes} haute${resume.nbRecosHautes > 1 ? "s" : ""} priorité`
                : `<br/>${escapeHtml(libelleOkCourt)}`
            }
          </td>
        </tr>
        ${
          resume.topRecos.length > 0
            ? `<tr>
                 <td style="padding-top:10px">
                   <ul style="margin:0;padding:0 0 0 18px;font-size:12px;line-height:1.7;color:${p.txt}">
                     ${resume.topRecos.map((r) => `<li>${escapeHtml(r.titre)}</li>`).join("")}
                   </ul>
                 </td>
               </tr>`
            : ""
        }
        <tr>
          <td style="padding-top:12px">
            <a href="${escapeHtml(urlDashboard)}" style="display:inline-block;background:${p.txt};color:#fff;text-decoration:none;font-weight:600;font-size:12px;padding:8px 16px;border-radius:999px">Voir le détail →</a>
          </td>
        </tr>
      </table>`
    : `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px">
        <tr>
          <td style="font-size:12px;color:${p.txt};line-height:1.6">
            Aucun audit effectué pour l'instant sur ce pilier.
          </td>
        </tr>
        <tr>
          <td style="padding-top:12px">
            <a href="${escapeHtml(urlDashboard)}" style="display:inline-block;background:${p.txt};color:#fff;text-decoration:none;font-weight:600;font-size:12px;padding:8px 16px;border-radius:999px">${escapeHtml(libelleCtaAbsent)} →</a>
          </td>
        </tr>
      </table>`;

  return `
    <tr>
      <td style="padding:0 32px 24px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${p.bg};border:1px solid ${p.brd};border-radius:12px">
          <tr>
            <td style="padding:16px 18px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:16px;vertical-align:middle">${emoji}</span>
                    <span style="font-size:13px;font-weight:700;color:${p.txt};margin-left:6px;vertical-align:middle">${escapeHtml(titre)}</span>
                  </td>
                  <td style="text-align:right">
                    <span style="display:inline-block;background:${p.pill};color:${p.pillTxt};font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 9px;border-radius:999px">${p.label}</span>
                  </td>
                </tr>
              </table>
              ${corps}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

/** Rendu de la section Sécurité (variante avec incidents + SSL). */
function renderSectionSecurite(params: {
  resume: ResumeSecurite;
  urlDashboard: string;
}): string {
  const { resume, urlDashboard } = params;
  const p = paletteStatut(resume.statut);

  const sslLigne =
    resume.sslExpirationJours !== null
      ? resume.sslExpirationJours < 15
        ? `<br/><strong>⚠ Certificat SSL :</strong> expire dans ${resume.sslExpirationJours} jour${resume.sslExpirationJours > 1 ? "s" : ""}`
        : `<br/><strong>Certificat SSL :</strong> valide (${resume.sslExpirationJours} j restants)`
      : "";

  const incidentsLigne =
    resume.nbIncidentsOuverts > 0
      ? `<br/><strong>Incidents ouverts :</strong> ${resume.nbIncidentsOuverts} (dont ${resume.nbIncidentsCritiques} critique${resume.nbIncidentsCritiques > 1 ? "s" : ""}, ${resume.nbIncidentsHauts} haute${resume.nbIncidentsHauts > 1 ? "s" : ""})`
      : `<br/>Aucun incident ouvert.`;

  const corps = resume.disponible
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px">
        <tr>
          <td style="font-size:12px;color:${p.txt};line-height:1.6">
            <strong>Score :</strong> ${resume.scoreGlobal ?? "—"}/100 · <strong>Dernier audit :</strong> ${tempsEcoule(resume.dateAudit)}
            ${incidentsLigne}
            ${sslLigne}
          </td>
        </tr>
        ${
          resume.topRecos.length > 0
            ? `<tr>
                 <td style="padding-top:10px">
                   <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:${p.txt}">Actions prioritaires :</p>
                   <ul style="margin:0;padding:0 0 0 18px;font-size:12px;line-height:1.7;color:${p.txt}">
                     ${resume.topRecos.map((r) => `<li>${escapeHtml(r.titre)}</li>`).join("")}
                   </ul>
                 </td>
               </tr>`
            : ""
        }
        <tr>
          <td style="padding-top:12px">
            <a href="${escapeHtml(urlDashboard)}" style="display:inline-block;background:${p.txt};color:#fff;text-decoration:none;font-weight:600;font-size:12px;padding:8px 16px;border-radius:999px">Voir le détail →</a>
          </td>
        </tr>
      </table>`
    : `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px">
        <tr>
          <td style="font-size:12px;color:${p.txt};line-height:1.6">
            Audit sécurité pas encore effectué.
            ${incidentsLigne}
          </td>
        </tr>
        <tr>
          <td style="padding-top:12px">
            <a href="${escapeHtml(urlDashboard)}" style="display:inline-block;background:${p.txt};color:#fff;text-decoration:none;font-weight:600;font-size:12px;padding:8px 16px;border-radius:999px">Lancer un audit sécurité →</a>
          </td>
        </tr>
      </table>`;

  return `
    <tr>
      <td style="padding:0 32px 24px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${p.bg};border:1px solid ${p.brd};border-radius:12px">
          <tr>
            <td style="padding:16px 18px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:16px;vertical-align:middle">🛡️</span>
                    <span style="font-size:13px;font-weight:700;color:${p.txt};margin-left:6px;vertical-align:middle">Sécurité</span>
                  </td>
                  <td style="text-align:right">
                    <span style="display:inline-block;background:${p.pill};color:${p.pillTxt};font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 9px;border-radius:999px">${p.label}</span>
                  </td>
                </tr>
              </table>
              ${corps}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}
