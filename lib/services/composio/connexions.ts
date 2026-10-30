import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { composioConnections } from "@/lib/db/schema";

import {
  initierConnexion,
  lireEtatConnexion,
  revoquerConnexion as revoquerCoteComposio,
  type ConnexionInitiee,
  type EtatConnexion,
} from "./client";

/**
 * Persistance des connexions Composio côté AxiSolver.
 *
 * Modèle : chaque (user, site, connecteur) a au plus UNE connexion
 * active. Si l'admin reconnecte le même outil, on révoque l'ancienne
 * et on crée une nouvelle ligne (audit trail préservé). On n'écrase
 * jamais une ligne existante avec un UPDATE agressif.
 *
 * Les tokens OAuth restent chez Composio — on garde seulement
 * `composio_connection_id` comme pointeur. Zéro secret stocké chez
 * nous.
 */

export type FilConnexion = {
  id: string;
  userId: string;
  siteId: string | null;
  packSlug: string;
  connectorSlug: string;
  composioConnectionId: string;
  oauthStatus: "pending" | "active" | "revoked" | "expired" | "erreur";
  scopes: string[];
  creeLe: Date;
  connecteLe: Date | null;
  expireLe: Date | null;
  derniereErreur: string | null;
};

/**
 * Démarre une nouvelle connexion : appel Composio pour l'URL OAuth +
 * stockage de la ligne pending en base. Retourne l'URL de redirection
 * à envoyer à l'utilisateur.
 */
export async function demarrerConnexion(params: {
  userId: string;
  siteId: string | null;
  packSlug: string;
  connectorSlug: string;
  redirectUri: string;
}): Promise<{ redirectUrl: string; connexionId: string }> {
  // entityId Composio = userId AxiSolver (scoping par utilisateur).
  // En V2 on pourra scoper par siteId si besoin de connexions
  // différentes selon le site.
  const entityId = `axisolver-${params.userId}`;

  const resComposio: ConnexionInitiee = await initierConnexion({
    appSlug: params.connectorSlug,
    entityId,
    redirectUri: params.redirectUri,
  });

  const [row] = await db
    .insert(composioConnections)
    .values({
      userId: params.userId,
      siteId: params.siteId,
      packSlug: params.packSlug,
      connectorSlug: params.connectorSlug,
      composioConnectionId: resComposio.connectionId,
      oauthStatus: "pending",
    })
    .returning();

  return {
    redirectUrl: resComposio.redirectUrl,
    connexionId: row.id,
  };
}

/**
 * Finalise une connexion après callback OAuth. Lit l'état chez
 * Composio et met à jour notre ligne.
 */
export async function finaliserConnexion(connexionId: string): Promise<void> {
  const [fil] = await db
    .select()
    .from(composioConnections)
    .where(eq(composioConnections.id, connexionId))
    .limit(1);
  if (!fil) throw new Error(`[composio] connexion ${connexionId} introuvable`);

  try {
    const etat: EtatConnexion = await lireEtatConnexion(
      fil.composioConnectionId,
    );
    await db
      .update(composioConnections)
      .set({
        oauthStatus: etat.status,
        scopes: etat.scopes,
        connecteLe: etat.status === "active" ? new Date() : fil.connecteLe,
        expireLe: etat.expireLe ? new Date(etat.expireLe) : null,
        derniereErreur: null,
      })
      .where(eq(composioConnections.id, connexionId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db
      .update(composioConnections)
      .set({
        oauthStatus: "erreur",
        derniereErreur: msg.slice(0, 500),
      })
      .where(eq(composioConnections.id, connexionId));
    throw e;
  }
}

/**
 * Récupère la connexion active pour (user, site, connecteur).
 * Retourne null si aucune connexion active trouvée.
 */
export async function lireConnexionActive(params: {
  userId: string;
  siteId: string | null;
  connectorSlug: string;
}): Promise<FilConnexion | null> {
  const whereClauses = [
    eq(composioConnections.userId, params.userId),
    eq(composioConnections.connectorSlug, params.connectorSlug),
    eq(composioConnections.oauthStatus, "active"),
  ];
  if (params.siteId) whereClauses.push(eq(composioConnections.siteId, params.siteId));

  const [row] = await db
    .select()
    .from(composioConnections)
    .where(and(...whereClauses))
    .orderBy(desc(composioConnections.creeLe))
    .limit(1);
  if (!row) return null;
  return rowVersFil(row);
}

/**
 * Liste toutes les connexions d'un user × site, triées par
 * connecteur. Pour la page UI « Mes outils connectés ».
 */
export async function listerConnexions(
  userId: string,
  siteId: string | null,
): Promise<FilConnexion[]> {
  const whereClauses = [eq(composioConnections.userId, userId)];
  if (siteId) whereClauses.push(eq(composioConnections.siteId, siteId));

  const rows = await db
    .select()
    .from(composioConnections)
    .where(and(...whereClauses))
    .orderBy(desc(composioConnections.creeLe));
  return rows.map(rowVersFil);
}

/**
 * Révoque une connexion : appel Composio pour couper côté tiers +
 * passe notre ligne en status 'revoked'.
 */
export async function revoquerConnexion(connexionId: string): Promise<void> {
  const [fil] = await db
    .select()
    .from(composioConnections)
    .where(eq(composioConnections.id, connexionId))
    .limit(1);
  if (!fil) return;

  try {
    await revoquerCoteComposio(fil.composioConnectionId);
  } catch (e) {
    console.warn("[composio] révocation côté Composio échouée", e);
  }

  await db
    .update(composioConnections)
    .set({ oauthStatus: "revoked" })
    .where(eq(composioConnections.id, connexionId));
}

type RowConnexion = typeof composioConnections.$inferSelect;

function rowVersFil(r: RowConnexion): FilConnexion {
  return {
    id: r.id,
    userId: r.userId,
    siteId: r.siteId,
    packSlug: r.packSlug,
    connectorSlug: r.connectorSlug,
    composioConnectionId: r.composioConnectionId,
    oauthStatus: r.oauthStatus as FilConnexion["oauthStatus"],
    scopes: r.scopes,
    creeLe: r.creeLe,
    connecteLe: r.connecteLe,
    expireLe: r.expireLe,
    derniereErreur: r.derniereErreur,
  };
}
