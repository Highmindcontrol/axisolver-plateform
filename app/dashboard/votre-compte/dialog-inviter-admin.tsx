"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import {
  inviterAdminAction,
  type EtatInvitation,
} from "./admins-actions";

const ETAT_INITIAL: EtatInvitation = { erreur: null, succes: false };

export function DialogInviterAdmin() {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, pending] = useActionState(
    inviterAdminAction,
    ETAT_INITIAL,
  );
  const [email, setEmail] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");

  useEffect(() => {
    if (etat.succes) {
      const t = setTimeout(() => {
        setOuvert(false);
        setEmail("");
        setPrenom("");
        setNom("");
      }, 1200);
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
        className="flex-shrink-0 rounded-full border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:border-indigo-500 hover:bg-indigo-50"
      >
        Ajouter un administrateur
      </button>

      {ouvert && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm md:items-center"
          onClick={() => setOuvert(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Inviter un co-administrateur"
        >
          <div
            className="relative my-8 w-full max-w-md rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"
                  aria-hidden
                >
                  <UserPlus className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Inviter un administrateur
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Mêmes droits que vous, invitation valable 7 jours.
                  </p>
                </div>
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

            <form action={action} className="space-y-4 p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="inv-prenom"
                    className="mb-1 block text-xs font-medium text-slate-500"
                  >
                    Prénom
                  </label>
                  <input
                    id="inv-prenom"
                    name="prenom"
                    type="text"
                    maxLength={60}
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Marc"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="inv-nom"
                    className="mb-1 block text-xs font-medium text-slate-500"
                  >
                    Nom
                  </label>
                  <input
                    id="inv-nom"
                    name="nom"
                    type="text"
                    maxLength={60}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Dupont"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="inv-email"
                  className="mb-1 block text-xs font-medium text-slate-500"
                >
                  Adresse email <span className="text-rose-600">*</span>
                </label>
                <input
                  id="inv-email"
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marc.dupont@entreprise.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <p className="rounded-md bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-900">
                La personne recevra un email avec un lien à usage
                unique pour rejoindre votre compte. Elle aura ensuite
                exactement les mêmes droits que vous.
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
                  Invitation envoyée.
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
                  disabled={!email.trim() || pending}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden
                      />
                      Envoi…
                    </>
                  ) : (
                    "Envoyer l'invitation"
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
