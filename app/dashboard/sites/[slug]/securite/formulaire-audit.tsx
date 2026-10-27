"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, Shield } from "lucide-react";
import {
  lancerAuditSecurityAction,
  type EtatAuditSecurity,
} from "./actions";

const ETAT_INITIAL: EtatAuditSecurity = { erreur: null };

export function FormulaireAuditSecurity({ slug }: { slug: string }) {
  const [etat, action, pending] = useActionState(
    lancerAuditSecurityAction,
    ETAT_INITIAL,
  );

  return (
    <form action={action} className="flex items-start gap-4">
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Audit en cours…
          </>
        ) : (
          <>
            <Shield className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Lancer un audit sécurité
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
