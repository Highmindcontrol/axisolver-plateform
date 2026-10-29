"use client";

import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import {
  libelleCategorie,
  type CategorieCoutFournisseur,
} from "@/lib/services/couts-fournisseurs-types";

import {
  enregistrerCoutAction,
  supprimerCoutAction,
  type EtatSaisie,
} from "./actions";

const INIT: EtatSaisie = { erreur: null };

type LigneCatalogue = {
  fournisseur: string;
  categorie: CategorieCoutFournisseur;
  description: string;
  id: string | null;
  montantEurHt: number;
  notes: string | null;
  majLe: Date | null;
};

type LigneHorsCatalogue = {
  id: string;
  fournisseur: string;
  categorie: CategorieCoutFournisseur;
  montantEurHt: number;
  notes: string | null;
  majLe: Date;
};

export function TableSaisie({
  bucketMois,
  lignesCatalogue,
  lignesHorsCatalogue,
  peutModifier,
}: {
  bucketMois: string;
  lignesCatalogue: LigneCatalogue[];
  lignesHorsCatalogue: LigneHorsCatalogue[];
  peutModifier: boolean;
}) {
  const groupes = regrouperParCategorie(lignesCatalogue);

  return (
    <div className="space-y-6">
      {Object.entries(groupes).map(([cat, lignes]) => (
        <section
          key={cat}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <header className="border-b border-slate-200 bg-slate-50/60 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {libelleCategorie(cat as CategorieCoutFournisseur)}
            </h3>
          </header>
          <ul className="divide-y divide-slate-100">
            {lignes.map((l) => (
              <LigneSaisie
                key={`${l.fournisseur}-${l.categorie}`}
                bucketMois={bucketMois}
                ligne={l}
                peutModifier={peutModifier}
              />
            ))}
          </ul>
        </section>
      ))}

      {lignesHorsCatalogue.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50/60 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Autres fournisseurs saisis
            </h3>
          </header>
          <ul className="divide-y divide-slate-100">
            {lignesHorsCatalogue.map((l) => (
              <LigneHorsCatalogueRow
                key={l.id}
                bucketMois={bucketMois}
                ligne={l}
                peutModifier={peutModifier}
              />
            ))}
          </ul>
        </section>
      )}

      {peutModifier && (
        <AjoutAdHoc bucketMois={bucketMois} />
      )}
    </div>
  );
}

function regrouperParCategorie(
  lignes: LigneCatalogue[],
): Record<string, LigneCatalogue[]> {
  const out: Record<string, LigneCatalogue[]> = {};
  for (const l of lignes) {
    out[l.categorie] ??= [];
    out[l.categorie].push(l);
  }
  return out;
}

function LigneSaisie({
  bucketMois,
  ligne,
  peutModifier,
}: {
  bucketMois: string;
  ligne: LigneCatalogue;
  peutModifier: boolean;
}) {
  const [etat, action, pending] = useActionState(enregistrerCoutAction, INIT);
  const [valeur, setValeur] = useState(
    ligne.montantEurHt > 0 ? ligne.montantEurHt.toString() : "",
  );

  return (
    <li className="px-5 py-3">
      <form action={action} className="flex items-center gap-3">
        <input type="hidden" name="bucketMois" value={bucketMois} />
        <input type="hidden" name="fournisseur" value={ligne.fournisseur} />
        <input type="hidden" name="categorie" value={ligne.categorie} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">
            {ligne.fournisseur}
          </p>
          <p className="text-[11px] text-slate-500">{ligne.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              name="montant"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              placeholder="0,00"
              disabled={!peutModifier || pending}
              className="w-28 rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-right text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              €
            </span>
          </div>
          {peutModifier && (
            <button
              type="submit"
              disabled={pending}
              aria-label={ligne.id ? "Mettre à jour" : "Enregistrer"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white hover:brightness-110 disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
              ) : (
                <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
            </button>
          )}
        </div>
      </form>
      {etat.erreur && (
        <p className="mt-1 text-[11px] text-rose-700">{etat.erreur}</p>
      )}
      {etat.succes && (
        <p className="mt-1 text-[11px] text-emerald-700">{etat.succes}</p>
      )}
      {ligne.majLe && (
        <p className="mt-0.5 text-[10px] text-slate-400">
          Dernière saisie :{" "}
          {ligne.majLe.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </li>
  );
}

function LigneHorsCatalogueRow({
  bucketMois,
  ligne,
  peutModifier,
}: {
  bucketMois: string;
  ligne: LigneHorsCatalogue;
  peutModifier: boolean;
}) {
  const [, actionEnreg, pendingEnreg] = useActionState(
    enregistrerCoutAction,
    INIT,
  );
  const [, actionSupp, pendingSupp] = useActionState(
    supprimerCoutAction,
    INIT,
  );
  const [valeur, setValeur] = useState(ligne.montantEurHt.toString());

  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">
            {ligne.fournisseur}
          </p>
          <p className="text-[11px] text-slate-500">
            {libelleCategorie(ligne.categorie)}
            {ligne.notes ? ` — ${ligne.notes}` : ""}
          </p>
        </div>
        <form action={actionEnreg} className="flex items-center gap-2">
          <input type="hidden" name="bucketMois" value={bucketMois} />
          <input type="hidden" name="fournisseur" value={ligne.fournisseur} />
          <input type="hidden" name="categorie" value={ligne.categorie} />
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              name="montant"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              disabled={!peutModifier || pendingEnreg}
              className="w-28 rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-right text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              €
            </span>
          </div>
          {peutModifier && (
            <button
              type="submit"
              disabled={pendingEnreg}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white hover:brightness-110 disabled:opacity-50"
            >
              {pendingEnreg ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
              ) : (
                <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
            </button>
          )}
        </form>
        {peutModifier && (
          <form action={actionSupp}>
            <input type="hidden" name="id" value={ligne.id} />
            <button
              type="submit"
              disabled={pendingSupp}
              aria-label="Supprimer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              {pendingSupp ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
              ) : (
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

function AjoutAdHoc({ bucketMois }: { bucketMois: string }) {
  const [etat, action, pending] = useActionState(enregistrerCoutAction, INIT);
  const [ouvert, setOuvert] = useState(false);

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
        Ajouter un fournisseur hors catalogue
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Ajouter un fournisseur ad hoc
        </h3>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          Annuler
        </button>
      </header>
      <form action={action} className="grid gap-3 md:grid-cols-4">
        <input type="hidden" name="bucketMois" value={bucketMois} />
        <input
          type="text"
          name="fournisseur"
          placeholder="Nom du fournisseur"
          required
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <select
          name="categorie"
          required
          defaultValue="autre"
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="ia_llm">IA / LLM</option>
          <option value="voix">Voix</option>
          <option value="infra">Infrastructure</option>
          <option value="paiements">Paiements</option>
          <option value="email">Email</option>
          <option value="seo">SEO</option>
          <option value="outillage">Outillage</option>
          <option value="autre">Autre</option>
        </select>
        <input
          type="text"
          inputMode="decimal"
          name="montant"
          placeholder="Montant € HT"
          required
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
          ) : (
            <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
          )}
          Enregistrer
        </button>
      </form>
      {etat.erreur && (
        <p className="mt-2 text-xs text-rose-700">{etat.erreur}</p>
      )}
      {etat.succes && (
        <p className="mt-2 text-xs text-emerald-700">{etat.succes}</p>
      )}
    </section>
  );
}
