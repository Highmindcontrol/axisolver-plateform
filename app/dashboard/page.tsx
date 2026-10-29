import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, eq, sql } from "drizzle-orm";
import { ArrowRight, Compass, Plus, Shield, Sparkles } from "lucide-react";

import { HeaderSites } from "@/components/dashboard/header-sites";
import { ToggleConversation } from "@/components/dashboard/toggle-conversation";
import { afficherPrenom } from "@/lib/auth/afficher-prenom";
import { IconeSite } from "@/lib/ui/sites-apparence";
import { db } from "@/lib/db";
import { siteConfigs, sites, usageConversations } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * /dashboard — vraie page d'accueil, aucun site sélectionné.
 *
 * Affiche :
 *   · HeaderSites (switcher, aucun actif) + ToggleConversation.
 *   · Bloc Bienvenue + Guide AXI (5 bonnes pratiques).
 *   · Récapitulatif par site : statut + activité du mois en cours.
 *
 * Pas de bandeau d'actions (base de connaissances, SEO…) — ces
 * capacités sont contextuelles à un site. L'utilisateur choisit le
 * site qu'il veut piloter via le switcher ou les cartes récap.
 */
export default async function PageDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const mesSites = await db
    .select({
      id: sites.id,
      slug: sites.slug,
      nomEntreprise: sites.nomEntreprise,
      domainePrincipal: sites.domainePrincipal,
      proprieteVerifieeLe: sites.proprieteVerifieeLe,
      branding: siteConfigs.branding,
    })
    .from(sites)
    .leftJoin(siteConfigs, eq(siteConfigs.siteId, sites.id))
    .where(await filtreSitesAccessibles(user.id))
    .orderBy(sites.creeLe);

  // Nombre de conversations ce mois par site (lecture tolérante).
  const conversationsParSite = new Map<string, number>();
  try {
    const bucketMois = formatterBucketMois(new Date());
    const rows = await db
      .select({
        siteId: usageConversations.siteId,
        total: sql<number>`coalesce(sum(${usageConversations.nbConversations}), 0)::int`,
      })
      .from(usageConversations)
      .where(
        and(
          eq(usageConversations.userId, user.id),
          eq(usageConversations.bucketMois, bucketMois),
        ),
      )
      .groupBy(usageConversations.siteId);
    for (const r of rows) {
      conversationsParSite.set(r.siteId, r.total);
    }
  } catch {
    // Table pas encore créée en prod, on affichera 0 partout.
  }

  const sitesHeader = mesSites.map((s) => ({
    slug: s.slug,
    nomEntreprise: s.nomEntreprise,
    couleur: s.branding?.couleurPrincipale ?? "#4f46e5",
    picto: s.branding?.picto ?? "globe",
  }));

  const sitesChantier = mesSites.map((s) => ({
    slug: s.slug,
    nomEntreprise: s.nomEntreprise,
    domainePrincipal: s.domainePrincipal,
    verifie: s.proprieteVerifieeLe !== null,
    conversationsMois: conversationsParSite.get(s.id) ?? 0,
  }));

  const prenomCap = afficherPrenom(user);

  // Cas « 0 site » → hero d'onboarding, pas de switcher.
  if (mesSites.length === 0) {
    return <HeroZeroSite prenomCap={prenomCap} />;
  }

  return (
    <div className="flex flex-col">
      <HeaderSites prenom={prenomCap} sites={sitesHeader} />
      <ToggleConversation prenom={prenomCap} sites={sitesChantier} />

      <div className="flex-1 bg-slate-50 px-6 py-10 md:px-14 lg:px-16">
        <div className="space-y-10">
          <SectionGuide />
          <SectionRecap
            sites={mesSites.map((s) => ({
              slug: s.slug,
              nomEntreprise: s.nomEntreprise,
              domainePrincipal: s.domainePrincipal,
              verifie: s.proprieteVerifieeLe !== null,
              couleur: s.branding?.couleurPrincipale ?? "#4f46e5",
              picto: s.branding?.picto ?? "globe",
              conversationsMois: conversationsParSite.get(s.id) ?? 0,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function SectionGuide() {
  return (
    <section>
      <Link
        href="/dashboard/guide"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm transition-colors hover:border-indigo-400 hover:bg-indigo-50"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow"
            aria-hidden
          >
            <Compass className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Guide d&apos;AXI
            </h2>
            <p className="text-xs text-slate-600">
              Les fondamentaux, le workflow type, les 5 capacités d&apos;AXI
              par site et les bonnes pratiques issues du terrain.
            </p>
          </div>
        </div>
        <ArrowRight
          className="h-5 w-5 flex-shrink-0 text-indigo-600 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.2}
          aria-hidden
        />
      </Link>
    </section>
  );
}

type RecapSite = {
  slug: string;
  nomEntreprise: string;
  domainePrincipal: string;
  verifie: boolean;
  couleur: string;
  picto: string;
  conversationsMois: number;
};

function SectionRecap({ sites }: { sites: RecapSite[] }) {
  return (
    <section>
      <header className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Vos sites
        </h2>
        <p className="text-xs text-slate-500">
          Cliquez sur un site pour en prendre le pilotage. AXI
          consignera ici au fil des jours ce qui s&apos;est passé sur
          chacun (conversations visiteurs, audits, incidents, actions
          AXI).
        </p>
      </header>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/dashboard/sites/${s.slug}`}
              className="group flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow"
                  style={{ backgroundColor: s.couleur }}
                  aria-hidden
                >
                  <IconeSite valeur={s.picto} tailleClass="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {s.nomEntreprise}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {s.domainePrincipal}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                    s.verifie
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  <Shield className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                  {s.verifie ? "Propriété vérifiée" : "À vérifier"}
                </span>
                <span className="text-slate-500">
                  {s.conversationsMois} conv. ce mois
                </span>
              </div>

              <p className="mt-auto text-xs italic text-slate-500">
                Journal d&apos;activité du site à venir.
              </p>
            </Link>
          </li>
        ))}

        <li>
          <Link
            href="/dashboard/sites/nouveau"
            className="flex h-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-sm font-medium text-slate-500 transition-colors hover:border-indigo-400 hover:bg-white hover:text-indigo-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Ajouter un site
          </Link>
        </li>
      </ul>
    </section>
  );
}

function HeroZeroSite({ prenomCap }: { prenomCap: string | null }) {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center md:px-14">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50" />
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-violet-300/25 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-xl">
        <span
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/30"
          aria-hidden
        >
          <Sparkles className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
          Bienvenue{prenomCap ? ` ${prenomCap}` : ""}.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Pour démarrer, enregistrez votre premier site. Vous pourrez
          en gérer jusqu&apos;à trois depuis cette interface, avec des
          crédits de conversation partagés entre tous.
        </p>
        <Link
          href="/dashboard/sites/nouveau"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Créer mon premier site
        </Link>
      </div>
    </div>
  );
}

function formatterBucketMois(d: Date): string {
  const annee = d.getUTCFullYear();
  const mois = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${annee}-${mois}`;
}
