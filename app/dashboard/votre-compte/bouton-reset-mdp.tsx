"use client";

import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useActionState } from "react";

import {
  envoyerEmailResetMotDePasseAction,
  type EtatResetMdp,
} from "./actions";

const ETAT_INITIAL: EtatResetMdp = { erreur: null, succes: false };

export function BoutonResetMdp({ email }: { email: string }) {
  const [etat, action, pending] = useActionState(
    envoyerEmailResetMotDePasseAction,
    ETAT_INITIAL,
  );

  return (
    <form action={action} className="space-y-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-500 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Envoi en cours…
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Recevoir un email de changement
          </>
        )}
      </button>

      {etat.erreur && (
        <p
          role="alert"
          className="inline-flex items-start gap-1.5 text-xs text-rose-700"
        >
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
            strokeWidth={2.2}
          />
          {etat.erreur}
        </p>
      )}

      {etat.succes && (
        <p
          role="status"
          className="inline-flex items-start gap-1.5 text-xs text-emerald-700"
        >
          <CheckCircle2
            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
            strokeWidth={2.2}
          />
          Email envoyé à <strong className="font-semibold">{email}</strong>.
          Vérifiez votre boîte (et vos spams).
        </p>
      )}
    </form>
  );
}
