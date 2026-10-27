"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { ChampMotDePasse } from "@/components/auth/champ-mot-de-passe";
import { connexionAction, type EtatConnexion } from "../actions";

const ETAT_INITIAL: EtatConnexion = { erreur: null };

export default function PageConnexion() {
  const [etat, action, pending] = useActionState(connexionAction, ETAT_INITIAL);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
        <p className="mt-1 text-sm text-slate-600">
          Accédez à votre dashboard AxiSolver.
        </p>
      </header>

      <OAuthButtons />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          ou
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={action} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-slate-900"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <ChampMotDePasse />

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
          {pending ? "Connexion…" : "Se connecter"}
        </button>

        <div className="flex items-center justify-between text-xs text-slate-600">
          <Link
            href="/mot-de-passe-oublie"
            className="font-medium text-indigo-700 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
          <Link
            href="/inscription"
            className="font-medium text-indigo-700 hover:underline"
          >
            Créer un compte
          </Link>
        </div>
      </form>
    </section>
  );
}
