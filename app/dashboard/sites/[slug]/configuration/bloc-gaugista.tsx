"use client";

import {
  AlertCircle,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { enregistrerGaugistaAction, type EtatGaugista } from "./actions";

const INIT: EtatGaugista = { erreur: null };

/**
 * Section « Notation Gaugista » de la page configuration du site.
 *
 * Permet à l'admin d'activer la notation fin de conversation visiteur
 * et de brancher le site AxiSolver sur une entreprise Gaugista
 * existante. Le POST réel vers gaugista.com se fait via le proxy
 * serveur /api/widget/[slug]/notation — la clé API Gaugista est
 * posée côté Vercel (GAUGISTA_API_KEY) et jamais exposée au visiteur.
 */
export function BlocGaugista({
  slug,
  gaugistaSlug,
  gaugistaActif,
}: {
  slug: string;
  gaugistaSlug: string | null;
  gaugistaActif: boolean;
}) {
  const [etat, action, pending] = useActionState(
    enregistrerGaugistaAction,
    INIT,
  );
  const [slugLocal, setSlugLocal] = useState(gaugistaSlug ?? "");
  const [actifLocal, setActifLocal] = useState(gaugistaActif);

  // Resynchronise le state local avec les props quand elles changent
  // (après revalidatePath côté serveur), sinon le checkbox garde son
  // ancienne valeur affichée et donne l'impression que l'enregistrement
  // n'a pas pris.
  useEffect(() => {
    setActifLocal(gaugistaActif);
  }, [gaugistaActif]);
  useEffect(() => {
    setSlugLocal(gaugistaSlug ?? "");
  }, [gaugistaSlug]);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-5 flex items-center gap-3">
        <span
          aria-hidden
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-white"
        >
          <Sparkles className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Notation Gaugista fin de conversation
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            À la clôture d&apos;une conversation visiteur, propose un
            module Gaugista (4 jauges : Utile, Claire, Rapide,
            Recommanderait) pour recueillir un score de satisfaction
            nuancé. Le score alimente le rapport quotidien de ce site.
          </p>
        </div>
      </header>

      <form action={action} className="space-y-5">
        <input type="hidden" name="slug" value={slug} />

        <div>
          <label
            htmlFor="gaugistaSlug"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Slug de l&apos;entreprise sur Gaugista
          </label>
          <input
            id="gaugistaSlug"
            name="gaugistaSlug"
            type="text"
            value={slugLocal}
            onChange={(e) => setSlugLocal(e.target.value)}
            placeholder="ex: axisolver-demo"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Lettres minuscules, chiffres, tirets uniquement. Doit
            correspondre à une entreprise créée sur{" "}
            <a
              href="https://gaugista.com/admin/entreprises"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-indigo-700 hover:underline"
            >
              gaugista.com/admin/entreprises
              <ExternalLink className="h-3 w-3" strokeWidth={2.2} />
            </a>
            {" "}avec un formulaire actif contenant les 4 jauges{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
              utile
            </code>
            ,{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
              claire
            </code>
            ,{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
              rapide
            </code>
            ,{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
              recommanderait
            </code>
            .
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="gaugistaActif"
            checked={actifLocal}
            onChange={(e) => setActifLocal(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <span className="text-sm font-medium text-slate-900">
              Activer la notation sur ce site
            </span>
            <p className="mt-0.5 text-xs text-slate-500">
              Un bouton « Terminer » apparaîtra dans l&apos;entête du
              widget. Clic → modal de notation 4 jauges. Désactivable à
              tout moment sans perdre l&apos;historique côté Gaugista.
            </p>
          </div>
        </label>

        {!actifLocal && gaugistaSlug && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
            Slug renseigné mais notation désactivée — le widget
            n&apos;affichera pas le bouton Terminer tant que la case
            n&apos;est pas cochée.
          </div>
        )}

        {etat.erreur && (
          <div className="inline-flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
            <AlertCircle
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
              strokeWidth={2.2}
              aria-hidden
            />
            {etat.erreur}
          </div>
        )}

        {etat.ok && (
          <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
            Configuration Gaugista enregistrée.
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  strokeWidth={2.4}
                />
                Enregistrement…
              </>
            ) : (
              "Enregistrer la configuration Gaugista"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
