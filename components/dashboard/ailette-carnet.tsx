"use client";

import { CheckCircle2, NotebookPen } from "lucide-react";

export type OrdreSession = {
  id: string;
  label: string;
  fait: boolean;
};

export function AiletteCarnet({ ordres }: { ordres: OrdreSession[] }) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300"
          aria-hidden
        >
          <NotebookPen className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
        Carnet de session
      </h2>
      <p className="mt-1 text-[11px] text-slate-400">
        Les ordres pris par AXI pendant cette conversation.
      </p>

      {ordres.length === 0 ? (
        <div className="mt-5 flex-1 rounded-xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-400">
          Aucun ordre pris pour l&apos;instant. AXI consignera ici
          chaque action menée pendant cette session.
        </div>
      ) : (
        <ul className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {ordres.map((o) => (
            <li
              key={o.id}
              className="flex items-start gap-2 rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 text-xs text-slate-300"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400"
                strokeWidth={2.2}
                aria-hidden
              />
              <span className="leading-relaxed">{o.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
