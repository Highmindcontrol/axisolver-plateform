import { redirect } from "next/navigation";
import { CreditCard, Check, AlertCircle, Clock } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FORMULES } from "@/lib/stripe/formules";
import {
  consommationMois,
  etatAbonnement,
} from "@/lib/stripe/verifier-quotas";
import { BoutonPortailStripe } from "./bouton-portail";
import { GrilleFormules } from "./grille-formules";
import { SectionPacksSupplementaires } from "./section-packs-supp";

export const dynamic = "force-dynamic";

export default async function PageAbonnement() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const abonnement = await etatAbonnement(user.id);
  const consommation = await consommationMois({
    userId: user.id,
    workspaceId: abonnement.workspaceId,
  });

  const formule = abonnement.plan ? FORMULES[abonnement.plan] : null;
  const limiteConv =
    (formule?.nbConversationsMoisMax ?? 50) + abonnement.bonusConversations;
  const tauxConv = Math.min(
    100,
    Math.round((consommation.nbConversations / limiteConv) * 100),
  );

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Facturation & abonnement
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Mon abonnement AxiSolver
        </h1>
      </header>

      {abonnement.actif && formule ? (
        <section className="mb-8 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-8">
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
                Plan actuel
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {formule.nom}
              </h2>
              <p className="mt-1 text-sm text-slate-700">
                {formule.prixMensuelHt} € / mois HT
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                abonnement.essaiActif
                  ? "border-amber-300 bg-amber-100 text-amber-800"
                  : "border-emerald-300 bg-emerald-100 text-emerald-800"
              }`}
            >
              <Check className="h-3 w-3" strokeWidth={2.5} />
              {abonnement.essaiActif ? "Essai actif" : "Actif"}
            </span>
          </header>

          {abonnement.periodeFinLe && (
            <p className="mb-4 inline-flex items-center gap-2 text-xs text-slate-700">
              <Clock className="h-3.5 w-3.5" strokeWidth={2} />
              {abonnement.essaiActif
                ? `Essai jusqu'au ${new Date(abonnement.periodeFinLe).toLocaleDateString("fr-FR")}`
                : `Prochaine facture le ${new Date(abonnement.periodeFinLe).toLocaleDateString("fr-FR")}`}
            </p>
          )}

          <BoutonPortailStripe />
        </section>
      ) : (
        <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <header className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-amber-900">
                Aucun abonnement actif
              </h2>
              <p className="mt-0.5 text-xs text-amber-700">
                Tu es en mode découverte, limité à 50 conversations par
                mois tous sites confondus. Choisis une formule ci-dessous
                pour activer AxiSolver sur ton site.
              </p>
            </div>
          </header>
        </section>
      )}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <CreditCard className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Consommation du mois (
              {new Date(`${consommation.bucketMois}-01`).toLocaleDateString(
                "fr-FR",
                { month: "long", year: "numeric" },
              )}
              )
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Compteur global tous sites confondus
            </p>
          </div>
        </header>

        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="text-sm font-medium text-slate-700">
                Conversations
              </p>
              <p className="text-sm text-slate-900">
                <strong>{consommation.nbConversations}</strong> /{" "}
                {limiteConv.toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  tauxConv >= 90
                    ? "bg-rose-500"
                    : tauxConv >= 70
                      ? "bg-amber-500"
                      : "bg-indigo-500"
                }`}
                style={{ width: `${tauxConv}%` }}
              />
            </div>
            {tauxConv >= 80 && (
              <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-rose-700">
                <AlertCircle
                  className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                  strokeWidth={2.2}
                />
                Vous approchez du quota mensuel. Passez à un plan supérieur
                pour éviter la coupure du widget.
              </p>
            )}
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">
              Messages échangés
            </p>
            <p className="text-sm text-slate-900">
              <strong>
                {consommation.nbMessages.toLocaleString("fr-FR")}
              </strong>{" "}
              messages visiteur traités ce mois-ci
            </p>
          </div>
        </div>
      </section>

      <SectionPacksSupplementaires planActuel={abonnement.plan ?? null} />

      <GrilleFormules
        planActuel={abonnement.plan ?? null}
        utilisateurConnecte={true}
      />
    </div>
  );
}
