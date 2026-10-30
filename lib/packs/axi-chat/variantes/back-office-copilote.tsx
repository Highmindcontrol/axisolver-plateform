"use client";

import type React from "react";

import { useTheme } from "../theme/use-theme";
import type { ConfigAxiChat } from "../types";

import { AxiChatRoot } from "../composants/axi-chat-root";

/**
 * Variante « back-office copilote » — triptyque dashboard.
 *
 * Trois colonnes : ailette gauche custom (slot) + chat AXI central
 * + ailette droite custom (slot). Pensée pour les dashboards des
 * sites AXI (AxiSolver, AxiHub, Coryphea, Question de Droit…).
 *
 * Chaque consommateur fournit ses propres ailettes via les slots —
 * le pack ne connaît pas les sites/carnet/etc. qui sont spécifiques.
 */
export function AxiChatCopilote({
  config,
  aileteGauche,
  aileteDroite,
  avecAilettes = true,
  hauteur = "68vh",
}: {
  config: ConfigAxiChat;
  aileteGauche?: React.ReactNode;
  aileteDroite?: React.ReactNode;
  /**
   * Si true, affiche TOUJOURS les 3 colonnes et les 2 séparateurs
   * verticaux (même si les ailettes sont vides). Les ailettes se
   * rempliront progressivement selon le contexte de la conversation
   * (actions prises par AXI, documents consultés, etc.).
   */
  avecAilettes?: boolean;
  hauteur?: string;
}) {
  const { variablesCss, palette } = useTheme(config.theme);

  const separateur = (
    <div
      aria-hidden
      className="hidden w-px self-stretch md:block"
      style={{
        background: `linear-gradient(to bottom, transparent, ${palette.bordure}66, transparent)`,
      }}
    />
  );

  return (
    <section
      className="relative flex items-stretch gap-4 md:gap-6"
      style={{
        ...variablesCss,
        height: hauteur,
        minHeight: "600px",
      }}
    >
      {avecAilettes && (
        <>
          <aside className="hidden min-w-0 flex-[0_0_29%] self-stretch pt-0 md:block">
            {aileteGauche ?? null}
          </aside>
          {separateur}
        </>
      )}

      <main className="relative z-10 flex min-w-0 flex-1 flex-col pt-0">
        <AxiChatRoot config={config} />
      </main>

      {avecAilettes && (
        <>
          {separateur}
          <aside className="hidden min-w-0 flex-[0_0_29%] self-stretch pt-0 md:block">
            {aileteDroite ?? null}
          </aside>
        </>
      )}
    </section>
  );
}
