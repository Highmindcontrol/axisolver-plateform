"use client";

import { useActionState } from "react";
import { Loader2, Check, RotateCw } from "lucide-react";
import {
  renvoyerConfirmationAction,
  type EtatRenvoiConfirmation,
} from "../actions";

const ETAT_INITIAL: EtatRenvoiConfirmation = { erreur: null };

export function BoutonRenvoyer({ email }: { email: string }) {
  const [etat, action, pending] = useActionState(
    renvoyerConfirmationAction,
    ETAT_INITIAL,
  );

  if (etat.ok) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        <Check className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        <span>Email renvoyé. Vérifiez votre boîte dans quelques instants.</span>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Envoi en cours…
          </>
        ) : (
          <>
            <RotateCw className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Renvoyer le lien de confirmation
          </>
        )}
      </button>
      {etat.erreur && (
        <p className="mt-2 text-xs font-medium text-rose-600">
          {etat.erreur}
        </p>
      )}
    </form>
  );
}
