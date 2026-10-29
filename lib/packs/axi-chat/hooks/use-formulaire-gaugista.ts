"use client";

import { useEffect, useState } from "react";

import type { JaugeConfig } from "../types";

/**
 * Hook de récupération dynamique des jauges Gaugista.
 *
 * Fetch GET sur l'URL fournie (typiquement un proxy serveur qui relaie
 * vers gaugista.com/api/v1/entreprises/[slug] avec la clé API). La
 * réponse attendue :
 *   { ok: true, jauges: [{ cle, libelle, question? }] }
 *
 * Si l'URL n'est pas fournie, le hook ne charge rien (undefined
 * jauges) — le modal retombe sur ses jauges par défaut.
 */

type EtatFormulaire = "repos" | "chargement" | "charge" | "erreur";

export function useFormulaireGaugista(urlFormulaire: string | undefined): {
  etat: EtatFormulaire;
  jauges: JaugeConfig[] | undefined;
  erreur: string | null;
} {
  const [etat, setEtat] = useState<EtatFormulaire>(
    urlFormulaire ? "chargement" : "repos",
  );
  const [jauges, setJauges] = useState<JaugeConfig[] | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!urlFormulaire) {
      setEtat("repos");
      setJauges(undefined);
      return;
    }
    let annule = false;
    setEtat("chargement");
    setErreur(null);
    fetch(urlFormulaire)
      .then(async (resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as {
          ok?: boolean;
          jauges?: JaugeConfig[];
        };
        if (!annule) {
          if (data.jauges && data.jauges.length > 0) {
            setJauges(data.jauges);
            setEtat("charge");
          } else {
            setJauges(undefined);
            setEtat("erreur");
            setErreur("Aucune jauge configurée côté Gaugista.");
          }
        }
      })
      .catch((e) => {
        if (!annule) {
          setErreur(
            e instanceof Error ? e.message : "Chargement du formulaire impossible.",
          );
          setEtat("erreur");
        }
      });
    return () => {
      annule = true;
    };
  }, [urlFormulaire]);

  return { etat, jauges, erreur };
}
