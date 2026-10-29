"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Rocket, Loader2 } from "lucide-react";
import { creerSiteAction, type EtatCreationSite } from "./actions";
import { CATALOGUE_SECTEURS } from "@/lib/axi-solver/catalogue-secteurs";
import { PickerApparence } from "@/components/dashboard/picker-apparence";

const ETAT_INITIAL: EtatCreationSite = { erreur: null };

function slugDepuisDomaine(domaine: string): string {
  return domaine
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\.[a-z]{2,}$/i, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function FormulaireNouveauSite() {
  const [etat, action, pending] = useActionState(creerSiteAction, ETAT_INITIAL);
  const [domaine, setDomaine] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuel, setSlugManuel] = useState(false);

  function onDomaineChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDomaine(e.target.value);
    if (!slugManuel) {
      setSlug(slugDepuisDomaine(e.target.value));
    }
  }

  return (
    <form
      action={action}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      noValidate
    >
      <div>
        <label
          htmlFor="nomSite"
          className="mb-1.5 block text-sm font-medium text-slate-900"
        >
          Nom du site <span className="text-rose-600">*</span>
        </label>
        <input
          id="nomSite"
          name="nomSite"
          type="text"
          required
          maxLength={120}
          placeholder="Ex. Ataraxis.group, Neuroactif, Cabinet Dupont…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Ce qui identifie ce site dans votre dashboard. La raison sociale
          de la société cliente se renseigne séparément dans « Votre
          compte » pour la facturation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="domainePrincipal"
            className="mb-1.5 block text-sm font-medium text-slate-900"
          >
            Domaine principal <span className="text-rose-600">*</span>
          </label>
          <input
            id="domainePrincipal"
            name="domainePrincipal"
            type="text"
            required
            value={domaine}
            onChange={onDomaineChange}
            placeholder="monsite.com"
            autoComplete="url"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Sans http:// ni chemin. Ex. <code>cabinet-dupont.fr</code>
          </p>
        </div>

        <div>
          <label
            htmlFor="slug"
            className="mb-1.5 block text-sm font-medium text-slate-900"
          >
            Slug AxiSolver
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManuel(true);
            }}
            placeholder="cabinet-dupont"
            maxLength={50}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Identifiant interne, visible dans le snippet. Lettres,
            chiffres, tirets.
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="secteur"
          className="mb-1.5 block text-sm font-medium text-slate-900"
        >
          Secteur d&apos;activité <span className="text-rose-600">*</span>
        </label>
        <select
          id="secteur"
          name="secteur"
          required
          defaultValue=""
          className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="" disabled>
            Choisissez votre secteur…
          </option>
          {CATALOGUE_SECTEURS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.nom}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          Permet de pré-remplir le ton et les options d&apos;accueil
          templatées. Vous pourrez tout personnaliser ensuite.
        </p>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <p className="mb-3 text-sm font-medium text-slate-900">
          Apparence du site
        </p>
        <p className="mb-4 text-xs text-slate-500">
          Choisissez une couleur et un picto. Ils apparaîtront dans la
          barre du haut pour identifier ce site d&apos;un coup d&apos;œil
          et teinter le bandeau d&apos;actions.
        </p>
        <PickerApparence />
      </div>

      {etat.erreur && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={2} />
          <span>{etat.erreur}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Création en cours…
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              Créer mon site
            </>
          )}
        </button>
      </div>
    </form>
  );
}
