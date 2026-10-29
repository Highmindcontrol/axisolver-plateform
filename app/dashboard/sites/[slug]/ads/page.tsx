import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import {
  ChevronLeft,
  Megaphone,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lightbulb,
  Tag,
  Target,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, adsAudits } from "@/lib/db/schema";
import { FormulaireAuditAds } from "./formulaire-audit";

export const dynamic = "force-dynamic";

export default async function PageAdsSite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) notFound();

  const audits = await db
    .select()
    .from(adsAudits)
    .where(eq(adsAudits.siteId, site.id))
    .orderBy(desc(adsAudits.creeLe))
    .limit(10);

  const dernier = audits[0] ?? null;

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-10">
        <Link
          href={`/dashboard/sites/${slug}`}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Retour à {site.nomEntreprise}
        </Link>
        <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-fuchsia-700">
          <Megaphone className="h-3 w-3" strokeWidth={2.5} />
          Publicité & Ads
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Audit publicitaire de {site.domainePrincipal}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          4 piliers analysés : trackers, consentement RGPD, visibilité sur
          les annonces Google, infrastructure remarketing. Audit automatique
          le 1er du mois à 9h UTC.
        </p>
      </header>

      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Lancer un audit maintenant
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            L&apos;audit prend 10-20 secondes. Les mots-clés sont optionnels
            mais permettent de voir qui enchérit sur votre marché.
          </p>
        </header>
        <FormulaireAuditAds slug={slug} />
      </section>

      {dernier && dernier.statut === "termine" && (
        <section className="mb-10 space-y-6">
          <ScoreGlobalCarte
            score={dernier.scoreGlobal ?? 0}
            date={dernier.creeLe}
          />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <CartePilier label="Trackers" score={dernier.scoreTrackers} />
            <CartePilier
              label="Consentement"
              score={dernier.scoreConsentement}
            />
            <CartePilier
              label="Visibilité SERP"
              score={dernier.scoreVisibilite}
            />
            <CartePilier
              label="Remarketing"
              score={dernier.scoreRemarketing}
            />
          </div>

          {dernier.trackersDetectes.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="mb-4 flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
                  aria-hidden
                >
                  <Tag className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {dernier.trackersDetectes.length} tracker
                    {dernier.trackersDetectes.length > 1 ? "s" : ""}{" "}
                    détecté{dernier.trackersDetectes.length > 1 ? "s" : ""}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Fingerprint HTML — ne nécessite pas d&apos;accès aux
                    comptes publicitaires
                  </p>
                </div>
              </header>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {dernier.trackersDetectes.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {t.nom}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {t.categorie}
                        {t.id && (
                          <>
                            {" · "}
                            <span className="font-mono">{t.id}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <CheckCircle2
                      className="h-5 w-5 text-emerald-600"
                      strokeWidth={2}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dernier.annoncesConcurrentes.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="mb-4 flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-700"
                  aria-hidden
                >
                  <Target className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Annonces concurrentes détectées
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Marques qui enchérissent sur vos mots-clés métier
                  </p>
                </div>
              </header>
              <ul className="space-y-2">
                {dernier.annoncesConcurrentes.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-fuchsia-700">
                        « {a.requete} » · annonce #{a.position}
                      </p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-900">
                        {a.titre}
                      </p>
                      {a.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                          {a.description}
                        </p>
                      )}
                      <p className="mt-1 truncate text-[11px] text-slate-500">
                        {a.url}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dernier.recommandations.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="mb-5 flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
                  aria-hidden
                >
                  <Lightbulb className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {dernier.recommandations.length} recommandation
                    {dernier.recommandations.length > 1 ? "s" : ""} priorisée
                    {dernier.recommandations.length > 1 ? "s" : ""}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Tri automatique par priorité et impact ROI
                  </p>
                </div>
              </header>
              <ul className="space-y-4">
                {dernier.recommandations.map((r, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2">
                          <BadgePriorite priorite={r.priorite} />
                          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                            {r.pilier.replace("_", " ")}
                          </span>
                        </p>
                        <h3 className="mt-2 text-sm font-semibold text-slate-900">
                          {r.titre}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700">
                          {r.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right text-[11px] text-slate-500">
                        <p>
                          Effort :{" "}
                          <strong className="text-slate-700">
                            {r.effort}
                          </strong>
                        </p>
                        <p>
                          Impact :{" "}
                          <strong className="text-slate-700">
                            {r.impact}
                          </strong>
                        </p>
                      </div>
                    </div>
                    {r.pris_en_charge_axi && (
                      <div className="mt-3 rounded-lg border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-pink-50 p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-fuchsia-700">
                          Pris en charge par {r.pris_en_charge_axi.pack}
                        </p>
                        <p className="mt-1 text-xs text-slate-700">
                          Sans AXI :{" "}
                          <span className="line-through text-slate-500">
                            {r.pris_en_charge_axi.cout_sans_axi}
                          </span>{" "}
                          · Avec AXI :{" "}
                          <strong>
                            {r.pris_en_charge_axi.cout_avec_axi}
                          </strong>
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {dernier && dernier.statut === "en_cours" && (
        <section className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4" strokeWidth={2} />
            Audit en cours… rechargez la page dans quelques secondes.
          </p>
        </section>
      )}

      {dernier && dernier.statut === "echec" && (
        <section className="mb-10 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4" strokeWidth={2} />
            L&apos;audit a échoué : {dernier.erreur}
          </p>
        </section>
      )}

      {!dernier && (
        <section className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <Megaphone
            className="mx-auto h-10 w-10 text-slate-400"
            strokeWidth={1.5}
          />
          <p className="mt-3 text-sm text-slate-600">
            Aucun audit encore réalisé. Lancez le premier audit pour voir
            vos trackers actifs, votre conformité RGPD et vos concurrents
            publicitaires.
          </p>
        </section>
      )}

      {audits.length > 1 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-center gap-3">
            <Clock
              className="h-5 w-5 text-slate-600"
              strokeWidth={2}
              aria-hidden
            />
            <h2 className="text-sm font-semibold text-slate-900">
              Historique des audits
            </h2>
          </header>
          <ul className="divide-y divide-slate-100">
            {audits.slice(1).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {new Date(a.creeLe).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Déclencheur :{" "}
                    {a.declencheur === "auto_mensuel"
                      ? "cron mensuel"
                      : "manuel"}
                  </p>
                </div>
                <div className="text-right">
                  {a.statut === "termine" ? (
                    <p className="text-base font-bold text-slate-900">
                      {a.scoreGlobal}/100
                    </p>
                  ) : a.statut === "en_cours" ? (
                    <p className="text-xs text-amber-700">en cours</p>
                  ) : (
                    <p className="text-xs text-rose-700">échec</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ScoreGlobalCarte({ score, date }: { score: number; date: Date }) {
  const couleur =
    score >= 80
      ? "from-emerald-500 to-teal-500"
      : score >= 60
        ? "from-amber-500 to-orange-500"
        : "from-fuchsia-600 to-pink-600";
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Correct" : "À travailler";

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${couleur} p-8 text-white shadow-lg`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] opacity-90">
        Score publicité global
      </p>
      <p className="mt-2 text-5xl font-bold">{score}/100</p>
      <p className="mt-1 text-sm opacity-90">
        {label} ·{" "}
        {new Date(date).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

function CartePilier({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  const val = score ?? 0;
  const couleur =
    val >= 80
      ? "text-emerald-700"
      : val >= 60
        ? "text-amber-700"
        : "text-fuchsia-700";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${couleur}`}>{val}</p>
      <p className="text-[11px] text-slate-400">/ 100</p>
    </div>
  );
}

function BadgePriorite({
  priorite,
}: {
  priorite: "critique" | "haute" | "moyenne" | "basse";
}) {
  const styles: Record<string, string> = {
    critique: "bg-rose-100 text-rose-800 border-rose-200",
    haute: "bg-orange-100 text-orange-800 border-orange-200",
    moyenne: "bg-amber-100 text-amber-800 border-amber-200",
    basse: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[priorite]}`}
    >
      {priorite === "critique" && (
        <AlertCircle className="h-3 w-3" strokeWidth={2.4} />
      )}
      {priorite === "basse" && (
        <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
      )}
      {priorite}
    </span>
  );
}
