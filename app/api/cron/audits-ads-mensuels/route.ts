import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, adsAudits } from "@/lib/db/schema";
import { auditerSite } from "@/lib/engines/ads/auditer-site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron Vercel — audits publicité / Ads mensuels AxiSolver.
 *
 * Appelé le 1er du mois à 9h UTC via `vercel.json` (après SEO 7h et
 * security 8h). Boucle sur tous les sites actifs vérifiés et lance un
 * audit complet 4 piliers. Les erreurs individuelles ne bloquent pas
 * la boucle. Aucun mot-clé en entrée — le propriétaire du site peut
 * relancer un audit manuel depuis le dashboard avec ses mots-clés
 * métier pour obtenir le benchmark SERP.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn(
      "[cron/audits-ads-mensuels] CRON_SECRET manquant — autorisé en dev uniquement",
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
  const echecs: Array<{ slug: string; raison: string }> = [];

  for (const site of sitesActifs) {
    if (!site.proprieteVerifieeLe) continue;
    total++;

    const url = `https://${site.domainePrincipal}`;
    const [row] = await db
      .insert(adsAudits)
      .values({
        siteId: site.id,
        urlAuditee: url,
        declencheur: "auto_mensuel",
        statut: "en_cours",
        motsClesTestes: [],
      })
      .returning({ id: adsAudits.id });

    try {
      const resultat = await auditerSite({ url, motsCles: [] });

      await db
        .update(adsAudits)
        .set({
          statut: "termine",
          scoreGlobal: resultat.scoreGlobal,
          scoreTrackers: resultat.scores.trackers,
          scoreConsentement: resultat.scores.consentement,
          scoreVisibilite: resultat.scores.visibilite,
          scoreRemarketing: resultat.scores.remarketing,
          trackersDetectes: resultat.trackersDetectes,
          annoncesConcurrentes: resultat.annoncesConcurrentes,
          findings: resultat.findings,
          recommandations: resultat.recommandations,
          dureeMs: resultat.dureeMs,
          termineLe: new Date(),
        })
        .where(eq(adsAudits.id, row.id));

      reussis++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db
        .update(adsAudits)
        .set({ statut: "echec", erreur: msg, termineLe: new Date() })
        .where(eq(adsAudits.id, row.id));
      echecs.push({ slug: site.slug, raison: msg });
    }
  }

  const duree = Date.now() - debut;
  console.log(
    `[cron/audits-ads-mensuels] terminé en ${duree}ms : ${reussis}/${total} audits réussis, ${echecs.length} échec·s`,
  );
  if (echecs.length > 0) {
    console.log(
      `[cron/audits-ads-mensuels] échecs :`,
      JSON.stringify(echecs, null, 2),
    );
  }

  return NextResponse.json({
    ok: true,
    duree_ms: duree,
    total,
    reussis,
    echecs: echecs.length,
  });
}
