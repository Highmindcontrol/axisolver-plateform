import {
  BarChart3,
  Crown,
  DollarSign,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { lireProfilPlateforme } from "@/lib/services/super-admin";

/**
 * Accueil back-office super-admin AxiSolver.
 *
 * Dashboard de navigation : vue d'ensemble des capacités disponibles
 * et liens vers les sous-pages (métriques, utilisateurs, coûts, export
 * Forteresse). Les métriques réelles arrivent au Lot 2.
 */
export const dynamic = "force-dynamic";

export default async function PageSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profil = user ? await lireProfilPlateforme(user.id) : null;

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white">
            <Crown className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-700">
              Back-office Ataraxis Group
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Super-admin AxiSolver
            </h1>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm text-slate-600">
          Vue d&apos;ensemble du site AxiSolver (clients, abonnements,
          coûts, santé système) et point de rapatriement des données
          vers la Forteresse Ataraxis qui centralise tous les sites du
          groupe. Ces écrans ne sont visibles que pour les rôles
          plateforme : <strong>super_admin</strong>,{" "}
          <strong>admin_plateforme</strong>, <strong>contributeur</strong>.
        </p>
        {profil && (
          <p className="mt-2 text-xs text-slate-500">
            Connecté en tant que <strong>{profil.role}</strong>
            {profil.notes ? ` — ${profil.notes}` : ""}
          </p>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CarteCapacite
          href="/dashboard/super-admin/metriques"
          icone={BarChart3}
          titre="Métriques globales"
          description="Clients, abonnements par formule, MRR, conversations/mois, répartition des plans."
          statut="À venir — Lot 2"
          couleur="indigo"
        />
        <CarteCapacite
          href="/dashboard/super-admin/utilisateurs"
          icone={Users}
          titre="Gestion utilisateurs"
          description="Lister tous les utilisateurs, promouvoir admin ou contributeur, suspendre un compte."
          statut="À venir — Lot 3"
          couleur="emerald"
        />
        <CarteCapacite
          href="/dashboard/super-admin/couts"
          icone={DollarSign}
          titre="Coûts fournisseurs"
          description="ElevenLabs, OpenAI, Anthropic, Supabase, Vercel, Stripe, Brevo, Ahrefs, DataForSEO. Saisie mensuelle + évolution."
          statut="À venir — Lot 4"
          couleur="amber"
        />
        <CarteCapacite
          href="/dashboard/super-admin/sante"
          icone={Zap}
          titre="Santé du système"
          description="Taux d&apos;erreur, latences API, quotas atteints, interventions AXI en attente, incidents sécurité ouverts."
          statut="À venir"
          couleur="rose"
        />
        <CarteCapacite
          href="/dashboard/super-admin/forteresse"
          icone={Shield}
          titre="Export Forteresse"
          description="Tokens API et payload JSON consommé par la Forteresse Ataraxis (centralisation groupe)."
          statut="À venir — Lot 5"
          couleur="violet"
        />
      </section>
    </div>
  );
}

function CarteCapacite({
  href,
  icone: Icone,
  titre,
  description,
  statut,
  couleur,
}: {
  href: string;
  icone: typeof BarChart3;
  titre: string;
  description: string;
  statut: string;
  couleur: "indigo" | "emerald" | "amber" | "rose" | "violet";
}) {
  const classesCouleur: Record<typeof couleur, string> = {
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${classesCouleur[couleur]}`}
        aria-hidden
      >
        <Icone className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-900">
        {titre}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        {description}
      </p>
      <span className="mt-4 inline-flex self-start rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {statut}
      </span>
    </Link>
  );
}
