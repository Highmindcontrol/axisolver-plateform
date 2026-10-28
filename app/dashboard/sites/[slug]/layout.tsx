import { notFound, redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";

import { BandeauActions } from "@/components/dashboard/bandeau-actions";
import { HeaderSites } from "@/components/dashboard/header-sites";
import { ToggleConversation } from "@/components/dashboard/toggle-conversation";
import { db } from "@/lib/db";
import { siteConfigs, sites, usageConversations } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Layout partagé pour toutes les routes /dashboard/sites/[slug]/*.
 *
 * Injecte : HeaderSites (switcher sites + prénom) + ToggleConversation
 * (chat AXI replié) + BandeauActions (capacités AXI du site) au-dessus
 * du contenu propre à chaque sous-page.
 */
export default async function LayoutSite({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [siteActif] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, user.id)))
    .limit(1);
  if (!siteActif) notFound();

  const bucketMois = formatterBucketMois(new Date());

  const [mesSites, conversationsParSite] = await Promise.all([
    db
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
      .where(eq(sites.ownerUserId, user.id))
      .orderBy(sites.creeLe),
    db
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
      .groupBy(usageConversations.siteId),
  ]);

  const compteParSite = new Map<string, number>();
  for (const r of conversationsParSite) {
    compteParSite.set(r.siteId, r.total);
  }

  const sitesHeader = mesSites.map((s) => ({
    slug: s.slug,
    nomEntreprise: s.nomEntreprise,
    couleur: s.branding?.couleurPrincipale ?? "#4f46e5",
  }));

  const sitesChantier = mesSites.map((s) => ({
    slug: s.slug,
    nomEntreprise: s.nomEntreprise,
    domainePrincipal: s.domainePrincipal,
    verifie: s.proprieteVerifieeLe !== null,
    conversationsMois: compteParSite.get(s.id) ?? 0,
  }));

  const prenom = user.email?.split("@")[0] ?? null;
  const prenomCap = prenom
    ? prenom.charAt(0).toUpperCase() + prenom.slice(1)
    : null;

  return (
    <div className="flex flex-col">
      <HeaderSites prenom={prenomCap} sites={sitesHeader} />
      <ToggleConversation prenom={prenomCap} sites={sitesChantier} />
      <BandeauActions siteSlug={slug} />
      <div className="flex-1">{children}</div>
    </div>
  );
}

function formatterBucketMois(d: Date): string {
  const annee = d.getUTCFullYear();
  const mois = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${annee}-${mois}`;
}
