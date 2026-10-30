"use client";

import { AlertTriangle, Check, Loader2 } from "lucide-react";

import type { OrdreAxi } from "@/lib/packs/axi-chat";

/**
 * Ailette droite du copilote — journal chronologique des actions
 * (tools) qu'AXI a prises pendant la session courante. Visible seulement
 * quand il y a des ordres, pour respecter la doctrine « l'écran se
 * remplit au fur et à mesure ».
 */
export function AiletteOrdres({ ordres }: { ordres: OrdreAxi[] }) {
  if (ordres.length === 0) return null;

  // Ordre inverse : plus récent en haut
  const liste = [...ordres].reverse();

  return (
    <ul className="space-y-2 overflow-y-auto">
      {liste.map((o) => (
        <li
          key={o.id}
          className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3"
        >
          <div className="flex items-start gap-2">
            <IconeStatut statut={o.statut} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium leading-tight text-slate-100">
                {o.libelle}
              </p>
              {o.horodatage && (
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {o.horodatage.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function IconeStatut({ statut }: { statut: OrdreAxi["statut"] }) {
  if (statut === "termine") {
    return (
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300"
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (statut === "echoue" || statut === "refuse") {
    return (
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-300"
      >
        <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.4} />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300"
    >
      <Loader2 className="h-2.5 w-2.5 animate-spin" strokeWidth={2.4} />
    </span>
  );
}
