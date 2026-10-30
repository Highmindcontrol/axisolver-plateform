import "server-only";

import { executerTool } from "../client";
import { lireConnexionActive } from "../connexions";
import { enregistrerUsage } from "../usage";

/**
 * Actions HubSpot via Composio.
 *
 * V1 : création automatique de contact + deal quand AxiSolver détecte
 * une conversation qualifiée (score Gaugista > seuil, ou tool AXI
 * explicite). La transcription complète est ajoutée en note sur la
 * fiche contact pour que le commercial ait le contexte.
 */

export async function creerContactHubSpot(params: {
  userId: string;
  siteId: string | null;
  packSlug?: string;
  email: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  entreprise?: string;
  message?: string;
}): Promise<
  | { ok: true; contactId: string }
  | { ok: false; raison: string }
> {
  const connexion = await lireConnexionActive({
    userId: params.userId,
    siteId: params.siteId,
    connectorSlug: "hubspot",
  });
  if (!connexion) return { ok: false, raison: "hubspot_non_connecte" };

  try {
    const resultat = await executerTool({
      action: "HUBSPOT_CREATE_CONTACT",
      connectionId: connexion.composioConnectionId,
      params: {
        email: params.email,
        firstname: params.prenom,
        lastname: params.nom,
        phone: params.telephone,
        company: params.entreprise,
        hs_lead_status: "NEW",
      },
    });

    await enregistrerUsage({
      userId: params.userId,
      siteId: params.siteId,
      packSlug: params.packSlug ?? "default",
      connectorSlug: "hubspot",
      nbToolCalls: 1,
    });

    if (!resultat.successful) {
      return { ok: false, raison: resultat.error ?? "hubspot_echec" };
    }
    const contactId =
      (resultat.data?.id as string | undefined) ??
      (resultat.data?.contactId as string | undefined);
    if (!contactId) {
      return { ok: false, raison: "contact_id_manquant" };
    }

    if (params.message) {
      await ajouterNoteHubSpot({
        userId: params.userId,
        siteId: params.siteId,
        packSlug: params.packSlug,
        contactId,
        contenu: params.message,
      }).catch(() => undefined);
    }

    return { ok: true, contactId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, raison: msg.slice(0, 200) };
  }
}

/**
 * Ajoute une note sur un contact HubSpot existant. Utilisé pour
 * attacher la transcription de conversation sur le contact qu'on
 * vient de créer.
 */
export async function ajouterNoteHubSpot(params: {
  userId: string;
  siteId: string | null;
  packSlug?: string;
  contactId: string;
  contenu: string;
}): Promise<{ ok: true } | { ok: false; raison: string }> {
  const connexion = await lireConnexionActive({
    userId: params.userId,
    siteId: params.siteId,
    connectorSlug: "hubspot",
  });
  if (!connexion) return { ok: false, raison: "hubspot_non_connecte" };

  try {
    const resultat = await executerTool({
      action: "HUBSPOT_CREATE_NOTE",
      connectionId: connexion.composioConnectionId,
      params: {
        contact_id: params.contactId,
        hs_note_body: params.contenu.slice(0, 32000),
      },
    });
    await enregistrerUsage({
      userId: params.userId,
      siteId: params.siteId,
      packSlug: params.packSlug ?? "default",
      connectorSlug: "hubspot",
      nbToolCalls: 1,
    });
    if (!resultat.successful) {
      return { ok: false, raison: resultat.error ?? "note_echec" };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, raison: msg.slice(0, 200) };
  }
}
