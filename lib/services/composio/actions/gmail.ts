import "server-only";

import { executerTool } from "../client";
import { lireConnexionActive } from "../connexions";
import { enregistrerUsage } from "../usage";

/**
 * Actions Gmail via Composio.
 *
 * V1 : envoi d'email transactionnel au commercial du site quand une
 * conversation visiteur est qualifiée. Zéro boîte mail chez nous
 * (voir doctrine « AXI n'est pas un envoyeur d'emails »), on passe
 * par le Gmail du commercial lui-même via OAuth.
 */

/**
 * Envoie un email depuis le compte Gmail connecté par l'admin.
 * Si aucune connexion active, retourne `{ ok: false, raison }` sans
 * throw — le caller choisit comment dégrader (log, fallback Brevo…).
 */
export async function envoyerEmailGmail(params: {
  userId: string;
  siteId: string | null;
  packSlug?: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
}): Promise<{ ok: true; messageId?: string } | { ok: false; raison: string }> {
  const connexion = await lireConnexionActive({
    userId: params.userId,
    siteId: params.siteId,
    connectorSlug: "gmail",
  });
  if (!connexion) {
    return { ok: false, raison: "gmail_non_connecte" };
  }

  try {
    const resultat = await executerTool({
      action: "GMAIL_SEND_EMAIL",
      connectionId: connexion.composioConnectionId,
      params: {
        recipient_email: params.to,
        subject: params.subject,
        body: params.bodyHtml ?? params.body,
        is_html: !!params.bodyHtml,
      },
    });

    await enregistrerUsage({
      userId: params.userId,
      siteId: params.siteId,
      packSlug: params.packSlug ?? "default",
      connectorSlug: "gmail",
      nbToolCalls: 1,
    });

    if (!resultat.successful) {
      return { ok: false, raison: resultat.error ?? "gmail_echec" };
    }
    const messageId = (resultat.data?.id as string | undefined) ?? undefined;
    return { ok: true, messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, raison: msg.slice(0, 200) };
  }
}
