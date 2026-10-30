"use client";

import { Check, Loader2, Plug, Unplug, X } from "lucide-react";
import { useState } from "react";

import type { ConnecteurCatalogue } from "@/lib/services/composio/catalogue";

type ConnexionExistante = {
  connectorSlug: string;
  connexionId: string;
  status: "pending" | "active" | "revoked" | "expired" | "erreur";
  connecteLe: string | null;
} | null;

export function ListeConnecteurs({
  siteSlug,
  connecteurs,
  connexionsExistantes,
}: {
  siteSlug: string;
  connecteurs: ConnecteurCatalogue[];
  connexionsExistantes: ConnexionExistante[];
}) {
  const [chargementSlug, setChargementSlug] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function connecter(connectorSlug: string) {
    setChargementSlug(connectorSlug);
    setErreur(null);
    try {
      const resp = await fetch("/api/dashboard/composio/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorSlug, siteSlug, packSlug: "default" }),
      });
      if (!resp.ok) {
        const data = (await resp.json().catch(() => ({}))) as {
          erreur?: string;
          message?: string;
        };
        throw new Error(
          data.message ?? data.erreur ?? `HTTP ${resp.status}`,
        );
      }
      const data = (await resp.json()) as { redirectUrl?: string };
      if (!data.redirectUrl) throw new Error("Réponse sans URL de redirection");
      window.location.href = data.redirectUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErreur(`Impossible de démarrer la connexion : ${msg}`);
      setChargementSlug(null);
    }
  }

  async function deconnecter(connexionId: string, connectorSlug: string) {
    setChargementSlug(connectorSlug);
    setErreur(null);
    try {
      const resp = await fetch(
        `/api/dashboard/composio/connexions/${connexionId}`,
        { method: "DELETE" },
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      window.location.reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErreur(`Impossible de déconnecter : ${msg}`);
      setChargementSlug(null);
    }
  }

  return (
    <>
      {erreur && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <X className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={2.4} />
          <p>{erreur}</p>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {connecteurs.map((c, i) => {
          const existante = connexionsExistantes[i];
          const estActif = existante?.status === "active";
          const estEnAttente = existante?.status === "pending";
          const estCharge = chargementSlug === c.slug;

          return (
            <article
              key={c.slug}
              className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
            >
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {c.nom}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{c.description}</p>
                </div>
                {estActif && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                    aria-label="Connecté"
                  >
                    <Check className="h-3 w-3" strokeWidth={2.6} />
                    Actif
                  </span>
                )}
                {estEnAttente && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.6} />
                    En attente
                  </span>
                )}
              </header>

              <ul className="flex flex-1 flex-col gap-1.5 text-xs text-slate-600">
                {c.casUsage.slice(0, 2).map((u) => (
                  <li key={u} className="flex gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span className="min-w-0 flex-1">{u}</span>
                  </li>
                ))}
              </ul>

              <footer className="pt-2">
                {estActif ? (
                  <button
                    type="button"
                    onClick={() =>
                      existante && deconnecter(existante.connexionId, c.slug)
                    }
                    disabled={estCharge}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {estCharge ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Unplug className="h-3.5 w-3.5" strokeWidth={2.2} />
                    )}
                    Déconnecter
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => connecter(c.slug)}
                    disabled={estCharge}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {estCharge ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plug className="h-3.5 w-3.5" strokeWidth={2.4} />
                    )}
                    Connecter
                  </button>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    </>
  );
}
