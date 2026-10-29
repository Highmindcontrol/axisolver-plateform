"use client";

import { useCallback, useState } from "react";

/**
 * Hook d'envoi d'une notation Gaugista.
 *
 * POST sur `urlGaugista` avec payload :
 *   {
 *     notes: { utile: 8, claire: 7, ... },
 *     commentaire?: string,
 *     sourceRef?: string,
 *     sourceUrl?: string
 *   }
 *
 * L'URL cible est en principe un **proxy** côté serveur du site hôte
 * (ex: AxiSolver `/api/widget/[slug]/notation`) qui relaie vers
 * `gaugista.com/api/v1/notations` en y injectant la clé API serveur.
 * Jamais la clé API Gaugista en clair côté client.
 */

type EtatNotation = "repos" | "envoi" | "envoye" | "erreur";

type OptionsNotation = {
  urlGaugista: string;
  entetes?: Record<string, string>;
  sourceRef?: string;
};

export function useNotationGaugista(options: OptionsNotation): {
  etat: EtatNotation;
  erreur: string | null;
  envoyer: (
    notes: Record<string, number>,
    commentaire?: string,
  ) => Promise<boolean>;
  reinitialiser: () => void;
} {
  const [etat, setEtat] = useState<EtatNotation>("repos");
  const [erreur, setErreur] = useState<string | null>(null);

  const envoyer = useCallback(
    async (notes: Record<string, number>, commentaire?: string) => {
      setEtat("envoi");
      setErreur(null);
      try {
        const sourceUrl =
          typeof window !== "undefined" ? window.location.href : undefined;
        const resp = await fetch(options.urlGaugista, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(options.entetes ?? {}),
          },
          body: JSON.stringify({
            notes,
            commentaire,
            sourceRef: options.sourceRef,
            sourceUrl,
          }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        setEtat("envoye");
        return true;
      } catch (e) {
        setErreur(
          e instanceof Error ? e.message : "Envoi de la notation impossible.",
        );
        setEtat("erreur");
        return false;
      }
    },
    [options.urlGaugista, options.entetes, options.sourceRef],
  );

  const reinitialiser = useCallback(() => {
    setEtat("repos");
    setErreur(null);
  }, []);

  return { etat, erreur, envoyer, reinitialiser };
}
