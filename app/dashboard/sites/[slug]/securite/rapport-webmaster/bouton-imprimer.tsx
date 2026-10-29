"use client";

import { Printer } from "lucide-react";

export function BoutonImprimer() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
    >
      <Printer className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Imprimer / enregistrer en PDF
    </button>
  );
}
