"use client";

import { AlertCircle, CheckCircle2, Loader2, Plus, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import {
  ajouterDestinataireRapportAction,
  retirerDestinataireRapportAction,
  type EtatAjoutDestinataire,
  type EtatRetraitDestinataire,
} from "./actions";

const ETAT_AJOUT_INITIAL: EtatAjoutDestinataire = {
  erreur: null,
  succes: false,
};
const ETAT_RETRAIT_INITIAL: EtatRetraitDestinataire = {
  erreur: null,
  succes: false,
};

export function FormulaireAjoutDestinataire({ slug }: { slug: string }) {
  const [etat, action, pending] = useActionState(
    ajouterDestinataireRapportAction,
    ETAT_AJOUT_INITIAL,
  );
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (etat.succes) {
      setPrenom("");
      setEmail("");
    }
  }, [etat.succes]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />

      <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
        <div>
          <label
            htmlFor="dest-prenom"
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            Prénom (optionnel)
          </label>
          <input
            id="dest-prenom"
            name="prenom"
            type="text"
            maxLength={60}
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Marc"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label
            htmlFor="dest-email"
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            Adresse email <span className="text-rose-600">*</span>
          </label>
          <input
            id="dest-email"
            name="email"
            type="email"
            required
            maxLength={160}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="marc@entreprise.com"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button
          type="submit"
          disabled={pending || !email.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Ajout…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Ajouter
            </>
          )}
        </button>
      </div>

      {etat.erreur && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-900"
        >
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
            strokeWidth={2}
            aria-hidden
          />
          <span>{etat.erreur}</span>
        </div>
      )}

      {etat.succes && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900"
        >
          <CheckCircle2
            className="h-3.5 w-3.5 flex-shrink-0"
            strokeWidth={2.2}
            aria-hidden
          />
          Destinataire ajouté. Il recevra le prochain rapport quotidien.
        </div>
      )}
    </form>
  );
}

export function BoutonRetirerDestinataire({
  slug,
  destinataireId,
}: {
  slug: string;
  destinataireId: string;
}) {
  const [etat, action, pending] = useActionState(
    retirerDestinataireRapportAction,
    ETAT_RETRAIT_INITIAL,
  );
  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="destinataireId" value={destinataireId} />
      <button
        type="submit"
        disabled={pending}
        title={etat.erreur ?? "Retirer ce destinataire"}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
        )}
        Retirer
      </button>
    </form>
  );
}
