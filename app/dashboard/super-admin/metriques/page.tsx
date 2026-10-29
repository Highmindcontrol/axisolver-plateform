import {
  ArrowLeft,
  BarChart3,
  Clock,
  CreditCard,
  Globe,
  MessageSquare,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { lireMetriquesPlateforme } from "@/lib/services/metriques-plateforme";

/**
 * Métriques globales plateforme AxiSolver (super-admin).
 * Agrège users, sites, abonnements Stripe actifs, MRR, répartition
 * par formule, conversations/mois, top sites.
 */
export const dynamic = "force-dynamic";

export default async function PageMetriques() {
  const m = await lireMetriquesPlateforme();

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <Link
        href="/dashboard/super-admin"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
        Retour au back-office
      </Link>

      <header className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Super-admin / Métriques
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Métriques globales AxiSolver
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Vue d&apos;ensemble en temps réel : clients, sites, abonnements,
          revenu récurrent, consommation. Toutes les valeurs sont
          calculées à partir de la base de données AxiSolver.
        </p>
      </header>

      {/* ─── Cartes synthèse ─────────────────────────── */}
      <section className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CarteMetrique
          icone={Users}
          couleur="indigo"
          libelle="Clients"
          valeur={m.nbClientsTotal.toLocaleString("fr-FR")}
          detail={`+${m.nbClientsNouveauxCeMois} ce mois`}
        />
        <CarteMetrique
          icone={Globe}
          couleur="emerald"
          libelle="Sites installés"
          valeur={m.nbSitesTotal.toLocaleString("fr-FR")}
          detail="Snippets AxiSolver actifs"
        />
        <CarteMetrique
          icone={TrendingUp}
          couleur="amber"
          libelle="MRR HT"
          valeur={`${m.mrrEurHt.toLocaleString("fr-FR")} €`}
          detail={`${m.nbAbonnementsActifs} abonnement${m.nbAbonnementsActifs > 1 ? "s" : ""} actif${m.nbAbonnementsActifs > 1 ? "s" : ""}`}
        />
        <CarteMetrique
          icone={CreditCard}
          couleur="violet"
          libelle="ARR projeté HT"
          valeur={`${(m.mrrEurHt * 12).toLocaleString("fr-FR")} €`}
          detail="Revenu annuel récurrent"
        />
      </section>

      {/* ─── Statuts abonnements ─────────────────────── */}
      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <CarteStatut
          couleur="emerald"
          libelle="Abonnements actifs"
          valeur={m.nbAbonnementsActifs}
        />
        <CarteStatut
          couleur="amber"
          libelle="Essais en cours"
          valeur={m.nbEssaisEnCours}
          icone={Clock}
        />
        <CarteStatut
          couleur="rose"
          libelle="Annulations prévues"
          valeur={m.nbAnnulationsEnCours}
          icone={XCircle}
        />
      </section>

      {/* ─── Répartition par formule ─────────────────── */}
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"
            aria-hidden
          >
            <BarChart3 className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Répartition par formule
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Abonnements actifs + revenu mensuel par plan
            </p>
          </div>
        </header>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Formule
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Prix / mois
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Abonnés actifs
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Revenu mensuel HT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {m.repartitionFormules.map((r, i) => (
                <tr
                  key={r.plan}
                  className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {r.nomFormule}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">
                    {(r.revenuMensuelHt / Math.max(1, r.nbAbonnements)).toFixed(
                      0,
                    ) === "NaN"
                      ? "—"
                      : null}
                    <span>
                      {r.nbAbonnements > 0
                        ? `${Math.round(r.revenuMensuelHt / r.nbAbonnements)} €`
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                    {r.nbAbonnements}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">
                    {r.revenuMensuelHt.toLocaleString("fr-FR")} €
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-sm font-semibold">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold">
                  {m.nbAbonnementsActifs}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold">
                  {m.mrrEurHt.toLocaleString("fr-FR")} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ─── Consommation mois courant ───────────────── */}
      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <CarteMetrique
          icone={MessageSquare}
          couleur="indigo"
          libelle="Conversations ce mois"
          valeur={m.nbConversationsCeMois.toLocaleString("fr-FR")}
          detail="Tous sites confondus"
        />
        <CarteMetrique
          icone={MessageSquare}
          couleur="violet"
          libelle="Messages ce mois"
          valeur={m.nbMessagesCeMois.toLocaleString("fr-FR")}
          detail="Messages visiteur traités"
        />
      </section>

      {/* ─── Top sites consommation ──────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"
            aria-hidden
          >
            <Globe className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Top 10 sites par conversations ce mois
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Classement des sites les plus actifs
            </p>
          </div>
        </header>

        {m.topSitesConversations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-500">
            Aucune conversation enregistrée pour le mois en cours.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {m.topSitesConversations.map((s, i) => (
              <li
                key={s.siteSlug}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {s.nomSite}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      /{s.siteSlug}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {s.nbConversations.toLocaleString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CarteMetrique({
  icone: Icone,
  couleur,
  libelle,
  valeur,
  detail,
}: {
  icone: typeof Users;
  couleur: "indigo" | "emerald" | "amber" | "violet";
  libelle: string;
  valeur: string;
  detail: string;
}) {
  const classes: Record<typeof couleur, string> = {
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${classes[couleur]}`}
          aria-hidden
        >
          <Icone className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {libelle}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{valeur}</p>
      <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function CarteStatut({
  couleur,
  libelle,
  valeur,
  icone: Icone,
}: {
  couleur: "emerald" | "amber" | "rose";
  libelle: string;
  valeur: number;
  icone?: typeof Clock;
}) {
  const classes: Record<typeof couleur, string> = {
    emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-900",
    amber: "border-amber-200 bg-amber-50/60 text-amber-900",
    rose: "border-rose-200 bg-rose-50/60 text-rose-900",
  };
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-5 ${classes[couleur]}`}
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider opacity-80">
          {libelle}
        </p>
        <p className="mt-1 text-2xl font-bold">
          {valeur.toLocaleString("fr-FR")}
        </p>
      </div>
      {Icone && (
        <Icone className="h-6 w-6 opacity-50" strokeWidth={1.8} aria-hidden />
      )}
    </div>
  );
}
