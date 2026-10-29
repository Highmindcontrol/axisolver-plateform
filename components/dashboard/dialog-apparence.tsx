"use client";

import { AlertCircle, Loader2, Settings, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { PickerApparence } from "@/components/dashboard/picker-apparence";
import {
  modifierApparenceAction,
  type EtatModifApparence,
} from "@/app/dashboard/sites/[slug]/apparence-actions";

const ETAT_INITIAL: EtatModifApparence = { erreur: null, succes: false };

/**
 * Bouton engrenage + dialog modal pour modifier couleur + picto d'un
 * site existant. S'affiche dans HeaderSites quand un site est actif.
 */
export function DialogApparence({
  slug,
  couleurActuelle,
  pictoActuel,
}: {
  slug: string;
  couleurActuelle: string;
  pictoActuel: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, pending] = useActionState(
    modifierApparenceAction,
    ETAT_INITIAL,
  );

  useEffect(() => {
    if (etat.succes) {
      // Fermeture auto après succès.
      const t = setTimeout(() => setOuvert(false), 400);
      return () => clearTimeout(t);
    }
  }, [etat.succes]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    if (ouvert) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
  }, [ouvert]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        title="Modifier la couleur et le picto de ce site"
        aria-label="Modifier l'apparence de ce site"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-900"
      >
        <Settings className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      </button>

      {ouvert && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm md:items-center"
          onClick={() => setOuvert(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Modifier l'apparence du site"
        >
          <div
            className="relative my-8 w-full max-w-xl rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Apparence du site
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  La couleur et le picto apparaissent dans la barre du
                  haut et teintent le bandeau d&apos;actions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer"
                className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:border-slate-400 hover:text-slate-900"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <form action={action} className="space-y-5 p-5">
              <input type="hidden" name="slug" value={slug} />
              <PickerApparence
                defaultCouleur={couleurActuelle}
                defaultPicto={pictoActuel}
              />

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
                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
                >
                  Apparence enregistrée.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setOuvert(false)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {pending ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden
                      />
                      Enregistrement…
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
