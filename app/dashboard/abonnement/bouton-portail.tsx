"use client";

import { useActionState } from "react";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { ouvrirPortailStripeAction, type EtatPortail } from "./actions";

const ETAT_INITIAL: EtatPortail = { erreur: null };

export function BoutonPortailStripe() {
  const [etat, action, pending] = useActionState(
    ouvrirPortailStripeAction,
    ETAT_INITIAL,
  );

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Redirection…
          </>
        ) : (
          <>
            <ExternalLink className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Gérer mon abonnement (Stripe)
          </>
        )}
      </button>
      {etat.erreur && (
        <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-rose-700">
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
            strokeWidth={2.2}
          />
          {etat.erreur}
        </p>
      )}
    </form>
  );
}
