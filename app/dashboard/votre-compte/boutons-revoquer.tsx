"use client";

import { Loader2, Trash2, X } from "lucide-react";
import { useActionState } from "react";

import {
  revoquerInvitationAction,
  revoquerMembreAction,
  type EtatRevocation,
} from "./admins-actions";

const ETAT_INITIAL: EtatRevocation = { erreur: null, succes: false };

export function BoutonRevoquerInvitation({
  invitationId,
}: {
  invitationId: string;
}) {
  const [etat, action, pending] = useActionState(
    revoquerInvitationAction,
    ETAT_INITIAL,
  );
  return (
    <form action={action}>
      <input type="hidden" name="invitationId" value={invitationId} />
      <button
        type="submit"
        disabled={pending}
        title={etat.erreur ?? "Révoquer cette invitation"}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
        )}
        Révoquer
      </button>
    </form>
  );
}

export function BoutonRetirerMembre({ userIdCible }: { userIdCible: string }) {
  const [etat, action, pending] = useActionState(
    revoquerMembreAction,
    ETAT_INITIAL,
  );
  return (
    <form action={action}>
      <input type="hidden" name="userIdCible" value={userIdCible} />
      <button
        type="submit"
        disabled={pending}
        title={etat.erreur ?? "Retirer cet administrateur"}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="h-3 w-3" strokeWidth={2.2} aria-hidden />
        )}
        Retirer
      </button>
    </form>
  );
}
