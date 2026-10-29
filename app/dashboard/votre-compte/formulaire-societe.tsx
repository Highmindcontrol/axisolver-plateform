"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";

import { modifierSocieteAction, type EtatSociete } from "./actions";

const ETAT_INITIAL: EtatSociete = { erreur: null, succes: false };

export type SocieteInitial = {
  raisonSociale: string;
  numeroTva: string;
  siret: string;
  adresseLigne1: string;
  adresseLigne2: string;
  codePostal: string;
  ville: string;
  pays: string;
  emailFacturation: string;
};

export function FormulaireSociete({ initial }: { initial: SocieteInitial }) {
  const [etat, action, pending] = useActionState(
    modifierSocieteAction,
    ETAT_INITIAL,
  );
  const [valeurs, setValeurs] = useState<SocieteInitial>(initial);

  function set<K extends keyof SocieteInitial>(cle: K, v: string) {
    setValeurs((prev) => ({ ...prev, [cle]: v }));
  }

  const modifie = Object.keys(initial).some((k) => {
    const cle = k as keyof SocieteInitial;
    return valeurs[cle].trim() !== initial[cle].trim();
  });

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          label="Raison sociale"
          id="raisonSociale"
          valeur={valeurs.raisonSociale}
          onChange={(v) => set("raisonSociale", v)}
          placeholder="Ataraxis Holding Ltd"
          maxLength={120}
        />
        <Champ
          label="Email de facturation"
          id="emailFacturation"
          type="email"
          valeur={valeurs.emailFacturation}
          onChange={(v) => set("emailFacturation", v)}
          placeholder="compta@votre-entreprise.com"
          maxLength={160}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          label="Numéro de TVA"
          id="numeroTva"
          valeur={valeurs.numeroTva}
          onChange={(v) => set("numeroTva", v.toUpperCase())}
          placeholder="FR12345678901"
          maxLength={32}
          help="Pour les clients UE, affichage sur facture et exonération intracommunautaire."
        />
        <Champ
          label="SIRET (France) ou identifiant local"
          id="siret"
          valeur={valeurs.siret}
          onChange={(v) => set("siret", v)}
          placeholder="123 456 789 00012"
          maxLength={32}
        />
      </div>

      <Champ
        label="Adresse ligne 1"
        id="adresseLigne1"
        valeur={valeurs.adresseLigne1}
        onChange={(v) => set("adresseLigne1", v)}
        placeholder="12 rue de la République"
        maxLength={120}
      />
      <Champ
        label="Adresse ligne 2 (optionnel)"
        id="adresseLigne2"
        valeur={valeurs.adresseLigne2}
        onChange={(v) => set("adresseLigne2", v)}
        placeholder="Bâtiment B, 3e étage"
        maxLength={120}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Champ
          label="Code postal"
          id="codePostal"
          valeur={valeurs.codePostal}
          onChange={(v) => set("codePostal", v)}
          placeholder="75001"
          maxLength={16}
        />
        <Champ
          label="Ville"
          id="ville"
          valeur={valeurs.ville}
          onChange={(v) => set("ville", v)}
          placeholder="Paris"
          maxLength={80}
        />
        <Champ
          label="Pays"
          id="pays"
          valeur={valeurs.pays}
          onChange={(v) => set("pays", v)}
          placeholder="France"
          maxLength={60}
        />
      </div>

      <p className="text-xs text-slate-500">
        Ces informations seront utilisées pour émettre vos factures
        Stripe (abonnement AxiSolver). Tout est optionnel tant que
        l&apos;abonnement n&apos;est pas activé.
      </p>

      {etat.erreur && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            strokeWidth={2}
            aria-hidden
          />
          <span>{etat.erreur}</span>
        </div>
      )}

      {etat.succes && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          <CheckCircle2
            className="h-4 w-4 flex-shrink-0"
            strokeWidth={2.2}
            aria-hidden
          />
          Informations société enregistrées.
        </div>
      )}

      <div className="flex items-center justify-end border-t border-slate-100 pt-4">
        <button
          type="submit"
          disabled={!modifie || pending}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            "Enregistrer"
          )}
        </button>
      </div>
    </form>
  );
}

function Champ({
  label,
  id,
  valeur,
  onChange,
  placeholder,
  maxLength,
  type = "text",
  help,
}: {
  label: string;
  id: string;
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
  help?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-slate-500"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        maxLength={maxLength}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      {help && <p className="mt-1 text-[11px] text-slate-500">{help}</p>}
    </div>
  );
}
