"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { souscrirePlanAction, type EtatSouscription } from "./actions";

const ETAT_INITIAL: EtatSouscription = { erreur: null };

export function BoutonSouscrire({
  plan,
  cta,
  variant = "primaire",
}: {
  plan: "starter" | "pro" | "business";
  cta: string;
  variant?: "primaire" | "secondaire";
}) {
  const [etat, action, pending] = useActionState(
    souscrirePlanAction,
    ETAT_INITIAL,
  );

  const classeBtn =
    variant === "primaire"
      ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white hover:brightness-110"
      : "border border-slate-900 bg-white text-slate-900 hover:bg-slate-50";

  return (
    <form action={action} className="w-full">
      <input type="hidden" name="plan" value={plan} />
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${classeBtn}`}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Redirection…
          </>
        ) : (
          cta
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
