import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import {
  BookOpen,
  ChevronLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Globe,
  Map,
  Trash2,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, siteConnaissanceSources } from "@/lib/db/schema";
import {
  FormulaireAjouterUrl,
  FormulaireAjouterSitemap,
  FormulaireUploadPdf,
  BoutonSupprimer,
} from "./formulaires";

export const dynamic = "force-dynamic";

export default async function PageBaseConnaissances({
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

  const sources = await db
    .select()
    .from(siteConnaissanceSources)
    .where(eq(siteConnaissanceSources.siteId, site.id))
    .orderBy(siteConnaissanceSources.creeLe);

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
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Base de connaissances
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Nourrissez le cerveau de votre AxiSolver
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ajoutez vos URLs, sitemaps et PDF. AxiSolver les crawle, les
          chunke, les embed, puis cite les sources quand il répond.
        </p>
      </header>

      <div className="mb-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
              aria-hidden
            >
              <Globe className="h-4 w-4" strokeWidth={2} />
            </span>
            <h2 className="text-sm font-semibold text-slate-900">URL</h2>
          </header>
          <FormulaireAjouterUrl slug={slug} />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
              aria-hidden
            >
              <Map className="h-4 w-4" strokeWidth={2} />
            </span>
            <h2 className="text-sm font-semibold text-slate-900">Sitemap</h2>
          </header>
          <FormulaireAjouterSitemap slug={slug} />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
              aria-hidden
            >
              <FileText className="h-4 w-4" strokeWidth={2} />
            </span>
            <h2 className="text-sm font-semibold text-slate-900">PDF</h2>
          </header>
          <FormulaireUploadPdf slug={slug} />
        </article>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
          Sources ({sources.length})
        </h2>
        {sources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookOpen
              className="mx-auto h-6 w-6 text-slate-400"
              strokeWidth={2}
              aria-hidden
            />
            <p className="mt-3 text-sm text-slate-600">
              Aucune source pour l&apos;instant. Ajoutez une URL, un
              sitemap ou un PDF ci-dessus pour commencer.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sources.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span
                  className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
                  aria-hidden
                >
                  {s.type === "url" && <Globe className="h-4 w-4" strokeWidth={2} />}
                  {s.type === "sitemap" && <Map className="h-4 w-4" strokeWidth={2} />}
                  {s.type === "pdf" && <FileText className="h-4 w-4" strokeWidth={2} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {s.nomAffichage ?? s.source}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {s.type.toUpperCase()} ·{" "}
                    {s.nbChunks} chunk·s · dernière ingestion{" "}
                    {s.derniereIngestionLe
                      ? new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(s.derniereIngestionLe))
                      : "jamais"}
                  </p>
                  {s.derniereErreur && (
                    <p className="mt-0.5 truncate text-xs text-rose-600">
                      {s.derniereErreur}
                    </p>
                  )}
                </div>
                <StatutBadge statut={s.statut} />
                <BoutonSupprimer slug={slug} sourceId={s.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<
    string,
    { icone: typeof CheckCircle2; libelle: string; className: string }
  > = {
    en_attente: {
      icone: Clock,
      libelle: "En attente",
      className: "bg-slate-100 text-slate-700",
    },
    en_cours: {
      icone: Clock,
      libelle: "En cours",
      className: "bg-indigo-100 text-indigo-800",
    },
    ingere: {
      icone: CheckCircle2,
      libelle: "Ingéré",
      className: "bg-emerald-100 text-emerald-800",
    },
    echec: {
      icone: AlertCircle,
      libelle: "Échec",
      className: "bg-rose-100 text-rose-800",
    },
  };
  const entry = map[statut] ?? map.en_attente;
  const Icone = entry.icone;
  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider sm:inline-flex ${entry.className}`}
    >
      <Icone className="h-3 w-3" strokeWidth={2.5} aria-hidden />
      {entry.libelle}
    </span>
  );
}
