"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  motDePasseOublieAction,
  type EtatMotDePasseOublie,
} from "../actions";

const ETAT_INITIAL: EtatMotDePasseOublie = { erreur: null };

export default function PageMotDePasseOublie() {
  const [etat, action, pending] = useActionState(
    motDePasseOublieAction,
    ETAT_INITIAL,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Mot de passe oublié
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Entrez votre email, nous vous envoyons un lien de réinitialisation.
        </p>
      </header>

      {etat.ok ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 flex-shrink-0"
            strokeWidth={2}
          />
          <p>
            Si un compte existe avec cette adresse, vous recevrez un email
            dans les prochaines minutes avec le lien pour redéfinir votre
            mot de passe.
          </p>
        </div>
      ) : (
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
            {pending ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-slate-600">
        <Link
          href="/connexion"
          className="font-medium text-indigo-700 hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </section>
  );
}
