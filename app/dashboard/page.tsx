import Link from "next/link";
import { ArrowRight, Code, BookOpen } from "lucide-react";

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
          Vous êtes connecté. La console complète (vos sites, config,
          tickets, analytiques) arrive au LOT E — en attendant, deux
          premières briques sont disponibles.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Link
          href="/dashboard/installation"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
        >
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"
            aria-hidden
          >
            <Code className="h-5 w-5" strokeWidth={2} />
          </span>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            Installation du widget
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Récupérez votre snippet copier-coller et les instructions
            WordPress, Shopify, Webflow, HTML pur.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 group-hover:underline">
            Voir le snippet
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          </span>
        </Link>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
            aria-hidden
          >
            <BookOpen className="h-5 w-5" strokeWidth={2} />
          </span>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            Base de connaissances
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Upload PDF, crawl URL/sitemap, embeddings pgvector. L&apos;UI
            dédiée arrive au LOT E — la plomberie serveur est déjà posée.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
            Bientôt disponible
          </span>
        </div>
      </div>
    </div>
  );
}
