"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  resoudreIncidentAction,
  type EtatResolutionIncident,
} from "./actions";

const ETAT_INITIAL: EtatResolutionIncident = { erreur: null };

export function BoutonResoudreIncident({
  incidentId,
  slug,
}: {
  incidentId: string;
  slug: string;
}) {
  const [etat, action, pending] = useActionState(
    resoudreIncidentAction,
    ETAT_INITIAL,
  );

  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="incidentId" value={incidentId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending || etat.ok}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden />
        )}
        Marquer résolu
      </button>
    </form>
  );
}
