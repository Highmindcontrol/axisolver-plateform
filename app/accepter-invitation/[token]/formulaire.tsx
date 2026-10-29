"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";

import {
  accepterInvitationAction,
  type EtatAcceptation,
} from "./actions";

const ETAT_INITIAL: EtatAcceptation = { erreur: null };

export function FormulaireAcceptation({
  token,
  email,
  prenomInitial,
  nomInitial,
}: {
  token: string;
  email: string;
  prenomInitial: string;
  nomInitial: string;
}) {
  const [etat, action, pending] = useActionState(
    accepterInvitationAction,
    ETAT_INITIAL,
  );
  const [prenom, setPrenom] = useState(prenomInitial);
  const [nom, setNom] = useState(nomInitial);
  const [motDePasse, setMotDePasse] = useState("");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor="acc-prenom"
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            Prénom
          </label>
          <input
            id="acc-prenom"
            name="prenom"
            type="text"
            maxLength={60}
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Marc"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label
            htmlFor="acc-nom"
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            Nom
          </label>
          <input
            id="acc-nom"
            name="nom"
            type="text"
            maxLength={60}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Dupont"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Adresse email
        </label>
        <input
          type="email"
          value={email}
          readOnly
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500 shadow-sm"
        />
      </div>

      <div>
        <label
          htmlFor="acc-mdp"
          className="mb-1 block text-xs font-medium text-slate-500"
        >
          Mot de passe <span className="text-rose-600">*</span>
        </label>
        <input
          id="acc-mdp"
          name="motDePasse"
          type="password"
          required
          minLength={8}
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder="8 caractères minimum"
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <p className="mt-1.5 text-[11px] text-slate-500">
          Si vous avez déjà un compte AxiSolver avec cette adresse,
          saisissez votre mot de passe habituel.
        </p>
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

      <button
        type="submit"
        disabled={pending || !motDePasse || motDePasse.length < 8}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Création en cours…
          </>
        ) : (
          "Accepter l'invitation et rejoindre"
        )}
      </button>
    </form>
  );
}
