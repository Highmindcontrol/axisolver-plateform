"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { ChampMotDePasse } from "@/components/auth/champ-mot-de-passe";
import {
  reinitialiserMotDePasseAction,
  type EtatReinitialisation,
} from "../actions";

const ETAT_INITIAL: EtatReinitialisation = { erreur: null };

export default function PageReinitialiser() {
  const [etat, action, pending] = useActionState(
    reinitialiserMotDePasseAction,
    ETAT_INITIAL,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Choisissez un nouveau mot de passe (8 caractères minimum).
        </p>
      </header>

      <form action={action} className="space-y-4" noValidate>
        <ChampMotDePasse
          id="motDePasse"
          label="Nouveau mot de passe"
          autoComplete="new-password"
        />
        <ChampMotDePasse
          id="confirmation"
          name="confirmation"
          label="Confirmation"
          autoComplete="new-password"
        />

        {etat.erreur && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={2} />
            <span>{etat.erreur}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Mise à jour…" : "Mettre à jour"}
        </button>
      </form>
    </section>
  );
}
