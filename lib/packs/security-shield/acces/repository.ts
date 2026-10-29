import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteAccesSecurite } from "@/lib/db/schema";
import { chiffrer, dechiffrer } from "./chiffrement";
import type {
  AccesCredentiels,
  AccesParametresPublics,
  AccesResume,
  AccesTypeId,
} from "./types";

/**
 * CRUD des accès AXI Security Shield. Fait partie du pack réutilisable
 * (indépendant d'AxiSolver). Prend siteId en paramètre, pas de dépendance
 * à la session Next — l'auth est gérée côté app avant appel.
 */

export async function listerAcces(siteId: string): Promise<AccesResume[]> {
  const rows = await db
    .select({
      id: siteAccesSecurite.id,
      siteId: siteAccesSecurite.siteId,
      type: siteAccesSecurite.type,
      libelle: siteAccesSecurite.libelle,
      parametresPublics: siteAccesSecurite.parametresPublics,
      actif: siteAccesSecurite.actif,
      derniereConnexionLe: siteAccesSecurite.derniereConnexionLe,
      derniereConnexionOk: siteAccesSecurite.derniereConnexionOk,
      derniereConnexionErreur: siteAccesSecurite.derniereConnexionErreur,
      creeLe: siteAccesSecurite.creeLe,
    })
    .from(siteAccesSecurite)
    .where(eq(siteAccesSecurite.siteId, siteId))
    .orderBy(desc(siteAccesSecurite.creeLe));

  return rows.map((r) => ({
    id: r.id,
    siteId: r.siteId,
    type: r.type as AccesTypeId,
    libelle: r.libelle,
    parametresPublics: r.parametresPublics as AccesParametresPublics,
    actif: r.actif,
    derniereConnexionLe: r.derniereConnexionLe,
    derniereConnexionOk: r.derniereConnexionOk,
    derniereConnexionErreur: r.derniereConnexionErreur,
    creeLe: r.creeLe,
  }));
}

export async function creerAcces(params: {
  siteId: string;
  type: AccesTypeId;
  libelle: string;
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
  creeParUserId?: string;
}): Promise<{ id: string }> {
  const { ciphertext, iv, tag } = chiffrer(
    JSON.stringify(params.credentiels),
  );

  const [row] = await db
    .insert(siteAccesSecurite)
    .values({
      siteId: params.siteId,
      type: params.type,
      libelle: params.libelle,
      parametresPublics: params.parametresPublics as Record<string, unknown>,
      credentielsChiffres: ciphertext,
      credentielsMeta: { iv, tag },
      actif: true,
      creeParUserId: params.creeParUserId,
    })
    .returning({ id: siteAccesSecurite.id });

  return { id: row.id };
}

export async function recupererCredentiels(
  accesId: string,
  siteId: string,
): Promise<AccesCredentiels | null> {
  const [row] = await db
    .select({
      credentielsChiffres: siteAccesSecurite.credentielsChiffres,
      credentielsMeta: siteAccesSecurite.credentielsMeta,
    })
    .from(siteAccesSecurite)
    .where(
      and(
        eq(siteAccesSecurite.id, accesId),
        eq(siteAccesSecurite.siteId, siteId),
      ),
    )
    .limit(1);

  if (!row) return null;
  const meta = row.credentielsMeta;
  const clair = dechiffrer(row.credentielsChiffres, meta.iv, meta.tag);
  return JSON.parse(clair) as AccesCredentiels;
}

export async function supprimerAcces(
  accesId: string,
  siteId: string,
): Promise<void> {
  await db
    .delete(siteAccesSecurite)
    .where(
      and(
        eq(siteAccesSecurite.id, accesId),
        eq(siteAccesSecurite.siteId, siteId),
      ),
    );
}

export async function marquerConnexion(params: {
  accesId: string;
  siteId: string;
  ok: boolean;
  erreur?: string | null;
}): Promise<void> {
  await db
    .update(siteAccesSecurite)
    .set({
      derniereConnexionLe: new Date(),
      derniereConnexionOk: params.ok,
      derniereConnexionErreur: params.erreur ?? null,
      majLe: new Date(),
    })
    .where(
      and(
        eq(siteAccesSecurite.id, params.accesId),
        eq(siteAccesSecurite.siteId, params.siteId),
      ),
    );
}
