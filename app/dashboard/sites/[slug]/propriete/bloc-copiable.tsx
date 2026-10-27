"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function BlocCopiable({ contenu }: { contenu: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(contenu);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="relative mt-2">
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 pr-12 text-[11px] leading-relaxed text-slate-100">
        <code>{contenu}</code>
      </pre>
      <button
        type="button"
        onClick={copier}
        aria-label="Copier"
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-100 transition-colors hover:bg-slate-700"
      >
        {copie ? (
          <>
            <Check className="h-3 w-3" strokeWidth={2.5} />
            Copié
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" strokeWidth={2.5} />
            Copier
          </>
        )}
      </button>
    </div>
  );
}
