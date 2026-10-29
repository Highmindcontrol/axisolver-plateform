"use client";

import { useCallback, useRef, useState } from "react";

import type { PieceJointe } from "../types";

/**
 * Hook upload de pièces jointes.
 *
 * Upload HTTP via multipart/form-data vers `urlUpload`. Attend en retour
 * `{ pieces: PieceJointe[] }`. Les uploads en cours sont trackés dans
 * `enCours` pour affichage UI.
 */

type OptionsUpload = {
  urlUpload: string;
  entetes?: Record<string, string>;
  /** Taille max en octets (défaut : 10 Mo). */
  tailleMaxOctets?: number;
  /** Types MIME acceptés (défaut : images + pdf + audio). */
  typesAcceptes?: string[];
};

export function usePiecesJointes(options: OptionsUpload): {
  pieces: PieceJointe[];
  enCours: number;
  erreur: string | null;
  input: {
    ref: React.RefObject<HTMLInputElement | null>;
    accept: string;
    onChange: (ev: React.ChangeEvent<HTMLInputElement>) => void;
  };
  ouvrir: () => void;
  retirer: (id: string) => void;
  vider: () => void;
} {
  const [pieces, setPieces] = useState<PieceJointe[]>([]);
  const [enCours, setEnCours] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const refInput = useRef<HTMLInputElement | null>(null);

  const tailleMax = options.tailleMaxOctets ?? 10 * 1024 * 1024;
  const types = options.typesAcceptes ?? [
    "image/*",
    "application/pdf",
    "audio/*",
  ];
  const accept = types.join(",");

  const ouvrir = useCallback(() => refInput.current?.click(), []);

  const onChange = useCallback(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      const fichiers = Array.from(ev.target.files ?? []);
      ev.target.value = "";
      if (fichiers.length === 0) return;

      setErreur(null);
      for (const f of fichiers) {
        if (f.size > tailleMax) {
          setErreur(
            `« ${f.name} » dépasse ${Math.round(tailleMax / 1024 / 1024)} Mo.`,
          );
          continue;
        }
        setEnCours((n) => n + 1);
        try {
          const form = new FormData();
          form.append("fichier", f);
          const resp = await fetch(options.urlUpload, {
            method: "POST",
            headers: options.entetes,
            body: form,
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const data = (await resp.json()) as { piece?: PieceJointe };
          if (data.piece) {
            setPieces((prev) => [...prev, data.piece as PieceJointe]);
          }
        } catch (e) {
          setErreur(
            e instanceof Error
              ? `Upload de « ${f.name} » : ${e.message}`
              : `Upload de « ${f.name} » impossible.`,
          );
        } finally {
          setEnCours((n) => n - 1);
        }
      }
    },
    [options.urlUpload, options.entetes, tailleMax],
  );

  const retirer = useCallback(
    (id: string) => setPieces((prev) => prev.filter((p) => p.id !== id)),
    [],
  );
  const vider = useCallback(() => setPieces([]), []);

  return {
    pieces,
    enCours,
    erreur,
    input: { ref: refInput, accept, onChange },
    ouvrir,
    retirer,
    vider,
  };
}
