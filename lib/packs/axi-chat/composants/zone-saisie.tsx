"use client";

import { Mic, Paperclip, Send } from "lucide-react";

import type { FonctionnalitesAxiChat } from "../types";

export function ZoneSaisie({
  valeur,
  onChange,
  onEnvoyer,
  onDictee,
  dicteeActive,
  onPiecesJointes,
  placeholder,
  fonctionnalites,
  envoiDesactive,
}: {
  valeur: string;
  onChange: (v: string) => void;
  onEnvoyer: () => void;
  onDictee?: () => void;
  dicteeActive?: boolean;
  onPiecesJointes?: () => void;
  placeholder?: string;
  fonctionnalites?: FonctionnalitesAxiChat;
  envoiDesactive?: boolean;
}) {
  const avecDictee = fonctionnalites?.dictee && onDictee;
  const avecPieces = fonctionnalites?.piecesJointes && onPiecesJointes;
  const placeholderFinal = dicteeActive
    ? "J'écoute…"
    : placeholder ?? "Écrivez à AXI, ou cliquez sur le micro pour parler.";

  return (
    <form
      className="flex items-end gap-2 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        onEnvoyer();
      }}
    >
      {avecDictee && (
        <button
          type="button"
          onClick={onDictee}
          aria-label={dicteeActive ? "Arrêter la dictée et envoyer" : "Dicter un message"}
          aria-pressed={dicteeActive}
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center border transition-colors ${
            dicteeActive ? "animate-pulse" : ""
          }`}
          style={{
            borderRadius: "var(--axi-chat-rayon)",
            borderColor: dicteeActive ? "#ef4444" : "var(--axi-chat-bordure)",
            background: dicteeActive
              ? "#ef4444"
              : "var(--axi-chat-surface-interactive)",
            color: dicteeActive ? "#ffffff" : "var(--axi-chat-texte-secondaire)",
          }}
        >
          <Mic className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </button>
      )}

      {avecPieces && (
        <button
          type="button"
          onClick={onPiecesJointes}
          aria-label="Ajouter une pièce jointe"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center border transition-colors"
          style={{
            borderRadius: "var(--axi-chat-rayon)",
            borderColor: "var(--axi-chat-bordure)",
            background: "var(--axi-chat-surface-interactive)",
            color: "var(--axi-chat-texte-secondaire)",
          }}
        >
          <Paperclip className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </button>
      )}

      <textarea
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnvoyer();
          }
        }}
        rows={3}
        placeholder={placeholderFinal}
        className="flex-1 resize-none px-4 py-2.5 text-sm leading-relaxed outline-none transition-colors"
        style={{
          borderRadius: "var(--axi-chat-rayon)",
          border: `1px solid var(--axi-chat-bordure)`,
          background: "var(--axi-chat-surface-interactive)",
          color: "var(--axi-chat-texte)",
        }}
      />

      <button
        type="submit"
        disabled={envoiDesactive || !valeur.trim()}
        aria-label="Envoyer"
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-white shadow-md transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          borderRadius: "var(--axi-chat-rayon)",
          background: `linear-gradient(135deg, var(--axi-chat-accent), var(--axi-chat-accent-secondaire))`,
          color: "var(--axi-chat-texte-sur-accent)",
        }}
      >
        <Send className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      </button>
    </form>
  );
}
