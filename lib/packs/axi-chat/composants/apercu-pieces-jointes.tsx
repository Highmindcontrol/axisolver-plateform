"use client";

import { FileText, Image as ImageIcon, Music, Paperclip, X } from "lucide-react";

import type { PieceJointe } from "../types";

/**
 * Vignettes des pièces jointes attachées au message en cours de
 * composition. Affiché juste au-dessus de la zone de saisie.
 */
export function ApercuPiecesJointes({
  pieces,
  enCours,
  onRetirer,
}: {
  pieces: PieceJointe[];
  enCours: number;
  onRetirer: (id: string) => void;
}) {
  if (pieces.length === 0 && enCours === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {pieces.map((p) => (
        <VignettePJ key={p.id} piece={p} onRetirer={() => onRetirer(p.id)} />
      ))}
      {Array.from({ length: enCours }).map((_, i) => (
        <div
          key={`en-cours-${i}`}
          className="flex items-center gap-2 px-3 py-1.5 text-xs animate-pulse"
          style={{
            borderRadius: "var(--axi-chat-rayon)",
            border: `1px dashed var(--axi-chat-bordure)`,
            background: "var(--axi-chat-surface)",
            color: "var(--axi-chat-texte-tertiaire)",
          }}
        >
          <Paperclip className="h-3 w-3" strokeWidth={2.4} aria-hidden />
          Envoi en cours…
        </div>
      ))}
    </div>
  );
}

function VignettePJ({
  piece,
  onRetirer,
}: {
  piece: PieceJointe;
  onRetirer: () => void;
}) {
  const Icone =
    piece.type === "image"
      ? ImageIcon
      : piece.type === "pdf" || piece.type === "fichier"
        ? FileText
        : piece.type === "audio"
          ? Music
          : FileText;

  const estImage = piece.type === "image";

  return (
    <div
      className="group relative flex items-center gap-2 px-3 py-1.5 text-xs"
      style={{
        borderRadius: "var(--axi-chat-rayon)",
        border: `1px solid var(--axi-chat-bordure)`,
        background: "var(--axi-chat-surface)",
        color: "var(--axi-chat-texte)",
      }}
    >
      {estImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={piece.url}
          alt={piece.nom}
          className="h-6 w-6 rounded object-cover"
        />
      ) : (
        <Icone
          className="h-3.5 w-3.5"
          strokeWidth={2.2}
          aria-hidden
          style={{ color: "var(--axi-chat-texte-secondaire)" }}
        />
      )}
      <span className="max-w-[160px] truncate">{piece.nom}</span>
      <button
        type="button"
        onClick={onRetirer}
        aria-label={`Retirer ${piece.nom}`}
        className="flex h-4 w-4 flex-shrink-0 items-center justify-center transition-colors"
        style={{
          borderRadius: "9999px",
          color: "var(--axi-chat-texte-tertiaire)",
        }}
      >
        <X className="h-3 w-3" strokeWidth={2.4} />
      </button>
    </div>
  );
}
