"use client";

import { useActionState } from "react";
import { Check, Loader2, X } from "lucide-react";
import {
  approuverInterventionAction,
  refuserInterventionAction,
  type EtatValidation,
} from "./actions";

const INIT: EtatValidation = { erreur: null, succes: false };

export function BoutonApprouver({
  slug,
  interventionId,
}: {
  slug: string;
  interventionId: string;
}) {
  const [etat, action, pending] = useActionState(
    approuverInterventionAction,
    INIT,
  );
  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="interventionId" value={interventionId} />
      <button
        type="submit"
        disabled={pending || etat.succes}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.4} />
        ) : (
          <Check className="h-3 w-3" strokeWidth={2.4} />
        )}
        Approuver
      </button>
    </form>
  );
}

export function BoutonRefuser({
  slug,
  interventionId,
}: {
  slug: string;
  interventionId: string;
}) {
  const [_etat, action, pending] = useActionState(
    refuserInterventionAction,
    INIT,
  );
  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="interventionId" value={interventionId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.4} />
        ) : (
          <X className="h-3 w-3" strokeWidth={2.4} />
        )}
        Refuser
      </button>
    </form>
  );
}
