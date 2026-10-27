"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import {
  verifierProprieteAction,
  type EtatVerification,
} from "./actions";

const ETAT_INITIAL: EtatVerification = { erreur: null };

export function BoutonVerifier({ slug }: { slug: string }) {
  const [etat, action, pending] = useActionState(
    verifierProprieteAction,
    ETAT_INITIAL,
  );

  if (etat.succes) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700"
            strokeWidth={2}
          />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Vérification réussie via la méthode {etat.succes.methode} !
            </p>
            <p className="mt-1 text-xs text-emerald-800">
              Les actions externes sont désormais autorisées. Vous pouvez
              retourner au dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Vérification en cours (DNS + HTTP)…
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Vérifier maintenant
          </>
        )}
      </button>

      {etat.erreur && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={2} />
          <div>
            <p className="font-medium">{etat.erreur}</p>
            {etat.erreurs && etat.erreurs.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs">
                {etat.erreurs.map((e, i) => (
                  <li key={i}>· {e}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
