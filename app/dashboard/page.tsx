import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Plus, ShieldCheck, AlertTriangle, Globe, ChevronRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function PageDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const mesSites = await db
    .select()
    .from(sites)
    .where(eq(sites.ownerUserId, user.id))
    .orderBy(sites.creeLe);

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-14">
      <header className="mb-10 flex items-start justify-between gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Mes sites AxiSolver
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Chaque site = une instance AxiSolver installée sur un domaine
            unique. Création, configuration, base de connaissances, tickets.
          </p>
        </div>
        <Link
          href="/dashboard/sites/nouveau"
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Nouveau site
        </Link>
      </header>

      {mesSites.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <span
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white"
            aria-hidden
          >
            <Globe className="h-5 w-5" strokeWidth={2} />
          </span>
          <h2 className="mt-5 text-base font-semibold text-slate-900">
            Pas encore de site enregistré
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Créez votre premier site AxiSolver pour obtenir votre snippet
            d&apos;installation, configurer la base de connaissances et
            commencer à accueillir vos visiteurs.
          </p>
          <Link
            href="/dashboard/sites/nouveau"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Créer mon premier site
          </Link>
        </section>
      ) : (
        <ul className="space-y-3">
          {mesSites.map((s) => {
            const verifie = s.proprieteVerifieeLe !== null;
            return (
              <li key={s.id}>
                <Link
                  href={`/dashboard/sites/${s.slug}`}
                  className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <span
                    className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"
                    aria-hidden
                  >
                    <Globe className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {s.nomEntreprise}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      <span className="font-mono text-slate-700">
                        {s.domainePrincipal}
                      </span>{" "}
                      · plan {s.plan}
                    </p>
                  </div>
                  <span
                    className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider sm:inline-flex ${
                      verifie
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {verifie ? (
                      <>
                        <ShieldCheck className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                        Vérifié
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                        Non vérifié
                      </>
                    )}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 flex-shrink-0 text-slate-400"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
