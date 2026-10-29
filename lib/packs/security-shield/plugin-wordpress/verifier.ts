import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteAccesSecurite } from "@/lib/db/schema";
import { recupererCredentiels } from "../acces/repository";
import type {
  AccesCredentiels,
  AccesParametresPublics,
} from "../acces/types";
import { verifierPluginInstalle, type StatutPlugin } from "./client";

/**
 * Vérifie si le plugin AXI Security Shield est installé sur le site
 * en utilisant le premier accès WordPress configuré. Retourne un
 * statut complet, ou null si aucun accès WordPress n'est configuré.
 */
export async function verifierPluginPourSite(
  siteId: string,
): Promise<StatutPlugin | null> {
  try {
    const [acces] = await db
      .select()
      .from(siteAccesSecurite)
      .where(eq(siteAccesSecurite.siteId, siteId))
      .limit(1);

    if (!acces || acces.type !== "wordpress_rest") return null;

    const creds = await recupererCredentiels(acces.id, siteId);
    if (!creds) return null;

    return await verifierPluginInstalle({
      parametresPublics: acces.parametresPublics as AccesParametresPublics,
      credentiels: creds as AccesCredentiels,
    });
  } catch {
    return null;
  }
}
