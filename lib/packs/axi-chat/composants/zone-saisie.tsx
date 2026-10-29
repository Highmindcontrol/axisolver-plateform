"use client";

import { Mic, MicOff, Paperclip, Send } from "lucide-react";

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

  return (
    <form
      className="flex items-end gap-2 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        onEnvoyer();
      }}
    >
      {avecPieces && (
        <button
          type="button"
          onClick={onPiecesJointes}
          aria-label="Ajouter une pièce jointe"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center border transition-colors"
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
        rows={1}
        placeholder={placeholder ?? "Écrivez à AXI…"}
        className="flex-1 resize-none px-4 py-2.5 text-sm outline-none transition-colors"
        style={{
          borderRadius: "var(--axi-chat-rayon)",
          border: `1px solid var(--axi-chat-bordure)`,
          background: "var(--axi-chat-surface-interactive)",
          color: "var(--axi-chat-texte)",
        }}
      />

      {avecDictee && (
        <button
          type="button"
          onClick={onDictee}
          aria-label={dicteeActive ? "Arrêter la dictée" : "Dicter un message"}
          aria-pressed={dicteeActive}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center border transition-colors"
          style={{
            borderRadius: "var(--axi-chat-rayon)",
            borderColor: dicteeActive
              ? "var(--axi-chat-accent)"
              : "var(--axi-chat-bordure)",
            background: dicteeActive
              ? "var(--axi-chat-accent)"
              : "var(--axi-chat-surface-interactive)",
            color: dicteeActive
              ? "var(--axi-chat-texte-sur-accent)"
              : "var(--axi-chat-texte-secondaire)",
          }}
        >
          {dicteeActive ? (
            <MicOff className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          ) : (
            <Mic className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          )}
        </button>
      )}

      <button
        type="submit"
        disabled={envoiDesactive || !valeur.trim()}
        aria-label="Envoyer"
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-white shadow-md transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
