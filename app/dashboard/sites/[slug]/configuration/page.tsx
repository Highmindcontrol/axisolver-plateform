import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, siteConfigs } from "@/lib/db/schema";
import { FormulaireConfiguration } from "./formulaire";

export const dynamic = "force-dynamic";

export default async function PageConfigurationSite({
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
  if (!config) notFound();

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
          Configuration
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Paramétrer votre AxiSolver
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Nom de l&apos;assistant, ton, voix, langues, branding, domaines
          autorisés. Les changements s&apos;appliquent au prochain
          chargement du widget côté visiteur.
        </p>
      </header>

      <FormulaireConfiguration
        slug={slug}
        nomAssistant={config.nomAssistant}
        ton={config.ton}
        voixMode={config.voixMode}
        voixId={config.voixId ?? ""}
        langueDefaut={config.langueDefaut}
        languesActives={config.languesActives}
        couleurPrincipale={config.branding.couleurPrincipale}
        couleurSecondaire={config.branding.couleurSecondaire}
        afficherPropulsePar={config.branding.afficherPropulsePar}
        domainesAutorises={site.domainesAutorises}
      />
    </div>
  );
}
