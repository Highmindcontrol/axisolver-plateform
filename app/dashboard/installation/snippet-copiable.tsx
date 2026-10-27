"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function SnippetCopiable({
  slug,
  baseUrl,
  isSystemSite = false,
}: {
  slug: string;
  baseUrl: string;
  isSystemSite?: boolean;
}) {
  const [copie, setCopie] = useState(false);
  const snippet = `<script src="${baseUrl}/v1.js" data-site-id="${slug}" async></script>`;

  async function copier() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* clipboard refusé — fallback silencieux */
    }
  }

  return (
    <div className={isSystemSite ? "mt-6" : ""}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-600">
        Snippet à coller juste avant &lt;/body&gt;
      </p>
      <div className="group relative">
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-5 pr-14 text-[12px] leading-relaxed text-slate-100">
          <code>{snippet}</code>
        </pre>
        <button
          type="button"
          onClick={copier}
          aria-label="Copier le snippet"
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-100 transition-colors hover:bg-slate-700"
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
    </div>
  );
}
