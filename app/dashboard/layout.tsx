import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";

import { SidebarDashboard } from "@/components/dashboard/sidebar-dashboard";
import { db } from "@/lib/db";
import { siteConfigs, sites, stripeSubscriptions } from "@/lib/db/schema";
import { aAccesSuperAdmin } from "@/lib/services/super-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Layout dashboard AxiSolver (back-office client).
 *
 * Structure calquée sur AxiHub : sidebar permanente à gauche (packs
 * d'intelligence + sites), header fin en haut, zone centrale fluide
 * qui héberge le chat AXI permanent et les onglets contextuels.
 */
export const dynamic = "force-dynamic";

type Plan =
  | "text-s"
  | "text-l"
  | "premium-s"
  | "premium-l"
  | "pack-web-s"
  | "pack-web-l";

export default async function LayoutDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const mesSitesRaw = await db
    .select({
      slug: sites.slug,
      nomEntreprise: sites.nomEntreprise,
      nomSite: sites.nomSite,
      domainePrincipal: sites.domainePrincipal,
      branding: siteConfigs.branding,
    })
    .from(sites)
    .leftJoin(siteConfigs, eq(siteConfigs.siteId, sites.id))
    .where(await filtreSitesAccessibles(user.id))
    .orderBy(sites.creeLe);

  const mesSites = mesSitesRaw.map((s) => ({
    slug: s.slug,
    nomEntreprise: s.nomSite ?? s.nomEntreprise,
    domainePrincipal: s.domainePrincipal,
    couleur: s.branding?.couleurPrincipale ?? "#4f46e5",
    picto: s.branding?.picto ?? "globe",
  }));

  // Lecture de l'abonnement Stripe : optionnelle (tolère l'absence
  // de la table stripe_subscriptions tant que les migrations
  // 0012+ ne sont pas appliquées en prod).
  let plan: Plan | null = null;
  try {
    const [subscription] = await db
      .select({ plan: stripeSubscriptions.plan })
      .from(stripeSubscriptions)
      .where(eq(stripeSubscriptions.userId, user.id))
      .orderBy(desc(stripeSubscriptions.creeLe))
      .limit(1);
    plan = (subscription?.plan ?? null) as Plan | null;
  } catch {
    plan = null;
  }

  const estSuperAdminOuAdmin = await aAccesSuperAdmin(user.id);

  return (
    <div className="relative flex min-h-screen bg-slate-50 text-slate-900">
      <SidebarDashboard
        sites={mesSites}
        plan={plan}
        userEmail={user.email ?? ""}
        estSuperAdmin={estSuperAdminOuAdmin}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50">
          <div className="relative z-10 flex flex-1 flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
}
