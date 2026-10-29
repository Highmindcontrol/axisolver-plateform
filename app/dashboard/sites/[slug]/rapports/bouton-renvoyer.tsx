"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import {
  renvoyerRapportMaintenantAction,
  type EtatEnvoiManuel,
} from "./actions";

const ETAT_INITIAL: EtatEnvoiManuel = { erreur: null };

export function BoutonRenvoyerRapport({ slug }: { slug: string }) {
  const [etat, action, pending] = useActionState(
    renvoyerRapportMaintenantAction,
    ETAT_INITIAL,
  );

  return (
    <form action={action} className="flex-shrink-0">
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Envoi…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Envoyer un test maintenant
          </>
        )}
      </button>
      {etat.ok && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.2} />
          Envoyé à {etat.destinataire} — archivé dans l&apos;historique
        </p>
      )}
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
