import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ChevronLeft, LayoutGrid } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, siteConfigs } from "@/lib/db/schema";
import {
  CATALOGUE_ARCHETYPES,
  type ArchetypeLayoutSlug,
} from "@/lib/axi-solver/archetypes-layout";

import { SelecteurArchetype } from "./selecteur";

export const dynamic = "force-dynamic";

const SLUGS_ARCHETYPES = CATALOGUE_ARCHETYPES.map((a) => a.slug);

export default async function PageMiseEnPage({
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
    .select({
      id: sites.id,
      nomEntreprise: sites.nomEntreprise,
      domainePrincipal: sites.domainePrincipal,
    })
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) notFound();

  const [config] = await db
    .select({ branding: siteConfigs.branding })
    .from(siteConfigs)
    .where(eq(siteConfigs.siteId, site.id))
    .limit(1);

  const branding = config?.branding;
  const couleurSite = branding?.couleurPrincipale ?? "#4f46e5";
  const archetypeBrut = branding?.archetypeLayout ?? "classique";
  const archetypeActuel: ArchetypeLayoutSlug = (SLUGS_ARCHETYPES as string[]).includes(
    archetypeBrut,
  )
    ? (archetypeBrut as ArchetypeLayoutSlug)
    : "classique";

  return (
    <div className="flex-1 px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-8">
        <Link
          href={`/dashboard/sites/${slug}/parametrages`}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
          Retour aux paramétrages
        </Link>
        <div className="mt-4 flex items-start gap-3">
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white"
            aria-hidden
          >
            <LayoutGrid className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Mise en page du widget
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Choisissez l&apos;archétype qui correspond au métier de votre
              site. Il définit la structure des deux ailettes autour du
              chat central. Le chat lui-même ne change pas — seules les
              ailettes s&apos;adaptent.
            </p>
          </div>
        </div>
      </header>

      <SelecteurArchetype
        slug={slug}
        archetypeActuel={archetypeActuel}
        couleurSite={couleurSite}
      />
    </div>
  );
}
