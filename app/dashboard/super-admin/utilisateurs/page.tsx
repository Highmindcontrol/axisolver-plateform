import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

import {
  estSuperAdmin,
  listerUtilisateurs,
} from "@/lib/services/super-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TableUtilisateurs } from "./table-utilisateurs";
import { ChampRecherche } from "./champ-recherche";

export const dynamic = "force-dynamic";

export default async function PageUtilisateurs({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const recherche = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const monRoleSuperAdmin = await estSuperAdmin(user.id);
  const { liste, total } = await listerUtilisateurs({
    recherche,
    limit,
    offset,
  });

  const nbPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <Link
        href="/dashboard/super-admin"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
        Retour au back-office
      </Link>

      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-700">
            Super-admin / Utilisateurs
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Gestion des utilisateurs
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Lister les {total.toLocaleString("fr-FR")} comptes AxiSolver,
            attribuer un rôle plateforme (super_admin / admin_plateforme /
            contributeur) ou retirer un rôle existant. Impossible de
            rétrograder ou de retirer le dernier super_admin.
          </p>
        </div>
        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Users className="h-5 w-5" strokeWidth={2.2} />
        </span>
      </header>

      <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <ChampRecherche valeurInitiale={recherche} />
        <p className="text-xs text-slate-500">
          Page {page} / {nbPages} — {liste.length} affiché
          {liste.length > 1 ? "s" : ""} sur {total}
        </p>
      </section>

      <TableUtilisateurs
        utilisateurs={liste}
        monUserId={user.id}
        peutModifier={monRoleSuperAdmin}
      />

      {nbPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: nbPages }, (_, i) => i + 1).map((p) => {
            const url = `/dashboard/super-admin/utilisateurs?page=${p}${
              recherche ? `&q=${encodeURIComponent(recherche)}` : ""
            }`;
            return (
              <Link
                key={p}
                href={url}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  p === page
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
