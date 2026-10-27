import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import {
  Settings,
  ShieldCheck,
  AlertTriangle,
  Code,
  BookOpen,
  MessageSquare,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  sites,
  siteConfigs,
  siteOptionsAccueil,
  siteConnaissanceSources,
} from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function PageSiteOverview({
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

  const cartes: Array<{
    titre: string;
    corps: string;
    href: string;
    icone: typeof Settings;
    badge?: { libelle: string; ton: "ok" | "attention" | "info" };
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
      titre: "Options d'accueil",
      corps: `${options.length} option·s active·s dans l'ailette gauche du widget.`,
      href: `/dashboard/sites/${slug}/options-accueil`,
      icone: ListChecks,
    },
    {
      titre: "Base de connaissances",
      corps: `${sources.length} source·s ingérée·s (URL, sitemap, PDF).`,
      href: `/dashboard/sites/${slug}/base-connaissances`,
      icone: BookOpen,
    },
    {
      titre: "Tickets & conversations",
      corps: "Journal des échanges visiteurs (bientôt).",
      href: `/dashboard/sites/${slug}/tickets`,
      icone: MessageSquare,
      badge: { libelle: "LOT E.7", ton: "info" },
    },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-14">
      <header className="mb-10">
        <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          {site.slug}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          {site.nomEntreprise}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-mono text-slate-900">
            {site.domainePrincipal}
          </span>{" "}
          · plan <strong>{site.plan}</strong>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {cartes.map((c) => {
          const Icone = c.icone;
          const tonBadge =
            c.badge?.ton === "ok"
              ? "bg-emerald-100 text-emerald-800"
              : c.badge?.ton === "attention"
                ? "bg-amber-100 text-amber-900"
                : "bg-slate-100 text-slate-600";
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
                <h2 className="text-sm font-semibold text-slate-900">
                  {c.titre}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {c.corps}
                </p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-700 group-hover:underline">
                Ouvrir
                <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
