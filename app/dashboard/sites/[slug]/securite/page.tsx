import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import {
  ChevronLeft,
  Shield,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, securityAudits, securityIncidents } from "@/lib/db/schema";
import { FormulaireAuditSecurity } from "./formulaire-audit";
import { BoutonResoudreIncident } from "./bouton-resoudre";

export const dynamic = "force-dynamic";

export default async function PageSecuriteSite({
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
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, user.id)))
    .limit(1);
  if (!site) notFound();

  const audits = await db
    .select()
    .from(securityAudits)
    .where(eq(securityAudits.siteId, site.id))
    .orderBy(desc(securityAudits.creeLe))
    .limit(10);

  const dernier = audits[0] ?? null;

  const incidentsOuverts = await db
    .select()
    .from(securityIncidents)
    .where(
      and(
        eq(securityIncidents.siteId, site.id),
        eq(securityIncidents.statut, "ouvert"),
      ),
    )
    .orderBy(desc(securityIncidents.detecteLe))
    .limit(20);

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-14">
      <header className="mb-10">
        <Link
          href={`/dashboard/sites/${slug}`}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Retour à {site.nomEntreprise}
        </Link>
        <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-700">
          <Shield className="h-3 w-3" strokeWidth={2.5} />
          AxiSolver Shield
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Sécurité de {site.domainePrincipal}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Audit complet sur 6 piliers (headers HTTP, TLS, exposition de
          fichiers, cookies, contenu, réputation). Monitoring automatique
          toutes les 6 heures. Audit mensuel le 1er du mois à 8h UTC.
        </p>
      </header>

      {incidentsOuverts.length > 0 && (
        <section className="mb-10 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <header className="mb-5 flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700"
              aria-hidden
            >
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-rose-900">
                {incidentsOuverts.length} incident
                {incidentsOuverts.length > 1 ? "s" : ""} ouvert
                {incidentsOuverts.length > 1 ? "s" : ""}
              </h2>
              <p className="mt-0.5 text-xs text-rose-700">
                Détecté·s par le monitoring périodique
              </p>
            </div>
          </header>
          <ul className="space-y-3">
            {incidentsOuverts.map((inc) => (
              <li
                key={inc.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-white p-4"
              >
                <div className="flex-1">
                  <p className="flex items-center gap-2">
                    <BadgeSeverite severite={inc.severite} />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {inc.type.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-slate-900">
                    {inc.message}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Détecté le{" "}
                    {new Date(inc.detecteLe).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <BoutonResoudreIncident incidentId={inc.id} slug={slug} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Lancer un audit maintenant
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            L&apos;audit prend 15 à 30 secondes selon la vitesse du site
            cible. 6 piliers analysés en parallèle.
          </p>
        </header>
        <FormulaireAuditSecurity slug={slug} />
      </section>

      {dernier && dernier.statut === "termine" && (
        <section className="mb-10">
          <ScoreGlobalCarte
            score={dernier.scoreGlobal ?? 0}
            date={dernier.creeLe}
            certificatExpireeLe={dernier.certificatSslExpireeLe}
          />

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
            <CartePilier label="Headers" score={dernier.scoreHeaders} />
            <CartePilier label="TLS" score={dernier.scoreTls} />
            <CartePilier
              label="Exposition"
              score={dernier.scoreExposition}
            />
            <CartePilier label="Cookies" score={dernier.scoreCookies} />
            <CartePilier label="Contenu" score={dernier.scoreContenu} />
            <CartePilier
              label="Réputation"
              score={dernier.scoreReputation}
            />
          </div>

          {dernier.recommandations.length > 0 && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="mb-5 flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
                  aria-hidden
                >
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {dernier.recommandations.length} recommandation
                    {dernier.recommandations.length > 1 ? "s" : ""} priorisée
                    {dernier.recommandations.length > 1 ? "s" : ""}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Tri automatique par priorité et impact sécurité
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
                            {r.pilier}
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
                      <div className="mt-3 rounded-lg border border-slate-900/10 bg-gradient-to-br from-slate-900 to-slate-700 p-3 text-white">
                        <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                          Pris en charge par {r.pris_en_charge_axi.pack}
                        </p>
                        <p className="mt-1 text-xs">
                          Sans AXI :{" "}
                          <span className="line-through opacity-70">
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
          <Shield
            className="mx-auto h-10 w-10 text-slate-400"
            strokeWidth={1.5}
          />
          <p className="mt-3 text-sm text-slate-600">
            Aucun audit encore réalisé. Lancez le premier audit pour
            découvrir le niveau de sécurité de votre site.
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
                      : a.declencheur === "monitoring"
                        ? "monitoring auto"
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

function ScoreGlobalCarte({
  score,
  date,
  certificatExpireeLe,
}: {
  score: number;
  date: Date;
  certificatExpireeLe: Date | null;
}) {
  const couleur =
    score >= 80
      ? "from-emerald-700 to-teal-700"
      : score >= 60
        ? "from-amber-700 to-orange-700"
        : "from-rose-700 to-pink-700";
  const label =
    score >= 80 ? "Protégé" : score >= 60 ? "Correct" : "À renforcer";

  const joursSsl = certificatExpireeLe
    ? Math.round(
        (new Date(certificatExpireeLe).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${couleur} p-8 text-white shadow-lg`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] opacity-90">
            Score sécurité global
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
        {joursSsl !== null && (
          <div className="rounded-xl bg-white/15 p-3 text-right backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-90">
              Certificat SSL
            </p>
            <p className="mt-1 text-2xl font-bold">
              {joursSsl > 0 ? `J-${joursSsl}` : "expiré"}
            </p>
            <p className="mt-0.5 text-[11px] opacity-80">
              {certificatExpireeLe &&
                new Date(certificatExpireeLe).toLocaleDateString("fr-FR")}
            </p>
          </div>
        )}
      </div>
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
        : "text-rose-700";

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

function BadgeSeverite({
  severite,
}: {
  severite: "critique" | "haute" | "moyenne" | "basse";
}) {
  const styles: Record<string, string> = {
    critique: "bg-rose-200 text-rose-900 border-rose-300",
    haute: "bg-orange-200 text-orange-900 border-orange-300",
    moyenne: "bg-amber-100 text-amber-900 border-amber-200",
    basse: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[severite]}`}
    >
      <AlertCircle className="h-3 w-3" strokeWidth={2.4} />
      {severite}
    </span>
  );
}
