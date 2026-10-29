"use client";

import { useActionState } from "react";
import { Loader2, Play, CheckCircle2, AlertCircle } from "lucide-react";
import {
  declencherRemediationAction,
  type EtatDeclencherRemediation,
} from "./actions";

const INIT: EtatDeclencherRemediation = { erreur: null, succes: false };

/**
 * Bouton « Déclencher la remédiation » affiché sur chaque reco qui
 * est prise en charge par AXI Security Shield.
 */
export function BoutonDeclencherRemediation({
  slug,
  findingCode,
  auditId,
}: {
  slug: string;
  findingCode: string;
  auditId?: string;
}) {
  const [etat, action, pending] = useActionState(
    declencherRemediationAction,
    INIT,
  );

  return (
    <form action={action} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="findingCode" value={findingCode} />
      {auditId && <input type="hidden" name="auditId" value={auditId} />}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.4} />
            Exécution…
          </>
        ) : etat.succes ? (
          <>
            <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
            Appliqué
          </>
        ) : (
          <>
            <Play className="h-3 w-3" strokeWidth={2.4} />
            Déclencher la remédiation
          </>
        )}
      </button>
      {etat.succes && etat.journal && (
        <p className="text-[10px] text-emerald-200">{etat.journal}</p>
      )}
      {etat.erreur && (
        <p className="inline-flex items-start gap-1 text-[10px] text-rose-200">
          <AlertCircle className="mt-0.5 h-3 w-3" strokeWidth={2.4} />
          {etat.erreur}
        </p>
      )}
    </form>
  );
}
