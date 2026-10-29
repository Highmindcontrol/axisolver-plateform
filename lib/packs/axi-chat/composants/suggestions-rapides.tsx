"use client";

import type { SuggestionRapide } from "../types";

export function SuggestionsRapides({
  suggestions,
  onChoisir,
}: {
  suggestions: SuggestionRapide[];
  onChoisir: (texte: string) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {suggestions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChoisir(s.valeur ?? s.libelle)}
          className="px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
          style={{
            borderRadius: "var(--axi-chat-rayon)",
            border: `1px solid var(--axi-chat-bordure)`,
            background: "var(--axi-chat-surface)",
            color: "var(--axi-chat-texte-secondaire)",
          }}
        >
          {s.libelle}
        </button>
      ))}
    </div>
  );
}
