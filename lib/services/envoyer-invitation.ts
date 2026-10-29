import "server-only";

/**
 * Envoie l'email d'invitation co-administrateur via Brevo.
 * Pattern reproduit depuis lib/axi-solver/rapport/envoyer.ts.
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type ResultatEnvoiInvitation =
  | { ok: true }
  | { ok: false; raison: string };

export async function envoyerEmailInvitation(params: {
  destinataireEmail: string;
  destinatairePrenom: string | null;
  destinataireNom: string | null;
  inviteParNom: string;
  nomWorkspace: string;
  tokenInvitation: string;
  baseUrl: string;
}): Promise<ResultatEnvoiInvitation> {
  const apiKey = process.env.BREVO_API_KEY;

  const salutation = params.destinatairePrenom
    ? `Bonjour ${params.destinatairePrenom}`
    : "Bonjour";
  const lienAcceptation = `${params.baseUrl.replace(/\/$/, "")}/accepter-invitation/${params.tokenInvitation}`;

  const subject = `${params.inviteParNom} vous invite comme co-administrateur AxiSolver`;

  const html = `<!doctype html>
<html lang="fr">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f8fafc; margin:0; padding:40px 20px; color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden;">
      <tr>
        <td style="padding:28px 32px; background:linear-gradient(135deg,#4f46e5,#8b5cf6); color:#ffffff;">
          <h1 style="margin:0; font-size:20px; font-weight:600;">AxiSolver</h1>
          <p style="margin:6px 0 0; font-size:14px; opacity:.9;">Co-administration</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 16px; font-size:16px;">${salutation},</p>
          <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#334155;">
            <strong>${params.inviteParNom}</strong> vous invite à devenir
            co-administrateur de son compte AxiSolver
            <strong>«&nbsp;${params.nomWorkspace}&nbsp;»</strong>.
          </p>
          <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#334155;">
            Vous aurez <strong>exactement les mêmes droits</strong> que
            l'administrateur principal : gestion des sites, bases de
            connaissances, audits SEO/sécurité/publicité, facturation et
            invitation d'autres administrateurs.
          </p>
          <p style="margin:28px 0; text-align:center;">
            <a href="${lienAcceptation}" style="display:inline-block; background:linear-gradient(135deg,#4f46e5,#8b5cf6); color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:999px; font-weight:600; font-size:14px;">
              Accepter l'invitation
            </a>
          </p>
          <p style="margin:0 0 8px; font-size:12px; color:#64748b;">
            Lien direct :<br/>
            <a href="${lienAcceptation}" style="color:#4f46e5; word-break:break-all;">${lienAcceptation}</a>
          </p>
          <p style="margin:24px 0 0; font-size:12px; color:#64748b; line-height:1.6;">
            Cette invitation expire dans 7 jours. Si vous ne connaissez
            pas ${params.inviteParNom} ou si cette invitation ne vous
            semble pas légitime, ignorez simplement cet email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; text-align:center;">
          Email envoyé par AxiSolver depuis l'écosystème Ataraxis Group.
        </td>
      </tr>
    </table>
  </body>
</html>`;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, raison: "BREVO_API_KEY manquante en prod" };
    }
    console.log("[invitation] (dev) simulation envoi :", {
      email: params.destinataireEmail,
      lien: lienAcceptation,
    });
    return { ok: true };
  }

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
        to: [
          {
            email: params.destinataireEmail,
            name: [params.destinatairePrenom, params.destinataireNom]
              .filter(Boolean)
              .join(" "),
          },
        ],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        raison: `Brevo ${res.status} : ${detail}`,
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      raison: e instanceof Error ? e.message : String(e),
    };
  }
}
