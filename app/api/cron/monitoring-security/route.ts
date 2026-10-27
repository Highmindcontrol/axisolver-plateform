import { NextResponse } from "next/server";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { monitorerSite } from "@/lib/engines/security/monitorer-site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron Vercel — monitoring sécurité AxiSolver.
 *
 * Appelé toutes les 6 heures via `vercel.json`. Pour chaque site actif
 * dont la propriété est vérifiée : mesure du status HTTP, hash HTML,
 * expiration SSL, temps de réponse. Génère des incidents si anomalie.
 *
 * Les incidents critiques créés ici seront envoyés par email dans le
 * rapport quotidien (LOT G) et marqués notifié.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn(
      "[cron/monitoring-security] CRON_SECRET manquant — autorisé en dev uniquement",
    );
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Cron secret non configuré", { status: 500 });
    }
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const debut = Date.now();

  const sitesActifs = await db
    .select({
      id: sites.id,
      slug: sites.slug,
      domainePrincipal: sites.domainePrincipal,
      proprieteVerifieeLe: sites.proprieteVerifieeLe,
    })
    .from(sites)
    .where(eq(sites.actif, true));

  let total = 0;
  let reussis = 0;
  let incidentsCrees = 0;
  const echecs: Array<{ slug: string; raison: string }> = [];

  for (const site of sitesActifs) {
    if (!site.proprieteVerifieeLe) continue;
    total++;

    const url = `https://${site.domainePrincipal}`;
    try {
      const r = await monitorerSite({ siteId: site.id, url });
      reussis++;
      incidentsCrees += r.incidents.length;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      echecs.push({ slug: site.slug, raison: msg });
    }
  }

  const duree = Date.now() - debut;
  console.log(
    `[cron/monitoring-security] terminé en ${duree}ms : ${reussis}/${total} sites monitorés, ${incidentsCrees} incident·s détecté·s, ${echecs.length} échec·s`,
  );
  if (echecs.length > 0) {
    console.log(
      `[cron/monitoring-security] échecs :`,
      JSON.stringify(echecs, null, 2),
    );
  }

  return NextResponse.json({
    ok: true,
    duree_ms: duree,
    total,
    reussis,
    incidents_crees: incidentsCrees,
    echecs: echecs.length,
  });
}
