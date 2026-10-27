import { Rocket } from "lucide-react";

/**
 * Page d'accueil du dashboard — placeholder LOT A.
 *
 * À enrichir au LOT E avec la vraie liste des sites de l'utilisateur,
 * la carte de configuration, les tickets, les analytiques, etc.
 */
export default function PageDashboard() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 py-14">
      <header className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Bienvenue dans votre dashboard AxiSolver.
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Vous êtes connecté. La console complète (vos sites, options
          d&apos;accueil, base de connaissances, tickets, analytiques)
          sera livrée au LOT E du chantier.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <span
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white"
          aria-hidden
        >
          <Rocket className="h-5 w-5" strokeWidth={2} />
        </span>
        <h2 className="mt-5 text-base font-semibold text-slate-900">
          Chantier en cours
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Fondations multi-tenant posées. Les prochains lots (configuration
          du widget, snippet d&apos;installation, base de connaissances,
          tickets) arrivent dans les semaines qui suivent.
        </p>
      </div>
    </div>
  );
}
