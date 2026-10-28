import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";

import { BandeauActions } from "@/components/dashboard/bandeau-actions";
import { PanneauAccueil } from "@/components/dashboard/panneau-accueil";
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
      <ToggleConversation prenom={prenomCap} sites={sitesChantier} />

      <BandeauActions
        nbSites={mesSites.length}
        conversationsCeMois={agregats[0]?.total ?? 0}
      />

      <PanneauAccueil prenom={prenomCap} nbSites={mesSites.length} />
    </div>
  );
}

function formatterBucketMois(d: Date): string {
  const annee = d.getUTCFullYear();
  const mois = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${annee}-${mois}`;
}
