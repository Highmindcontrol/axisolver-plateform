"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Lock,
  Shield,
} from "lucide-react";
import type {
  FindingSecurity,
  RecommandationSecurity,
} from "@/lib/db/schema";
import { CATALOGUE } from "@/lib/engines/security/recommandations";
import { BoutonDeclencherRemediation } from "./bouton-declencher-remediation";

type Pilier = FindingSecurity["pilier"];
type Priorite = "critique" | "haute" | "moyenne" | "basse";

const PILIERS: Array<{ id: Pilier; label: string }> = [
  { id: "headers", label: "Headers" },
  { id: "tls", label: "TLS" },
  { id: "exposition", label: "Exposition" },
  { id: "cookies", label: "Cookies" },
  { id: "contenu", label: "Contenu" },
  { id: "reputation", label: "Réputation" },
];

const PRIORITES: Priorite[] = ["critique", "haute", "moyenne", "basse"];

export function RecosInteractives({
  recommandations,
  findings,
  pilierPreselectionne,
  slug,
  auditId,
  pluginInstalle,
}: {
  recommandations: RecommandationSecurity[];
  findings: FindingSecurity[];
  pilierPreselectionne?: Pilier | null;
  slug: string;
  auditId?: string;
  pluginInstalle: boolean;
}) {
  const [filtrePilier, setFiltrePilier] = useState<Pilier | null>(
    pilierPreselectionne ?? null,
  );
  const [filtrePriorite, setFiltrePriorite] = useState<Priorite | null>(null);
  const [afficherFindings, setAfficherFindings] = useState(false);

  const recosFiltrees = useMemo(() => {
    return recommandations.filter((r) => {
      if (filtrePilier && r.pilier !== filtrePilier) return false;
      if (filtrePriorite && r.priorite !== filtrePriorite) return false;
      return true;
    });
  }, [recommandations, filtrePilier, filtrePriorite]);

  const findingsFiltres = useMemo(() => {
    return findings.filter((f) => {
      if (filtrePilier && f.pilier !== filtrePilier) return false;
      if (filtrePriorite && f.severite !== filtrePriorite) return false;
      return true;
    });
  }, [findings, filtrePilier, filtrePriorite]);

  const filtreActif = filtrePilier !== null || filtrePriorite !== null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
            aria-hidden
          >
            <Lock className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {recommandations.length} recommandation
              {recommandations.length > 1 ? "s" : ""} priorisée
              {recommandations.length > 1 ? "s" : ""}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tri par priorité et impact sécurité
            </p>
          </div>
        </div>
      </header>

      {/* ────── Filtres piliers ────── */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFiltrePilier(null)}
          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
            filtrePilier === null
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Tous piliers
        </button>
        {PILIERS.map((p) => {
          const nb = recommandations.filter((r) => r.pilier === p.id).length;
          if (nb === 0) return null;
          return (
            <button
              key={p.id}
              onClick={() =>
                setFiltrePilier(filtrePilier === p.id ? null : p.id)
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                filtrePilier === p.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {p.label}
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  filtrePilier === p.id
                    ? "bg-white/25 text-white"
                    : "bg-white text-slate-600"
                }`}
              >
                {nb}
              </span>
            </button>
          );
        })}
      </div>

      {/* ────── Filtres priorité ────── */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFiltrePriorite(null)}
          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
            filtrePriorite === null
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Toutes priorités
        </button>
        {PRIORITES.map((pri) => {
          const nb = recommandations.filter((r) => r.priorite === pri).length;
          if (nb === 0) return null;
          const couleurs: Record<Priorite, { on: string; off: string }> = {
            critique: {
              on: "bg-rose-600 text-white",
              off: "bg-rose-50 text-rose-800 hover:bg-rose-100",
            },
            haute: {
              on: "bg-orange-600 text-white",
              off: "bg-orange-50 text-orange-800 hover:bg-orange-100",
            },
            moyenne: {
              on: "bg-amber-600 text-white",
              off: "bg-amber-50 text-amber-800 hover:bg-amber-100",
            },
            basse: {
              on: "bg-slate-600 text-white",
              off: "bg-slate-50 text-slate-700 hover:bg-slate-100",
            },
          };
          const style =
            filtrePriorite === pri ? couleurs[pri].on : couleurs[pri].off;
          return (
            <button
              key={pri}
              onClick={() =>
                setFiltrePriorite(filtrePriorite === pri ? null : pri)
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${style}`}
            >
              {pri}
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  filtrePriorite === pri
                    ? "bg-white/25 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                {nb}
              </span>
            </button>
          );
        })}
      </div>

      {/* ────── Liste recos filtrées ────── */}
      {recosFiltrees.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          {filtreActif
            ? "Aucune recommandation ne correspond aux filtres."
            : "Aucune recommandation. Tous les contrôles sont au vert."}
        </div>
      ) : (
        <ul className="space-y-4">
          {recosFiltrees.map((r, i) => (
            <li
              key={i}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="flex items-center gap-2">
                    <BadgePriorite priorite={r.priorite} />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {r.pilier}
                    </span>
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">
                    {r.titre}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    {r.description}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right text-[11px] text-slate-500">
                  <p>
                    Effort :{" "}
                    <strong className="text-slate-700">{r.effort}</strong>
                  </p>
                  <p>
                    Impact :{" "}
                    <strong className="text-slate-700">{r.impact}</strong>
                  </p>
                </div>
              </div>
              {r.pris_en_charge_axi && (
                <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-slate-900/10 bg-gradient-to-br from-slate-900 to-slate-700 p-3 text-white">
                  <div className="flex items-start gap-2">
                    <Shield
                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                        Pris en charge par {r.pris_en_charge_axi.pack}
                      </p>
                      {r.pris_en_charge_axi.cout_avec_axi && (
                        <p className="mt-0.5 text-xs">
                          {r.pris_en_charge_axi.cout_avec_axi}
                        </p>
                      )}
                    </div>
                  </div>
                  {pluginInstalle &&
                    (() => {
                      const code = Object.keys(CATALOGUE).find(
                        (c) => CATALOGUE[c].titre === r.titre,
                      );
                      return code ? (
                        <BoutonDeclencherRemediation
                          slug={slug}
                          findingCode={code}
                          auditId={auditId}
                        />
                      ) : null;
                    })()}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ────── Toggle détails techniques (findings bruts) ────── */}
      {findings.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <button
            onClick={() => setAfficherFindings((v) => !v)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-700"
          >
            <Code2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Détails techniques — {findingsFiltres.length} finding
            {findingsFiltres.length > 1 ? "s" : ""} brut
            {findingsFiltres.length > 1 ? "s" : ""}
            {afficherFindings ? (
              <ChevronUp className="h-4 w-4" strokeWidth={2.2} />
            ) : (
              <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
            )}
          </button>
          {afficherFindings && (
            <ul className="mt-4 space-y-2">
              {findingsFiltres.map((f, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <p className="flex items-center gap-2">
                    <BadgeSeverite severite={f.severite} />
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                      {f.pilier}.{f.code}
                    </code>
                  </p>
                  <p className="mt-1.5 text-xs text-slate-700">{f.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function BadgePriorite({ priorite }: { priorite: Priorite }) {
  const styles: Record<Priorite, string> = {
    critique: "bg-rose-100 text-rose-800 border-rose-200",
    haute: "bg-orange-100 text-orange-800 border-orange-200",
    moyenne: "bg-amber-100 text-amber-800 border-amber-200",
    basse: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[priorite]}`}
    >
      {priorite === "critique" && (
        <AlertCircle className="h-3 w-3" strokeWidth={2.4} />
      )}
      {priorite === "basse" && (
        <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
      )}
      {priorite}
    </span>
  );
}

function BadgeSeverite({
  severite,
}: {
  severite: "critique" | "haute" | "moyenne" | "basse" | "info";
}) {
  const styles: Record<string, string> = {
    critique: "bg-rose-200 text-rose-900 border-rose-300",
    haute: "bg-orange-200 text-orange-900 border-orange-300",
    moyenne: "bg-amber-100 text-amber-900 border-amber-200",
    basse: "bg-slate-100 text-slate-700 border-slate-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[severite]}`}
    >
      {severite}
    </span>
  );
}
