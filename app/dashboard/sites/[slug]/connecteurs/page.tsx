import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";

import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listerConnexions } from "@/lib/services/composio/connexions";
import {
  CATALOGUE_CONNECTEURS,
  LIBELLES_CATEGORIES,
  type CategorieConnecteur,
} from "@/lib/services/composio/catalogue";

import { ListeConnecteurs } from "./liste-connecteurs";

export const dynamic = "force-dynamic";

export default async function PageConnecteurs({
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

  const connexions = await listerConnexions(user.id, site.id);
  const connexionsParSlug = new Map(
    connexions
      .filter((c) => c.oauthStatus === "active" || c.oauthStatus === "pending")
      .map((c) => [c.connectorSlug, c]),
  );

  // Regroupement par catégorie
  const categories = Array.from(
    new Set(CATALOGUE_CONNECTEURS.map((c) => c.categorie)),
  ) as CategorieConnecteur[];

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
          Connecteurs
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Branchez AXI à vos outils
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Chaque conversation qualifiée dans votre widget peut créer
          directement un lead dans votre CRM, ouvrir un ticket dans votre
          support, ou prendre un rendez-vous dans l&apos;agenda du
          commercial. Choisissez les outils à connecter — AXI s&apos;occupe
          du reste.
        </p>
      </header>

      {categories.map((cat) => {
        const items = CATALOGUE_CONNECTEURS.filter(
          (c) => c.categorie === cat && c.disponible,
        );
        if (items.length === 0) return null;
        return (
          <section key={cat} className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {LIBELLES_CATEGORIES[cat]}
            </h2>
            <ListeConnecteurs
              siteSlug={slug}
              connecteurs={items}
              connexionsExistantes={items.map((it) => {
                const c = connexionsParSlug.get(it.slug);
                return c
                  ? {
                      connectorSlug: it.slug,
                      connexionId: c.id,
                      status: c.oauthStatus,
                      connecteLe: c.connecteLe?.toISOString() ?? null,
                    }
                  : null;
              })}
            />
          </section>
        );
      })}
    </div>
  );
}
