import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";

import { BandeauActions } from "@/components/dashboard/bandeau-actions";
import { BandePouls } from "@/components/dashboard/bande-pouls";
import { ToggleConversation } from "@/components/dashboard/toggle-conversation";
import { db } from "@/lib/db";
import { sites, usageConversations } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PageDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const bucketMois = formatterBucketMois(new Date());

  const [mesSites, agregats, conversationsParSite] = await Promise.all([
    db
      .select({
        id: sites.id,
        slug: sites.slug,
        nomEntreprise: sites.nomEntreprise,
        domainePrincipal: sites.domainePrincipal,
        proprieteVerifieeLe: sites.proprieteVerifieeLe,
      })
      .from(sites)
      .where(eq(sites.ownerUserId, user.id))
      .orderBy(sites.creeLe),
    db
      .select({
        total: sql<number>`coalesce(sum(${usageConversations.nbConversations}), 0)::int`,
      })
      .from(usageConversations)
      .where(
        and(
          eq(usageConversations.userId, user.id),
          eq(usageConversations.bucketMois, bucketMois),
        ),
      ),
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
      <div className="relative flex flex-col overflow-hidden">
        <BackdropFondu />
        <div className="relative z-10 flex flex-col">
          <BandePouls titreConversation={null} siteFocus={null} />
          <div className="flex flex-col gap-4 px-6 py-10 md:px-14 lg:px-16">
            <ToggleConversation prenom={prenomCap} sites={sitesChantier} />
          </div>
        </div>
      </div>

      <BandeauActions
        nbSites={mesSites.length}
        conversationsCeMois={agregats[0]?.total ?? 0}
      />
    </div>
  );
}

function BackdropFondu() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50" />
      <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-violet-300/25 blur-3xl" />
    </div>
  );
}

function formatterBucketMois(d: Date): string {
  const annee = d.getUTCFullYear();
  const mois = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${annee}-${mois}`;
}
