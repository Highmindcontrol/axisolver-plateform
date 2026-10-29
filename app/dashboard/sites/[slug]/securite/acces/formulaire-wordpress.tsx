"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";
import {
  ajouterAccesWordpressAction,
  type EtatAjoutAcces,
} from "./actions";

const ETAT_INITIAL: EtatAjoutAcces = { erreur: null, succes: false };

export function FormulaireWordpress({ slug }: { slug: string }) {
  const [etat, action, pending] = useActionState(
    ajouterAccesWordpressAction,
    ETAT_INITIAL,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          label="Libellé (ex. « WP de prod »)"
          nom="libelle"
          placeholder="Mon site WordPress"
          obligatoire
        />
        <Champ
          label="URL du site"
          nom="urlSite"
          type="url"
          placeholder="https://www.monsite.fr"
          obligatoire
        />
        <Champ
          label="Nom d'utilisateur WordPress"
          nom="user"
          placeholder="admin"
          autoComplete="username"
          obligatoire
        />
        <Champ
          label="Mot de passe applicatif"
          nom="applicationPassword"
          type="password"
          placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
          autoComplete="new-password"
          obligatoire
        />
      </div>

      <p className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 text-xs leading-relaxed text-indigo-900">
        <strong>Comment créer un mot de passe applicatif :</strong>{" "}
        Dans WordPress, va dans <strong>Utilisateurs → Profil</strong>,
        descends à la section <em>« Mots de passe d&apos;application »</em>,
        donne un nom (ex. « AXI Security Shield ») puis clique
        <em> Ajouter un nouveau mot de passe d&apos;application</em>. Copie
        la chaîne générée et colle-la ci-dessus. Ce mot de passe est
        indépendant de ton mot de passe principal et révocable à tout
        moment.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Test de connexion…
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            Tester et enregistrer
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
  obligatoire,
}: {
  label: string;
  nom: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
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
        required={obligatoire}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </label>
  );
}
