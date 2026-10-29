import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";

import { BandeauActions } from "@/components/dashboard/bandeau-actions";
import { HeaderSites } from "@/components/dashboard/header-sites";
import { ToggleConversation } from "@/components/dashboard/toggle-conversation";
import { afficherPrenom } from "@/lib/auth/afficher-prenom";
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
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!siteActif) notFound();

  const mesSites = await db
    .select({
      id: sites.id,
      slug: sites.slug,
      nomEntreprise: sites.nomEntreprise,
      nomSite: sites.nomSite,
      domainePrincipal: sites.domainePrincipal,
      proprieteVerifieeLe: sites.proprieteVerifieeLe,
      branding: siteConfigs.branding,
    })
    .from(sites)
    .leftJoin(siteConfigs, eq(siteConfigs.siteId, sites.id))
    .where(await filtreSitesAccessibles(user.id))
    .orderBy(sites.creeLe);

  // Comptage conversations : optionnel (tolère l'absence de la table
  // usage_conversations tant que les migrations 0012+ ne sont pas
  // appliquées en prod).
  const compteParSite = new Map<string, number>();
  try {
    const bucketMois = formatterBucketMois(new Date());
    const conversationsParSite = await db
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
    for (const r of conversationsParSite) {
      compteParSite.set(r.siteId, r.total);
    }
  } catch {
    // Table pas encore créée en prod — on affiche 0 conversation.
  }

  const sitesHeader = mesSites.map((s) => ({
    slug: s.slug,
    nomEntreprise: s.nomSite ?? s.nomEntreprise,
    couleur: s.branding?.couleurPrincipale ?? "#4f46e5",
    picto: s.branding?.picto ?? "globe",
  }));

  const siteActifBranding = mesSites.find((s) => s.slug === slug)?.branding;
  const couleurSiteActif =
    siteActifBranding?.couleurPrincipale ?? "#4f46e5";

  const sitesChantier = mesSites.map((s) => ({
    slug: s.slug,
    nomEntreprise: s.nomSite ?? s.nomEntreprise,
    domainePrincipal: s.domainePrincipal,
    verifie: s.proprieteVerifieeLe !== null,
    conversationsMois: compteParSite.get(s.id) ?? 0,
  }));

  const prenomCap = afficherPrenom(user);

  return (
    <div className="flex flex-col">
      <HeaderSites prenom={prenomCap} sites={sitesHeader} />
      <ToggleConversation prenom={prenomCap} sites={sitesChantier} />
      <BandeauActions siteSlug={slug} couleurSite={couleurSiteActif} />
      <div className="flex-1">{children}</div>
    </div>
  );
}

function formatterBucketMois(d: Date): string {
  const annee = d.getUTCFullYear();
  const mois = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${annee}-${mois}`;
}
