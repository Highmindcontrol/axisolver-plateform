import "server-only";

import type { StatsQuotidiennes } from "./agreger";
import type { OpportuniteUpsell } from "./upsell";

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

          ${sectionTopQuestions}

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
