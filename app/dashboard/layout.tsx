import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Layout dashboard — protège toutes les routes /dashboard/*.
 *
 * Si l'utilisateur n'est pas authentifié, redirige vers /connexion.
 * Fournit la nav minimale + un bouton déconnexion. Sera enrichi au
 * LOT E avec la vraie structure dashboard (sites, config, tickets).
 */
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-6 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-slate-900"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 text-xs font-bold text-white">
              A
            </span>
            AxiSolver
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {user.email}
            </span>
            <form action="/api/auth/deconnexion" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
