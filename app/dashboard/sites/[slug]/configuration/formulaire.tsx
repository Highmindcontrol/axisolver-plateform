"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import {
  sauverConfigurationAction,
  type EtatConfiguration,
} from "./actions";

const ETAT_INITIAL: EtatConfiguration = { erreur: null };

const TONS = [
  { valeur: "professionnel_chaleureux", libelle: "Professionnel chaleureux" },
  { valeur: "institutionnel", libelle: "Institutionnel" },
  { valeur: "convivial", libelle: "Convivial" },
  { valeur: "expert", libelle: "Expert" },
];

const VOIX_MODES = [
  {
    valeur: "texte_seul",
    titre: "Texte seul",
    corps: "Pas de synthèse vocale, chat écrit uniquement.",
  },
  {
    valeur: "navigateur",
    titre: "Voix du navigateur",
    corps: "SpeechSynthesis côté client, gratuit, qualité moyenne.",
  },
  {
    valeur: "premium_elevenlabs",
    titre: "Premium ElevenLabs",
    corps: "Voix broadcast, latence faible. Facturation au caractère.",
  },
];

const LANGUES = [
  { code: "fr", nom: "Français" },
  { code: "en", nom: "Anglais" },
  { code: "es", nom: "Espagnol" },
  { code: "de", nom: "Allemand" },
  { code: "it", nom: "Italien" },
  { code: "pt", nom: "Portugais" },
  { code: "nl", nom: "Néerlandais" },
  { code: "ar", nom: "Arabe" },
];

export function FormulaireConfiguration({
  slug,
  nomAssistant,
  ton,
  voixMode,
  voixId,
  langueDefaut,
  languesActives,
  couleurPrincipale,
  couleurSecondaire,
  afficherPropulsePar,
  domainesAutorises,
}: {
  slug: string;
  nomAssistant: string;
  ton: string;
  voixMode: string;
  voixId: string;
  langueDefaut: string;
  languesActives: string[];
  couleurPrincipale: string;
  couleurSecondaire: string;
  afficherPropulsePar: boolean;
  domainesAutorises: string[];
}) {
  const [etat, action, pending] = useActionState(
    sauverConfigurationAction,
    ETAT_INITIAL,
  );
  const [couleurP, setCouleurP] = useState(couleurPrincipale);
  const [couleurS, setCouleurS] = useState(couleurSecondaire);

  return (
    <form
      action={action}
      className="space-y-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
      <input type="hidden" name="slug" value={slug} />

      {/* Identité assistant */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Identité de l&apos;assistant
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-900">
              Nom affiché
            </label>
            <input
              name="nomAssistant"
              type="text"
              required
              defaultValue={nomAssistant}
              maxLength={40}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-900">
              Ton de conversation
            </label>
            <select
              name="ton"
              defaultValue={ton}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {TONS.map((t) => (
                <option key={t.valeur} value={t.valeur}>
                  {t.libelle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Langues */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Langues</h2>
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-slate-700">
            Langues actives
          </p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {LANGUES.map((l) => (
              <label
                key={l.code}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 hover:bg-slate-100"
              >
                <input
                  type="checkbox"
                  name="languesActives"
                  value={l.code}
                  defaultChecked={languesActives.includes(l.code)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                {l.nom}
              </label>
            ))}
          </div>
        </div>
        <div className="max-w-xs">
          <label className="mb-1.5 block text-sm font-medium text-slate-900">
            Langue par défaut
          </label>
          <select
            name="langueDefaut"
            defaultValue={langueDefaut}
            className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {LANGUES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nom}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Voix */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Mode voix
        </h2>
        <div className="space-y-2">
          {VOIX_MODES.map((v) => (
            <label
              key={v.valeur}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100"
            >
              <input
                type="radio"
                name="voixMode"
                value={v.valeur}
                defaultChecked={voixMode === v.valeur}
                className="mt-0.5 h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">{v.titre}</p>
                <p className="text-xs text-slate-600">{v.corps}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4 max-w-md">
          <label className="mb-1.5 block text-sm font-medium text-slate-900">
            ID de voix (ElevenLabs — optionnel)
          </label>
          <input
            name="voixId"
            type="text"
            defaultValue={voixId}
            placeholder="Laisser vide pour la voix par défaut"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </section>

      {/* Branding */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Branding</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-900">
              Couleur principale
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={couleurP}
                onChange={(e) => setCouleurP(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-slate-300"
              />
              <input
                type="text"
                name="couleurPrincipale"
                value={couleurP}
                onChange={(e) => setCouleurP(e.target.value)}
                maxLength={7}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-900">
              Couleur secondaire
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={couleurS}
                onChange={(e) => setCouleurS(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-slate-300"
              />
              <input
                type="text"
                name="couleurSecondaire"
                value={couleurS}
                onChange={(e) => setCouleurS(e.target.value)}
                maxLength={7}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>
        <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <input
            type="checkbox"
            name="afficherPropulsePar"
            defaultChecked={afficherPropulsePar}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <p className="font-medium text-slate-900">
              Afficher la mention « Propulsé par AxiSolver »
            </p>
            <p className="text-xs text-slate-600">
              Visible dans le pied du widget. Retirable sur plans payants
              (bientôt).
            </p>
          </div>
        </label>
      </section>

      {/* Domaines autorisés */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Domaines autorisés
        </h2>
        <label className="mb-1.5 block text-sm font-medium text-slate-900">
          Un domaine par ligne (ou séparés par virgule)
        </label>
        <textarea
          name="domainesAutorises"
          rows={4}
          defaultValue={domainesAutorises.join("\n")}
          placeholder={"monsite.com\nwww.monsite.com\npreview.monsite.com"}
          className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <p className="mt-1.5 text-xs text-slate-600">
          Seules les origines inscrites ici peuvent appeler l&apos;API
          AxiSolver pour ce site. CORS strict appliqué côté serveur.
        </p>
      </section>

      {/* Submit */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
        {etat.ok && (
          <div
            role="status"
            className="flex items-center gap-2 text-sm text-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
            Configuration enregistrée.
          </div>
        )}
        {etat.erreur && (
          <div
            role="alert"
            className="flex items-center gap-2 text-sm text-rose-700"
          >
            <AlertCircle className="h-4 w-4" strokeWidth={2.2} />
            {etat.erreur}
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              Enregistrer
            </>
          )}
        </button>
      </div>
    </form>
  );
}
