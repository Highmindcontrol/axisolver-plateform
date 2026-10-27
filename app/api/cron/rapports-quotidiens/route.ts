import { NextResponse } from "next/server";
import { envoyerTousLesRapports } from "@/lib/axi-solver/rapport/envoyer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron Vercel — envoi des rapports quotidiens AxiSolver.
 *
 * Appelé par Vercel Cron selon la config dans vercel.json. Protégé
 * par le header Authorization: Bearer ${CRON_SECRET} que Vercel
 * injecte automatiquement sur les crons de son plan Pro+.
 *
 * Boucle sur tous les sites actifs, agrège les stats des dernières
 * 24h, détecte les opportunités upsell AXI Initial, et envoie par
 * Brevo. Les erreurs individuelles ne bloquent pas la boucle.
 */
export async function GET(request: Request) {
  // Protection cron : Vercel ajoute Authorization: Bearer ${CRON_SECRET}
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn(
      "[cron/rapports-quotidiens] CRON_SECRET manquant — exécution autorisée en dev uniquement",
    );
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Cron secret non configuré", { status: 500 });
    }
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const debut = Date.now();
  try {
    const resultat = await envoyerTousLesRapports();
    const duree = Date.now() - debut;
    console.log(
      `[cron/rapports-quotidiens] terminé en ${duree}ms : ${resultat.envoyes}/${resultat.total} envoyés, ${resultat.echecs.length} échec·s`,
    );
    if (resultat.echecs.length > 0) {
      console.log(
        `[cron/rapports-quotidiens] échecs :`,
        JSON.stringify(resultat.echecs, null, 2),
      );
    }
    return NextResponse.json({
      ok: true,
      duree_ms: duree,
      total: resultat.total,
      envoyes: resultat.envoyes,
      echecs: resultat.echecs.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cron/rapports-quotidiens] erreur fatale :", msg);
    return NextResponse.json(
      { ok: false, erreur: msg },
      { status: 500 },
    );
  }
}
