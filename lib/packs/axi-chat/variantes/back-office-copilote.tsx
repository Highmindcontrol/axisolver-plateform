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
  hauteur = "68vh",
}: {
  config: ConfigAxiChat;
  aileteGauche?: React.ReactNode;
  aileteDroite?: React.ReactNode;
  hauteur?: string;
}) {
  const { variablesCss, palette } = useTheme(config.theme);

  return (
    <section
      className="relative flex items-stretch gap-4 md:gap-6"
      style={{
        ...variablesCss,
        height: hauteur,
        minHeight: "600px",
      }}
    >
      {aileteGauche && (
        <>
          <aside className="hidden min-w-0 flex-[0_0_29%] self-stretch pt-10 md:block">
            {aileteGauche}
          </aside>
          <div
            aria-hidden
            className="hidden w-px self-stretch md:block"
            style={{
              background: `linear-gradient(to bottom, transparent, ${palette.bordure}66, transparent)`,
            }}
          />
        </>
      )}

      <main className="relative z-10 flex min-w-0 flex-1 flex-col pt-10">
        <AxiChatRoot config={config} />
      </main>

      {aileteDroite && (
        <>
          <div
            aria-hidden
            className="hidden w-px self-stretch md:block"
            style={{
              background: `linear-gradient(to bottom, transparent, ${palette.bordure}66, transparent)`,
            }}
          />
          <aside className="hidden min-w-0 flex-[0_0_29%] self-stretch pt-10 md:block">
            {aileteDroite}
          </aside>
        </>
      )}
    </section>
  );
}
