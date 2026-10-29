import { Plus, PackagePlus, Clock } from "lucide-react";
import { FORMULES, type SlugPlan } from "@/lib/stripe/formules";

/**
 * Section « Packs supplémentaires de conversations ».
 * V1 : UI explicative + redirection vers le portail Stripe pour l'achat.
 * V2 (différée task #221) : achat one-shot direct depuis AxiSolver avec
 * report automatique du solde non consommé sur 3 mois.
 */
export function SectionPacksSupplementaires({
  planActuel,
}: {
  planActuel: SlugPlan | null;
}) {
  const formule = planActuel ? FORMULES[planActuel] : null;
  if (!formule) return null;

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-5 flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
          aria-hidden
        >
          <PackagePlus className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Packs supplémentaires de conversations
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Besoin de plus de conversations avant la fin du mois ? Achète un
            pack de {formule.volumeConvPackSupp} conversations à{" "}
            {formule.prixPackSuppHt} € HT, utilisable immédiatement.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="flex items-center gap-2">
            <Plus
              className="h-4 w-4 text-slate-600"
              strokeWidth={2.4}
              aria-hidden
            />
            <h3 className="text-sm font-semibold text-slate-900">
              Pack {formule.volumeConvPackSupp} conversations
            </h3>
          </div>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {formule.prixPackSuppHt}
            </span>
            <span className="text-sm text-slate-500">€ HT</span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Achat ponctuel. Le solde non consommé est reportable sur les 3
            mois suivants. Bascule le compteur global de ton abonnement.
          </p>
          <button
            type="button"
            disabled
            className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-500"
          >
            <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
            Bientôt disponible
          </button>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Alternative : passer au palier supérieur
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-700">
            Si tu dépasses régulièrement ton quota, il peut être plus
            rentable de passer au plan 500 conversations plutôt que
            d&apos;acheter des packs supplémentaires au fil de l&apos;eau.
            Le prorata Stripe s&apos;applique automatiquement, pas de
            double facturation.
          </p>
          <p className="mt-3 text-[11px] text-slate-500">
            Choisis le plan supérieur dans la section « Toutes les formules »
            ci-dessous.
          </p>
        </div>
      </div>
    </section>
  );
}
