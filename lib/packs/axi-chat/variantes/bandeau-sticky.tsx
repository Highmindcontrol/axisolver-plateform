"use client";

import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

import { useTheme } from "../theme/use-theme";
import type { ConfigAxiChat } from "../types";

import { AxiChatCopilote } from "./back-office-copilote";

/**
 * Variante « bandeau sticky + dépliage inline cinéma ».
 *
 * État par défaut : bandeau sticky fin (~48 px) collé en haut de son
 * conteneur, discret, affiche l'identité AXI + toggle de dépliage.
 *
 * Au clic : le triptyque `AxiChatCopilote` se **déplie en place sur la
 * page** (pousse le contenu en dessous vers le bas, PAS d'overlay
 * plein écran). L'ouverture joue l'**animation lente écran de cinéma**
 * paramétrable via `dureeMs` (défaut 2,8 s) :
 *   - rideau sombre qui s'estompe
 *   - triptyque qui grandit en fade + scale + glissement vertical
 *
 * Préférence utilisateur (ouvert/replié) persistée via localStorage
 * sous `clePersistance` (défaut "axi-chat-bandeau-sticky-ouvert").
 *
 * Pensé pour les pages dashboard où AXI doit être accessible en
 * permanence sans occuper d'espace écran quand non utilisé.
 */

export function AxiChatBandeauSticky({
  config,
  aileteGauche,
  aileteDroite,
  avecAilettes = true,
  hauteur = "min(68vh, 760px)",
  dureeMs = 2800,
  texteOuvrir = "Clique pour ouvrir",
  texteReplier = "Replier",
  nomAffiche,
  sousTitre,
  clePersistance = "axi-chat-bandeau-sticky-ouvert",
  defautOuvert = false,
}: {
  config: ConfigAxiChat;
  aileteGauche?: React.ReactNode;
  aileteDroite?: React.ReactNode;
  avecAilettes?: boolean;
  /** Hauteur CSS du triptyque quand déplié. */
  hauteur?: string;
  /** Durée de l'animation d'ouverture en ms (défaut 2 800 — vraiment
   *  lent, matérialise la pensée profonde). */
  dureeMs?: number;
  /** Libellés toggle. */
  texteOuvrir?: string;
  texteReplier?: string;
  /** Nom et sous-titre affichés dans le bandeau (défauts tirés de
   *  config.contexte si non fournis). */
  nomAffiche?: string;
  sousTitre?: string;
  /** Clé localStorage pour persister l'état ouvert/replié. */
  clePersistance?: string;
  /** État initial avant lecture du localStorage. */
  defautOuvert?: boolean;
}) {
  const [ouvert, setOuvert] = useState(defautOuvert);
  const [visible, setVisible] = useState(false);
  const { palette } = useTheme(config.theme);

  const nom = nomAffiche ?? config.contexte?.nomAssistant ?? "AXI";
  const soustitre =
    sousTitre ?? config.contexte?.sousTitre ?? "Votre copilote";

  // Récupération préférence au mount (SSR-safe).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sauve = window.localStorage.getItem(clePersistance);
    if (sauve === "1") setOuvert(true);
    else if (sauve === "0") setOuvert(false);
  }, [clePersistance]);

  // Animation d'entrée : micro-délai pour que la transition CSS parte
  // bien de l'état initial.
  useEffect(() => {
    if (ouvert) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [ouvert]);

  function basculerOuvert(valeur: boolean) {
    setOuvert(valeur);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(clePersistance, valeur ? "1" : "0");
    }
  }

  // Durée volontairement longue (défaut 2,8 s) — on ne vend pas la
  // pensée profonde en 4 secondes. Transition appliquée sur la
  // propriété `grid-template-rows` d'un wrapper grid : passage de
  // `0fr` (replié, hauteur 0) à `1fr` (déplié, hauteur auto). C'est la
  // technique moderne pour animer vers `height: auto`.
  const transitionCss = `grid-template-rows ${dureeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;

  return (
    <>
      {/* Bandeau sticky — toujours visible, trigger d'ouverture */}
      <button
        type="button"
        onClick={() => basculerOuvert(!ouvert)}
        aria-label={ouvert ? texteReplier : texteOuvrir}
        aria-expanded={ouvert}
        className="group sticky top-0 z-30 flex w-full items-center justify-between gap-3 border-b px-6 py-3 text-left transition-colors"
        style={{
          background: palette.fond,
          borderColor: palette.bordure,
          color: palette.texte,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full shadow"
            style={{
              background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentSecondaire})`,
              color: palette.texteSurAccent,
            }}
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-sm font-semibold tracking-tight">{nom}</span>
          <span
            className="text-xs"
            style={{ color: palette.texteSecondaire }}
          >
            · {soustitre}
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity group-hover:opacity-100"
          style={{ color: palette.texteSecondaire, opacity: 0.85 }}
        >
          {ouvert ? (
            <>
              {texteReplier}
              <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.4} />
            </>
          ) : (
            <>
              {texteOuvrir}
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.4} />
            </>
          )}
        </span>
      </button>

      {/* Dépliage inline façon rideau de cinéma — le conteneur grandit
          physiquement de hauteur 0 à sa hauteur finale sur dureeMs. Le
          contenu reste visible dès le départ ; c'est le pliage/
          dépliage du bloc lui-même qui est animé.
          Technique : wrapper `grid` avec `grid-template-rows` qui passe
          de `0fr` à `1fr`, l'enfant pose `min-h-0` + `overflow-hidden`
          pour que le découpage soit propre pendant la transition. */}
      <div
        aria-hidden={!visible}
        style={{
          display: "grid",
          gridTemplateRows: visible ? "1fr" : "0fr",
          transition: transitionCss,
          background: palette.fond,
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-6 py-5">
            <AxiChatCopilote
              config={config}
              avecAilettes={avecAilettes}
              hauteur={hauteur}
              aileteGauche={aileteGauche}
              aileteDroite={aileteDroite}
            />
          </div>
        </div>
      </div>
    </>
  );
}
