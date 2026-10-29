import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteAccesSecurite } from "@/lib/db/schema";

/**
 * Détermine si AXI Security Shield peut exécuter des remédiations
 * sur ce site. True si au moins un accès opérationnel existe parmi :
 *  - wordpress_rest (le plugin WP sera vérifié séparément)
 *  - github_repo avec dernière connexion OK
 */
export async function verifierRemediationDisponible(
  siteId: string,
): Promise<{
  disponible: boolean;
  typeAcces: "wordpress_rest" | "github_repo" | null;
}> {
  try {
    // Priorité GitHub (plus universel pour Next.js), puis WordPress
    const [accesGithub] = await db
      .select({ id: siteAccesSecurite.id, actif: siteAccesSecurite.actif })
      .from(siteAccesSecurite)
      .where(
        and(
          eq(siteAccesSecurite.siteId, siteId),
          eq(siteAccesSecurite.type, "github_repo"),
          eq(siteAccesSecurite.actif, true),
        ),
      )
      .limit(1);

    if (accesGithub) {
      return { disponible: true, typeAcces: "github_repo" };
    }

    const [accesWp] = await db
      .select({ id: siteAccesSecurite.id })
      .from(siteAccesSecurite)
      .where(
        and(
          eq(siteAccesSecurite.siteId, siteId),
          eq(siteAccesSecurite.type, "wordpress_rest"),
          eq(siteAccesSecurite.actif, true),
        ),
      )
      .limit(1);

    if (accesWp) {
      return { disponible: true, typeAcces: "wordpress_rest" };
    }

    return { disponible: false, typeAcces: null };
  } catch {
    return { disponible: false, typeAcces: null };
  }
}
