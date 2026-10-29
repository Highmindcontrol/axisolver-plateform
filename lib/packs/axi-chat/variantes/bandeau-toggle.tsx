"use client";

import { ChevronDown } from "lucide-react";
import type React from "react";
import { useState } from "react";

import { AxiChatRoot } from "../composants/axi-chat-root";
import { useTheme } from "../theme/use-theme";
import type { ConfigAxiChat, PositionBandeau } from "../types";

/**
 * Variante « bandeau toggle » — barre pleine largeur + panneau
 * déroulant qui POUSSE la page (pas d'overlay).
 *
 * Reproduit à l'identique l'interaction du dashboard AxiSolver. Pensée
 * pour s'installer juste sous le menu principal d'un site client :
 * clic → la conversation descend lentement et pousse le contenu de
 * la page vers le bas. Second clic → remonte.
 *
 * Position :
 *  - "haut" : bandeau s'installe en haut de la page sous le menu
 *  - "bas"  : bandeau s'installe en bas de la page avant le footer
 *
 * Pas de dépendance au layout du site : le bandeau est en flux
 * normal (position: static), pas en fixed/absolute.
 */
export function AxiChatBandeauToggle({
  config,
  position = "haut",
  libelleFerme = "Converser avec AXI",
  libelleOuvert = "Conversation avec AXI",
  sousTitreFerme = "Ouvrez le copilote AXI — questions, actions, support.",
  sousTitreOuvert = "Fermer la fenêtre de conversation.",
  logo,
  defautOuvert = false,
  dureeMs = 1800,
}: {
  config: ConfigAxiChat;
  position?: PositionBandeau;
  libelleFerme?: string;
  libelleOuvert?: string;
  sousTitreFerme?: string;
  sousTitreOuvert?: string;
  logo?: React.ReactNode;
  defautOuvert?: boolean;
  dureeMs?: number;
}) {
  const [ouvert, setOuvert] = useState(defautOuvert);
  const { variablesCss, palette } = useTheme(config.theme);

  const barre = (
    <button
      type="button"
      onClick={() => setOuvert((v) => !v)}
      aria-expanded={ouvert}
      aria-controls="axi-chat-bandeau-panneau"
      className="group relative flex w-full items-center justify-between gap-5 overflow-hidden border-b px-6 py-6 text-left transition-colors md:px-14 lg:px-16"
      style={{
        borderColor: palette.bordure,
        background: palette.fond,
        color: palette.texte,
      }}
    >
      {!ouvert && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 top-0 w-32 animate-axiChatShine bg-gradient-to-r from-transparent via-white/20 to-transparent blur-[2px]"
        />
      )}

      <div className="relative flex items-center gap-5">
        <span
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden shadow-md ring-1"
          style={{
            borderRadius: "9999px",
            background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentSecondaire})`,
            // @ts-expect-error — var CSS personnalisée
            "--tw-ring-color": `${palette.bordureAccent}33`,
          }}
          aria-hidden
        >
          {logo ?? (
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          )}
        </span>
        <div>
          <p
            className="text-base font-semibold"
            style={{ color: palette.texte }}
          >
            {ouvert ? libelleOuvert : libelleFerme}
          </p>
          <p
            className="mt-1 text-sm"
            style={{ color: palette.texteSecondaire }}
          >
            {ouvert ? sousTitreOuvert : sousTitreFerme}
          </p>
        </div>
      </div>
      <span
        className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center border transition-all"
        style={{
          borderRadius: "9999px",
          borderColor: palette.bordure,
          background: palette.surface,
          color: palette.texteSecondaire,
          transform: ouvert ? "rotate(180deg)" : "none",
        }}
        aria-hidden
      >
        <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
      </span>
    </button>
  );

  const panneau = (
    <div
      id="axi-chat-bandeau-panneau"
      aria-hidden={!ouvert}
      className="grid overflow-hidden transition-[grid-template-rows] ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        gridTemplateRows: ouvert ? "1fr" : "0fr",
        transitionDuration: `${dureeMs}ms`,
      }}
    >
      <div
        className="relative min-h-0 overflow-hidden"
        style={variablesCss}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: palette.fond }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full blur-3xl"
          style={{ background: `${palette.accent}33` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/4 top-1/3 h-80 w-80 rounded-full blur-3xl"
          style={{ background: `${palette.accentSecondaire}26` }}
        />

        <div
          className="relative z-10 flex px-6 py-10 md:px-14 lg:px-16"
          style={{ minHeight: "600px", height: "68vh" }}
        >
          <main className="relative flex min-w-0 flex-1 flex-col pt-4">
            <AxiChatRoot config={config} />
          </main>
        </div>
      </div>
    </div>
  );

  return (
    <section className="w-full">
      {position === "haut" ? (
        <>
          {barre}
          {panneau}
        </>
      ) : (
        <>
          {panneau}
          {barre}
        </>
      )}
      <style>{`
        @keyframes axiChatShine {
          0% { transform: translateX(-100%); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(2000%); opacity: 0; }
        }
        .animate-axiChatShine {
          animation: axiChatShine 7s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
