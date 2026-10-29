import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import {
  CATALOGUE_FOURNISSEURS,
  libelleCategorie,
  libelleMois,
  listerCoutsMois,
  moisCourant,
  moisPrecedent,
  moisSuivant,
  totalCoutsMois,
  totalParCategorie,
  type CategorieCoutFournisseur,
} from "@/lib/services/couts-fournisseurs";
import { estSuperAdmin } from "@/lib/services/super-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { TableSaisie } from "./table-saisie";

export const dynamic = "force-dynamic";

export default async function PageCouts({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const sp = await searchParams;
  const bucketMois =
    typeof sp.mois === "string" && /^\d{4}-\d{2}$/.test(sp.mois)
      ? sp.mois
      : moisCourant();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const peutModifier = await estSuperAdmin(user.id);

  const moisPrec = moisPrecedent(bucketMois);
  const moisSuiv = moisSuivant(bucketMois);

  const [lignes, totalCourant, totalPrecedent, parCategorie] =
    await Promise.all([
      listerCoutsMois(bucketMois),
      totalCoutsMois(bucketMois),
      totalCoutsMois(moisPrec),
      totalParCategorie(bucketMois),
    ]);

  const evolutionPct =
    totalPrecedent > 0
      ? Math.round(((totalCourant - totalPrecedent) / totalPrecedent) * 100)
      : null;
  const evolutionPositive = (evolutionPct ?? 0) > 0;

  const index = new Map<string, (typeof lignes)[number]>();
  for (const l of lignes) {
    index.set(`${l.fournisseur}|${l.categorie}`, l);
  }

  const lignesCatalogue = CATALOGUE_FOURNISSEURS.map((f) => {
    const existant = index.get(`${f.fournisseur}|${f.categorie}`);
    return {
      fournisseur: f.fournisseur,
      categorie: f.categorie,
      description: f.description,
      id: existant?.id ?? null,
      montantEurHt: existant?.montantEurHt ?? 0,
      notes: existant?.notes ?? null,
      majLe: existant?.majLe ?? null,
    };
  });

  const lignesHorsCatalogue = lignes.filter(
    (l) =>
      !CATALOGUE_FOURNISSEURS.some(
        (f) => f.fournisseur === l.fournisseur && f.categorie === l.categorie,
      ),
  );

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
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-700">
            Super-admin / Coûts fournisseurs
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Coûts fournisseurs mensuels
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Saisie manuelle des factures reçues chaque mois (ElevenLabs,
            OpenAI, Anthropic, Supabase, Vercel, Stripe, Brevo, Ahrefs,
            DataForSEO…). V2 : auto-remplissage via API quand disponible.
          </p>
        </div>
        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <DollarSign className="h-5 w-5" strokeWidth={2.2} />
        </span>
      </header>

      {/* ─── Sélecteur mois ─────────────────────────── */}
      <section className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Link
          href={`/dashboard/super-admin/couts?mois=${moisPrec}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
          {libelleMois(moisPrec)}
        </Link>
        <h2 className="text-lg font-bold capitalize text-slate-900">
          {libelleMois(bucketMois)}
        </h2>
        <Link
          href={`/dashboard/super-admin/couts?mois=${moisSuiv}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {libelleMois(moisSuiv)}
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </Link>
      </section>

      {/* ─── Total mensuel + comparatif ─────────────── */}
      <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-900 bg-slate-900 p-5 text-white shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-300">
            Total {libelleMois(bucketMois)}
          </p>
          <p className="mt-2 text-3xl font-bold">
            {totalCourant.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            € HT
          </p>
          {evolutionPct !== null && (
            <p
              className={`mt-2 inline-flex items-center gap-1 text-xs ${
                evolutionPositive ? "text-rose-300" : "text-emerald-300"
              }`}
            >
              {evolutionPositive ? (
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.4} />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
              {evolutionPositive ? "+" : ""}
              {evolutionPct} % vs mois précédent
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Mois précédent ({libelleMois(moisPrec)})
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {totalPrecedent.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            € HT
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Référence pour la comparaison
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Projection annuelle
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {(totalCourant * 12).toLocaleString("fr-FR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}{" "}
            € HT
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Si le mois reste stable
          </p>
        </div>
      </section>

      {/* ─── Répartition par catégorie ──────────────── */}
      {parCategorie.length > 0 && (
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Répartition par catégorie
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Décomposition du mois en cours
            </p>
          </header>
          <ul className="space-y-2">
            {parCategorie.map((pc) => {
              const pct =
                totalCourant > 0
                  ? Math.round((pc.total / totalCourant) * 100)
                  : 0;
              return (
                <li key={pc.categorie}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {libelleCategorie(pc.categorie)}
                    </span>
                    <span className="text-sm text-slate-900">
                      <strong>
                        {pc.total.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>{" "}
                      € ({pct} %)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={classesCategorie(pc.categorie)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ─── Table saisie ─────────────────────────── */}
      <TableSaisie
        bucketMois={bucketMois}
        lignesCatalogue={lignesCatalogue}
        lignesHorsCatalogue={lignesHorsCatalogue}
        peutModifier={peutModifier}
      />
    </div>
  );
}

function classesCategorie(cat: CategorieCoutFournisseur): string {
  const map: Record<CategorieCoutFournisseur, string> = {
    ia_llm: "h-full rounded-full bg-indigo-500",
    voix: "h-full rounded-full bg-violet-500",
    infra: "h-full rounded-full bg-sky-500",
    paiements: "h-full rounded-full bg-emerald-500",
    email: "h-full rounded-full bg-amber-500",
    seo: "h-full rounded-full bg-rose-500",
    outillage: "h-full rounded-full bg-slate-500",
    autre: "h-full rounded-full bg-slate-400",
  };
  return map[cat];
}
