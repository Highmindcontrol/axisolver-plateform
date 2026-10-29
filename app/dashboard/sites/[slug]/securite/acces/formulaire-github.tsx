"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";
import {
  ajouterAccesGithubAction,
  type EtatAjoutAcces,
} from "./actions";

const ETAT_INITIAL: EtatAjoutAcces = { erreur: null, succes: false };

export function FormulaireGithub({ slug }: { slug: string }) {
  const [etat, action, pending] = useActionState(
    ajouterAccesGithubAction,
    ETAT_INITIAL,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          label="Libellé (ex. « Repo Coryphea »)"
          nom="libelle"
          placeholder="Mon repo site Next.js"
          obligatoire
        />
        <Champ
          label="Propriétaire GitHub"
          nom="proprietaire"
          placeholder="Highmindcontrol"
          autoComplete="username"
          obligatoire
        />
        <Champ
          label="Nom du repo"
          nom="repo"
          placeholder="coryphea"
          obligatoire
        />
        <Champ
          label="Branche cible"
          nom="branche"
          defaultValue="main"
          placeholder="main"
          obligatoire
        />
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-700">
          Mode de commit <span className="text-rose-600">*</span>
        </span>
        <select
          name="modeCommit"
          defaultValue="push_direct"
          required
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="push_direct">
            Push direct sur la branche (plus rapide, pas de validation Git)
          </option>
          <option value="pull_request">
            Créer une Pull Request (recommandé si équipe)
          </option>
        </select>
      </label>

      <Champ
        label="Personal Access Token (fine-grained, scope repo)"
        nom="personalAccessToken"
        type="password"
        placeholder="github_pat_xxx…"
        autoComplete="new-password"
        obligatoire
      />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Vérification du token…
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            Vérifier et enregistrer
          </>
        )}
      </button>

      {etat.erreur && (
        <p className="flex items-start gap-1.5 text-sm text-rose-700">
          <AlertCircle
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            strokeWidth={2.2}
          />
          {etat.erreur}
        </p>
      )}
      {etat.succes && etat.message && (
        <p className="flex items-start gap-1.5 text-sm text-emerald-700">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            strokeWidth={2.2}
          />
          {etat.message}
        </p>
      )}
    </form>
  );
}

function Champ({
  label,
  nom,
  type = "text",
  placeholder,
  autoComplete,
  defaultValue,
  obligatoire,
}: {
  label: string;
  nom: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
  obligatoire?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-700">
        {label}
        {obligatoire && <span className="text-rose-600"> *</span>}
      </span>
      <input
        type={type}
        name={nom}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={obligatoire}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </label>
  );
}
