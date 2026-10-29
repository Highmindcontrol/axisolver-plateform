"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";

import { modifierProfilAction, type EtatProfil } from "./actions";

const ETAT_INITIAL: EtatProfil = { erreur: null, succes: false };

export function FormulaireProfil({
  prenomInitial,
  nomInitial,
  telephoneInitial,
}: {
  prenomInitial: string;
  nomInitial: string;
  telephoneInitial: string;
}) {
  const [etat, action, pending] = useActionState(
    modifierProfilAction,
    ETAT_INITIAL,
  );
  const [prenom, setPrenom] = useState(prenomInitial);
  const [nom, setNom] = useState(nomInitial);
  const [telephone, setTelephone] = useState(telephoneInitial);

  const modifie =
    prenom.trim() !== prenomInitial.trim() ||
    nom.trim() !== nomInitial.trim() ||
    telephone.trim() !== telephoneInitial.trim();

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="prenom"
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            Prénom
          </label>
          <input
            id="prenom"
            name="prenom"
            type="text"
            maxLength={60}
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="François"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label
            htmlFor="nom"
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            Nom
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            maxLength={60}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Lemoing"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="telephone"
          className="mb-1 block text-xs font-medium text-slate-500"
        >
          Téléphone (optionnel)
        </label>
        <input
          id="telephone"
          name="telephone"
          type="tel"
          maxLength={32}
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          placeholder="+33 6 12 34 56 78"
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 md:w-1/2"
        />
      </div>

      {etat.erreur && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            strokeWidth={2}
            aria-hidden
          />
          <span>{etat.erreur}</span>
        </div>
      )}

      {etat.succes && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          <CheckCircle2
            className="h-4 w-4 flex-shrink-0"
            strokeWidth={2.2}
            aria-hidden
          />
          Profil enregistré.
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={!modifie || pending}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            "Enregistrer"
          )}
        </button>
      </div>
    </form>
  );
}
