import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  sites,
  siteConfigs,
  siteOptionsAccueil,
} from "@/lib/db/schema";
import { FormulaireOptions } from "./formulaire";

export const dynamic = "force-dynamic";

export default async function PageOptionsAccueilSite({
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

  const [config] = await db
    .select()
    .from(siteConfigs)
    .where(eq(siteConfigs.siteId, site.id))
    .limit(1);

  const options = await db
    .select()
    .from(siteOptionsAccueil)
    .where(eq(siteOptionsAccueil.siteId, site.id))
    .orderBy(siteOptionsAccueil.ordre);

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-10">
        <Link
          href={`/dashboard/sites/${slug}`}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Retour à {site.nomSite ?? site.nomEntreprise}
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Options d&apos;accueil
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Phrases cliquables de l&apos;ailette gauche
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Jusqu&apos;à 6 phrases que vos visiteurs peuvent cliquer pour
          démarrer la conversation. Chaque clic envoie la phrase à AxiSolver
          comme si elle avait été tapée.
        </p>
      </header>

      <FormulaireOptions
        slug={slug}
        secteur={config?.secteur ?? null}
        optionsInitiales={options.map((o) => o.libelle)}
      />
    </div>
  );
}
