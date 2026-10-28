import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { FORMULES, type SlugPlan } from "@/lib/stripe/formules";
import { BoutonSouscrire } from "./bouton-souscrire";

export const dynamic = "force-static";

export default function PageTarifs() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 py-16">
      <header className="mb-12 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Tarifs AxiSolver
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          Un assistant IA sur votre site en moins de 5 minutes
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-600">
          Tous les plans incluent la base de connaissances, les rapports
          quotidiens, les audits SEO/Shield/Ads et le Shield widget.
          Essai gratuit 14 jours sans carte bancaire sur les 3 formules.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {(Object.keys(FORMULES) as SlugPlan[]).map((slug) => {
          const f = FORMULES[slug];
          const estPro = slug === "premium-s";
          return (
            <div
              key={slug}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                estPro
                  ? "border-indigo-500 shadow-indigo-100"
                  : "border-slate-200"
              }`}
            >
              {estPro && (
                <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-md">
                  <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                  Recommandé
                </span>
              )}

              <h2 className="text-lg font-semibold text-slate-900">
                {f.nom}
              </h2>
              <p className="mt-1 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">
                {f.description}
              </p>

              <div className="my-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  {f.prixMensuelHt}
                </span>
                <span className="text-sm text-slate-500">€ / mois HT</span>
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {f.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600"
                      strokeWidth={2.4}
                    />
                    {feat}
                  </li>
                ))}
              </ul>

              <BoutonSouscrire
                plan={slug}
                cta={f.cta}
                variant={estPro ? "primaire" : "secondaire"}
              />
              {f.essaiJours > 0 && (
                <p className="mt-2 text-center text-[11px] text-slate-500">
                  Sans carte bancaire · annulable à tout moment
                </p>
              )}
            </div>
          );
        })}
      </div>

      <section className="mt-16 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          Besoin d&apos;un plan sur-mesure, white label ou multi-marques ?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Pour les groupes, agences avec plus de 10 sites ou intégrations
          particulières, l&apos;équipe Ataraxis construit un contrat
          dédié.
        </p>
        <Link
          href="mailto:contact@ataraxis.group?subject=AxiSolver%20Enterprise"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Nous contacter
        </Link>
      </section>
    </div>
  );
}
