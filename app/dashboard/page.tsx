import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Plus, Sparkles } from "lucide-react";

import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * /dashboard — redirection intelligente.
 *
 * - Au moins 1 site → redirect vers /dashboard/sites/[premier-slug].
 * - 0 site → page de bienvenue invitant à créer le premier site.
 *
 * AxiSolver est intrinsèquement scopé à un site, il n'y a donc pas
 * de « vue générale » pertinente. Le switcher du header assure la
 * navigation entre sites.
 */
export default async function PageDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [premierSite] = await db
    .select({ slug: sites.slug })
    .from(sites)
    .where(eq(sites.ownerUserId, user.id))
    .orderBy(sites.creeLe)
    .limit(1);

  if (premierSite) {
    redirect(`/dashboard/sites/${premierSite.slug}`);
  }

  // Page d'accueil « 0 site ».
  const prenom = user.email?.split("@")[0] ?? null;
  const prenomCap = prenom
    ? prenom.charAt(0).toUpperCase() + prenom.slice(1)
    : null;

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
