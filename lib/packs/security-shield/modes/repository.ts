import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteConfigs } from "@/lib/db/schema";

/**
 * Lecture et écriture du mode de remédiation AXI Security Shield.
 * Logique métier du pack, utilisable par AxiSolver ET AxiHub.
 */

export type ModeRemediation = "desactive" | "validation" | "automatique";

export async function lireMode(siteId: string): Promise<ModeRemediation> {
  try {
    const [row] = await db
      .select({ mode: siteConfigs.modeRemediationSecurite })
      .from(siteConfigs)
      .where(eq(siteConfigs.siteId, siteId))
      .limit(1);
    return (row?.mode as ModeRemediation) ?? "desactive";
  } catch {
    return "desactive";
  }
}

export async function changerMode(params: {
  siteId: string;
  mode: ModeRemediation;
}): Promise<void> {
  await db
    .update(siteConfigs)
    .set({
      modeRemediationSecurite: params.mode,
      majLe: new Date(),
    })
    .where(eq(siteConfigs.siteId, params.siteId));
}
