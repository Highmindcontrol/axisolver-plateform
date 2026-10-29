"use client";

import { useActionState } from "react";
import {
  Check,
  Crown,
  Loader2,
  Mic,
  MessageSquare,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { FORMULES, type SlugPlan } from "@/lib/stripe/formules";
import { souscrirePlanAction, type EtatSouscription } from "@/app/tarifs/actions";

const INIT: EtatSouscription = { erreur: null };

type Famille = "text" | "premium" | "pack-web";

const FAMILLES: Array<{ id: Famille; label: string; icone: typeof Mic; description: string }> = [
  {
    id: "text",
    label: "Text Only",
    icone: MessageSquare,
    description: "Chat écrit, 6 missions AxiSolver incluses",
  },
  {
    id: "premium",
    label: "Premium",
    icone: Mic,
    description: "Avec voix ElevenLabs ultra-réaliste",
  },
  {
    id: "pack-web",
    label: "Pack Web Marketing",
    icone: Layers,
    description: "5 landing pages AxiLanding + AxiSolver Premium",
  },
];

/**
 * Grille des 6 formules avec bouton de souscription/upgrade.
 * Affiche le plan actuel différemment, met en avant la famille Premium
 * (phare), permet le changement de plan via Stripe Checkout.
 */
export function GrilleFormules({
  planActuel,
  utilisateurConnecte,
}: {
  planActuel: SlugPlan | null;
  utilisateurConnecte: boolean;
}) {
  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6 flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white"
          aria-hidden
        >
          <Layers className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Toutes les formules AxiSolver
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {planActuel
              ? "Change de formule à tout moment — Stripe gère le prorata automatiquement."
              : "Choisis une formule pour activer AxiSolver sur ton site."}
          </p>
        </div>
      </header>

      <div className="space-y-8">
        {FAMILLES.map((famille) => {
          const plans = (Object.values(FORMULES) as (typeof FORMULES)[SlugPlan][])
            .filter((f) => f.slug.startsWith(famille.id))
            .sort((a, b) => a.prixMensuelHt - b.prixMensuelHt);
          const Icone = famille.icone;
          return (
            <div key={famille.id}>
              <header className="mb-3 flex items-center gap-2">
                <Icone
                  className="h-4 w-4 text-slate-600"
                  strokeWidth={2.2}
                  aria-hidden
                />
                <h3 className="text-sm font-semibold text-slate-900">
                  {famille.label}
                </h3>
                <span className="text-xs text-slate-500">
                  — {famille.description}
                </span>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {plans.map((plan) => (
                  <CarteFormule
                    key={plan.slug}
                    plan={plan}
                    planActuel={planActuel}
                    utilisateurConnecte={utilisateurConnecte}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CarteFormule({
  plan,
  planActuel,
  utilisateurConnecte,
}: {
  plan: (typeof FORMULES)[SlugPlan];
  planActuel: SlugPlan | null;
  utilisateurConnecte: boolean;
}) {
  const estActuel = planActuel === plan.slug;
  const prixActuel = planActuel ? FORMULES[planActuel].prixMensuelHt : 0;
  const estSuperieur = plan.prixMensuelHt > prixActuel && !estActuel;
  const estInferieur = planActuel && plan.prixMensuelHt < prixActuel;

  const libelleCta = estActuel
    ? "Votre plan actuel"
    : estSuperieur
      ? "Passer à ce plan"
      : estInferieur
        ? "Redescendre à ce plan"
        : plan.cta;

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 ${
        estActuel
          ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-200"
          : plan.phare
            ? "border-violet-300 bg-gradient-to-br from-violet-50/60 to-indigo-50/60"
            : "border-slate-200 bg-white"
      }`}
    >
      {plan.phare && !estActuel && (
        <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          <Crown className="h-3 w-3" strokeWidth={2.4} />
          Phare
        </span>
      )}
      {estActuel && (
        <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          <Check className="h-3 w-3" strokeWidth={2.4} />
          Actuel
        </span>
      )}

      <h4 className="text-sm font-bold text-slate-900">{plan.nom}</h4>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        {plan.description}
      </p>

      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-slate-900">
          {plan.prixMensuelHt}
        </span>
        <span className="text-sm text-slate-500">€ HT / mois</span>
      </p>

      <ul className="mt-4 flex-1 space-y-1.5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
            <Check
              className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-600"
              strokeWidth={2.4}
            />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <FormulaireChoix
          slug={plan.slug}
          libelle={libelleCta}
          variante={
            estActuel ? "actuel" : plan.phare ? "phare" : "standard"
          }
          utilisateurConnecte={utilisateurConnecte}
        />
      </div>
    </div>
  );
}

function FormulaireChoix({
  slug,
  libelle,
  variante,
  utilisateurConnecte,
}: {
  slug: SlugPlan;
  libelle: string;
  variante: "actuel" | "phare" | "standard";
  utilisateurConnecte: boolean;
}) {
  const [etat, action, pending] = useActionState(souscrirePlanAction, INIT);

  if (variante === "actuel") {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700"
      >
        {libelle}
      </button>
    );
  }

  const classeBtn =
    variante === "phare"
      ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:brightness-110"
      : "bg-slate-900 text-white hover:brightness-110";

  return (
    <form action={action} className="space-y-1.5">
      <input type="hidden" name="plan" value={slug} />
      <button
        type="submit"
        disabled={pending || !utilisateurConnecte}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${classeBtn}`}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
            Redirection…
          </>
        ) : (
          <>
            {libelle}
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
          </>
        )}
      </button>
      {etat.erreur && (
        <p className="text-[11px] text-rose-700">{etat.erreur}</p>
      )}
    </form>
  );
}
