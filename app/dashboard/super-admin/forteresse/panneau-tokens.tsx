"use client";

import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useActionState, useState } from "react";

import type { TokenForteresseInfo } from "@/lib/services/forteresse";

import {
  creerTokenAction,
  revoquerTokenAction,
  supprimerTokenAction,
  type EtatToken,
} from "./actions";

const INIT: EtatToken = { erreur: null };

export function PanneauTokens({
  tokens,
  peutModifier,
}: {
  tokens: TokenForteresseInfo[];
  peutModifier: boolean;
}) {
  const [etatCreer, actionCreer, pendingCreer] = useActionState(
    creerTokenAction,
    INIT,
  );
  const [copie, setCopie] = useState(false);

  async function copierToken() {
    if (!etatCreer.tokenClair) return;
    try {
      await navigator.clipboard.writeText(etatCreer.tokenClair);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* ignorer */
    }
  }

  return (
    <>
      {/* ─── Token fraîchement créé (affiché UNE fois) ───── */}
      {etatCreer.tokenClair && (
        <section className="mb-5 rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
          <header className="mb-3 flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700"
              strokeWidth={2}
              aria-hidden
            />
            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                Nouveau token — note-le immédiatement
              </h3>
              <p className="mt-0.5 text-xs text-amber-800">
                Ce token ne sera plus jamais affiché. Si tu le perds, tu
                devras en créer un nouveau et mettre à jour la Forteresse.
              </p>
            </div>
          </header>
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white p-3">
            <code className="flex-1 overflow-x-auto font-mono text-xs text-slate-900">
              {etatCreer.tokenClair}
            </code>
            <button
              type="button"
              onClick={copierToken}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:brightness-110"
            >
              {copie ? (
                <>
                  <Check className="h-3 w-3" strokeWidth={2.4} />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" strokeWidth={2.4} />
                  Copier
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* ─── Formulaire de création ─────────────────────── */}
      {peutModifier && (
        <form
          action={actionCreer}
          className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
        >
          <input
            type="text"
            name="nom"
            placeholder="Nom du token (ex: forteresse-prod)"
            required
            className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="submit"
            disabled={pendingCreer}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {pendingCreer ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
            ) : (
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
            )}
            Créer un token
          </button>
        </form>
      )}

      {etatCreer.erreur && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {etatCreer.erreur}
        </p>
      )}

      {/* ─── Liste des tokens ───────────────────────────── */}
      {tokens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-500">
          Aucun token créé. La Forteresse ne pourra pas consommer le
          endpoint tant qu&apos;un token n&apos;est pas généré.
        </p>
      ) : (
        <ul className="space-y-2">
          {tokens.map((t) => (
            <LigneToken
              key={t.id}
              token={t}
              peutModifier={peutModifier}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function LigneToken({
  token,
  peutModifier,
}: {
  token: TokenForteresseInfo;
  peutModifier: boolean;
}) {
  const [, actionRevoquer, pendingRevoquer] = useActionState(
    revoquerTokenAction,
    INIT,
  );
  const [, actionSupprimer, pendingSupprimer] = useActionState(
    supprimerTokenAction,
    INIT,
  );

  const revoque = !!token.revoqueLe;

  return (
    <li
      className={`flex items-center justify-between rounded-xl border p-4 ${
        revoque
          ? "border-slate-200 bg-slate-50/60 opacity-60"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{token.nom}</p>
          {revoque && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800">
              <XCircle className="h-3 w-3" strokeWidth={2.4} />
              Révoqué
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Créé le{" "}
          {token.creeLe.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {token.derniereUtilisationLe ? (
            <>
              {" "}
              · dernière utilisation{" "}
              {token.derniereUtilisationLe.toLocaleString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </>
          ) : (
            " · jamais utilisé"
          )}
        </p>
      </div>
      {peutModifier && (
        <div className="flex items-center gap-2">
          {!revoque && (
            <form action={actionRevoquer}>
              <input type="hidden" name="id" value={token.id} />
              <button
                type="submit"
                disabled={pendingRevoquer}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[11px] font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50"
              >
                {pendingRevoquer ? (
                  <Loader2
                    className="h-3 w-3 animate-spin"
                    strokeWidth={2.4}
                  />
                ) : (
                  <XCircle className="h-3 w-3" strokeWidth={2.4} />
                )}
                Révoquer
              </button>
            </form>
          )}
          <form action={actionSupprimer}>
            <input type="hidden" name="id" value={token.id} />
            <button
              type="submit"
              disabled={pendingSupprimer}
              aria-label="Supprimer définitivement"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              {pendingSupprimer ? (
                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.4} />
              ) : (
                <Trash2 className="h-3 w-3" strokeWidth={2.4} />
              )}
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
