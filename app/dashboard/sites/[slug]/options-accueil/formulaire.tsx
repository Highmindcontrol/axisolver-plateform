"use client";

import { useActionState, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import {
  sauverOptionsAction,
  chargerTemplateSecteurAction,
  type EtatOptions,
} from "./actions";

const ETAT_INITIAL: EtatOptions = { erreur: null };
const MAX_OPTIONS = 6;

export function FormulaireOptions({
  slug,
  secteur,
  optionsInitiales,
}: {
  slug: string;
  secteur: string | null;
  optionsInitiales: string[];
}) {
  const [options, setOptions] = useState<string[]>(
    optionsInitiales.length > 0 ? optionsInitiales : [""],
  );
  const [etat, action, pending] = useActionState(
    sauverOptionsAction,
    ETAT_INITIAL,
  );
  const [chargementTemplate, startTemplate] = useTransition();

  function majOption(i: number, valeur: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? valeur : o)));
  }
  function ajouter() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  }
  function supprimer(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }
  function deplacer(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= options.length) return;
    setOptions((prev) => {
      const copie = [...prev];
      [copie[i], copie[j]] = [copie[j], copie[i]];
      return copie;
    });
  }
  function chargerTemplate() {
    startTemplate(async () => {
      const res = await chargerTemplateSecteurAction(slug);
      if (res.libelles) setOptions(res.libelles.slice(0, MAX_OPTIONS));
    });
  }

  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
      <input type="hidden" name="slug" value={slug} />
      {options.map((libelle, i) => (
        <input
          key={`hidden-${i}`}
          type="hidden"
          name={`option_${i}`}
          value={libelle}
        />
      ))}

      <div className="space-y-3">
        {options.map((libelle, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <span className="mt-2.5 flex-shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              #{i + 1}
            </span>
            <input
              type="text"
              value={libelle}
              onChange={(e) => majOption(i, e.target.value)}
              placeholder="Je souhaite…"
              maxLength={200}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => deplacer(i, -1)}
                disabled={i === 0}
                aria-label="Monter"
                className="rounded p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => deplacer(i, 1)}
                disabled={i === options.length - 1}
                aria-label="Descendre"
                className="rounded p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => supprimer(i)}
                aria-label="Supprimer"
                className="rounded p-1.5 text-slate-500 hover:bg-rose-100 hover:text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={ajouter}
            disabled={options.length >= MAX_OPTIONS}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Ajouter une option
          </button>
          {secteur && (
            <button
              type="button"
              onClick={chargerTemplate}
              disabled={chargementTemplate}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
            >
              {chargementTemplate ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden
                />
              ) : (
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              )}
              Charger le template secteur
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {options.length} / {MAX_OPTIONS}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
        {etat.ok && (
          <div
            role="status"
            className="flex items-center gap-2 text-sm text-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
            Options enregistrées.
          </div>
        )}
        {etat.erreur && (
          <div
            role="alert"
            className="flex items-center gap-2 text-sm text-rose-700"
          >
            <AlertCircle className="h-4 w-4" strokeWidth={2.2} />
            {etat.erreur}
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              Enregistrer
            </>
          )}
        </button>
      </div>
    </form>
  );
}
