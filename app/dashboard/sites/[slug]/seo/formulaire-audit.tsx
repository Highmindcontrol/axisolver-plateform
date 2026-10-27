"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, PlayCircle } from "lucide-react";
import { lancerAuditSeoAction, type EtatAuditSeo } from "./actions";

const ETAT_INITIAL: EtatAuditSeo = { erreur: null };

export function FormulaireAuditSeo({ slug }: { slug: string }) {
  const [etat, action, pending] = useActionState(
    lancerAuditSeoAction,
    ETAT_INITIAL,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label
          htmlFor="motsCles"
          className="mb-2 block text-xs font-medium text-slate-700"
        >
          Mots-clés à tester sur Google (max 5, un par ligne ou séparés
          par virgule)
        </label>
        <textarea
          id="motsCles"
          name="motsCles"
          rows={3}
          placeholder="ex. : plombier Paris 15ème&#10;dépannage urgence&#10;devis plomberie"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Audit en cours…
          </>
        ) : (
          <>
            <PlayCircle className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Lancer l&apos;audit SEO
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
