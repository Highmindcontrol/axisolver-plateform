"use client";

import { Sparkles } from "lucide-react";

import type { ContexteAxiChat } from "../types";

export function EnteteChat({
  contexte,
}: {
  contexte: ContexteAxiChat | undefined;
}) {
  const nom = contexte?.nomAssistant ?? "AXI";
  const sousTitre = contexte?.sousTitre ?? "Votre copilote AxiSolver";

  return (
    <header className="flex items-center justify-between gap-3 pb-4">
      <div className="flex items-center gap-2">
        {contexte?.logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={contexte.logoUrl}
            alt=""
            className="h-7 w-7 rounded-full object-contain"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow"
            style={{
              background: `linear-gradient(135deg, var(--axi-chat-accent), var(--axi-chat-accent-secondaire))`,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
        )}
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--axi-chat-texte)" }}
          >
            {nom}
          </p>
          <p
            className="text-[11px]"
            style={{ color: "var(--axi-chat-texte-secondaire)" }}
          >
            {sousTitre}
          </p>
        </div>
      </div>
    </header>
  );
}
