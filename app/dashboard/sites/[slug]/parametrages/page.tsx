import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Code,
  LayoutGrid,
  ListChecks,
  Monitor,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  sites,
  siteConfigs,
  siteOptionsAccueil,
  siteConnaissanceSources,
} from "@/lib/db/schema";
import { getArchetype } from "@/lib/axi-solver/archetypes-layout";

export const dynamic = "force-dynamic";

/**
 * /dashboard/sites/[slug]/parametrages — centre de contrôle statique.
 *
 * Regroupe les 5 cartes de paramétrage du site (vérif propriété,
 * options d'accueil, installation, configuration, base de
 * connaissances) + un aperçu live du widget tel que le voient
 * les visiteurs via iframe vers /embed/[slug].
 */
export default async function PageParametrages({
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
    .where(eq(siteOptionsAccueil.siteId, site.id));

  const sources = await db
    .select()
    .from(siteConnaissanceSources)
    .where(eq(siteConnaissanceSources.siteId, site.id));

  const propVerifiee = site.proprieteVerifieeLe !== null;
  const archetype =
    getArchetype(config?.branding?.archetypeLayout) ?? getArchetype("classique");

  const cartes: Array<{
    titre: string;
    corps: string;
    href: string;
    icone: typeof Settings;
    badge?: { libelle: string; ton: "ok" | "attention" };
  }> = [
    {
      titre: "Vérification de propriété",
      corps: propVerifiee
        ? `Vérifié via la méthode ${site.proprieteMethode}.`
        : "Prouvez que le domaine vous appartient avant les actions externes.",
      href: `/dashboard/sites/${slug}/propriete`,
      icone: propVerifiee ? ShieldCheck : AlertTriangle,
      badge: propVerifiee
        ? { libelle: "Vérifié", ton: "ok" }
        : { libelle: "À faire", ton: "attention" },
    },
    {
      titre: "Options d'accueil",
      corps: `${options.length} option·s active·s dans l'ailette gauche du widget.`,
      href: `/dashboard/sites/${slug}/options-accueil`,
      icone: ListChecks,
    },
    {
      titre: "Installation",
      corps: "Récupérez votre snippet copier-coller et les instructions CMS.",
      href: `/dashboard/installation`,
      icone: Code,
    },
    {
      titre: "Configuration",
      corps: `Assistant « ${config?.nomAssistant ?? "AXI"} », secteur ${config?.secteur ?? "généraliste"}, ${config?.languesActives.length ?? 1} langue·s.`,
      href: `/dashboard/sites/${slug}/configuration`,
      icone: Settings,
    },
    {
      titre: "Base de connaissances",
      corps: `${sources.length} source·s ingérée·s (URL, sitemap, PDF).`,
      href: `/dashboard/sites/${slug}/base-connaissances`,
      icone: BookOpen,
    },
    {
      titre: "Mise en page du widget",
      corps: `Archétype actuel : ${archetype?.nom ?? "Classique"}. Adaptez les ailettes au métier de votre site.`,
      href: `/dashboard/sites/${slug}/parametrages/mise-en-page`,
      icone: LayoutGrid,
    },
  ];

  return (
    <div className="flex-1 px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Paramétrages
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {site.nomEntreprise}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-mono text-slate-700">
            {site.domainePrincipal}
          </span>{" "}
          · Centre de contrôle du site. Configurez tout ce qui touche
          à AXI et vérifiez l&apos;interface telle que vos visiteurs la
          verront.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Paramètres
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cartes.map((c) => {
            const Icone = c.icone;
            const tonBadge =
              c.badge?.ton === "ok"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-900";
            return (
              <Link
                key={c.titre}
                href={c.href}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"
                    aria-hidden
                  >
                    <Icone className="h-5 w-5" strokeWidth={2} />
                  </span>
                  {c.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tonBadge}`}
                    >
                      {c.badge.libelle}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {c.titre}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {c.corps}
                  </p>
                </div>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-700 group-hover:underline">
                  Ouvrir
                  <ChevronRight
                    className="h-3 w-3"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Aperçu visiteur
        </h2>
        <p className="mb-4 flex items-center gap-2 text-sm text-slate-600">
          <Monitor className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          Voici votre interface telle que vos visiteurs la verront en
          direct sur votre site.
        </p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full bg-rose-400"
            />
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full bg-amber-400"
            />
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full bg-emerald-400"
            />
            <span className="ml-3 truncate text-[11px] text-slate-500">
              {site.domainePrincipal}
            </span>
          </div>
          <iframe
            src={`/embed/${slug}`}
            title={`Aperçu AXI pour ${site.nomEntreprise}`}
            className="h-[600px] w-full border-0"
          />
        </div>
      </section>
    </div>
  );
}
