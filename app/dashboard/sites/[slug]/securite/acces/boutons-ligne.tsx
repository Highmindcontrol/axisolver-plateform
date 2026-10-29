"use client";

import { useActionState } from "react";
import { Loader2, PlayCircle, Trash2 } from "lucide-react";
import {
  supprimerAccesAction,
  testerAccesExistantAction,
  type EtatSuppressionAcces,
  type EtatTestConnexion,
} from "./actions";

const INIT_SUPPR: EtatSuppressionAcces = { erreur: null, succes: false };
const INIT_TEST: EtatTestConnexion = { erreur: null, succes: false };

export function BoutonTesterAcces({
  slug,
  accesId,
}: {
  slug: string;
  accesId: string;
}) {
  const [_etat, action, pending] = useActionState(
    testerAccesExistantAction,
    INIT_TEST,
  );
  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="accesId" value={accesId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <PlayCircle className="h-3 w-3" strokeWidth={2.4} />
        )}
        Tester
      </button>
    </form>
  );
}

export function BoutonSupprimerAcces({
  slug,
  accesId,
}: {
  slug: string;
  accesId: string;
}) {
  const [_etat, action, pending] = useActionState(
    supprimerAccesAction,
    INIT_SUPPR,
  );
  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="accesId" value={accesId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-medium text-rose-700 shadow-sm hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" strokeWidth={2.4} />
        )}
        Supprimer
      </button>
    </form>
  );
}
