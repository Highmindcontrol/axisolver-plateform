"use client";

import { MessageCircle, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

import { AxiChatRoot } from "../composants/axi-chat-root";
import { useTheme } from "../theme/use-theme";
import type { ConfigAxiChat, PositionWidgetFlottant } from "../types";

/**
 * Variante « widget flottant » — bulle ancrée dans un coin de l'écran,
 * ouvre une fenêtre de chat en overlay (ne pousse PAS la page).
 *
 * 4 positions possibles (bas-droite par défaut). Comportement standard
 * d'un chat support type Intercom/Crisp : bulle discrète + panneau de
 * conversation qui monte depuis le coin ancré.
 *
 * Position fixed → le widget suit le scroll. Z-index élevé pour passer
 * au-dessus du contenu du site hôte.
 */
export function AxiChatWidgetFlottant({
  config,
  position = "bas-droite",
  marge = 24,
  tailleBulle = 56,
  largeurPanneau = 400,
  hauteurPanneau = 600,
  logo,
  teaser,
  defautOuvert = false,
}: {
  config: ConfigAxiChat;
  position?: PositionWidgetFlottant;
  /** Marge en px entre le widget et le bord de l'écran. */
  marge?: number;
  /** Diamètre de la bulle fermée (px). */
  tailleBulle?: number;
  /** Largeur du panneau ouvert (px). */
  largeurPanneau?: number;
  /** Hauteur du panneau ouvert (px). */
  hauteurPanneau?: number;
  /** Logo custom à l'intérieur de la bulle (sinon icône message par défaut). */
  logo?: React.ReactNode;
  /**
   * Message bulle « teaser » affiché à côté de la bulle fermée.
   * Si fourni, apparaît au bout de 3 secondes au chargement.
   */
  teaser?: string;
  defautOuvert?: boolean;
}) {
  const [ouvert, setOuvert] = useState(defautOuvert);
  const { variablesCss, palette } = useTheme(config.theme);

  const { ancreVertical, ancreHorizontal, origineTransformation } =
    coordonneesPosition(position);

  const stylePositionCommun: React.CSSProperties = {
    position: "fixed",
    [ancreVertical]: `${marge}px`,
    [ancreHorizontal]: `${marge}px`,
    zIndex: 2147483000,
  };

  return (
    <>
      {/* Bulle fermée */}
      {!ouvert && (
        <div style={stylePositionCommun} className="flex items-center gap-3">
          {position.endsWith("droite") && teaser && (
            <Teaser palette={palette} contenu={teaser} />
          )}
          <button
            type="button"
            onClick={() => setOuvert(true)}
            aria-label="Ouvrir la conversation avec AXI"
            className="flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            style={{
              width: `${tailleBulle}px`,
              height: `${tailleBulle}px`,
              borderRadius: "9999px",
              background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentSecondaire})`,
              color: palette.texteSurAccent,
            }}
          >
            {logo ?? (
              <MessageCircle
                className="h-6 w-6"
                strokeWidth={2.2}
                aria-hidden
              />
            )}
          </button>
          {position.endsWith("gauche") && teaser && (
            <Teaser palette={palette} contenu={teaser} />
          )}
        </div>
      )}

      {/* Panneau ouvert */}
      {ouvert && (
        <div
          role="dialog"
          aria-label="Conversation avec AXI"
          style={{
            ...stylePositionCommun,
            width: `min(${largeurPanneau}px, calc(100vw - ${marge * 2}px))`,
            height: `min(${hauteurPanneau}px, calc(100vh - ${marge * 2}px))`,
            transformOrigin: origineTransformation,
          }}
          className="animate-axiChatOuverture flex flex-col overflow-hidden shadow-2xl"
        >
          <div
            className="flex-1 overflow-hidden"
            style={{
              ...variablesCss,
              background: palette.fond,
              borderRadius: "1rem",
              border: `1px solid ${palette.bordure}`,
            }}
          >
            <div className="relative flex h-full flex-col px-5 pb-4 pt-3">
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer la conversation"
                className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center transition-colors"
                style={{
                  borderRadius: "9999px",
                  background: palette.surface,
                  color: palette.texteSecondaire,
                }}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
              <AxiChatRoot config={config} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes axiChatOuverture {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-axiChatOuverture {
          animation: axiChatOuverture 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </>
  );
}

function Teaser({
  palette,
  contenu,
}: {
  palette: { fond: string; texte: string; bordure: string };
  contenu: string;
}) {
  return (
    <div
      className="max-w-[240px] px-3 py-2 text-xs shadow-md"
      style={{
        borderRadius: "0.75rem",
        background: palette.fond,
        border: `1px solid ${palette.bordure}`,
        color: palette.texte,
      }}
    >
      {contenu}
    </div>
  );
}

function coordonneesPosition(position: PositionWidgetFlottant): {
  ancreVertical: "top" | "bottom";
  ancreHorizontal: "left" | "right";
  origineTransformation: string;
} {
  switch (position) {
    case "haut-gauche":
      return {
        ancreVertical: "top",
        ancreHorizontal: "left",
        origineTransformation: "top left",
      };
    case "haut-droite":
      return {
        ancreVertical: "top",
        ancreHorizontal: "right",
        origineTransformation: "top right",
      };
    case "bas-gauche":
      return {
        ancreVertical: "bottom",
        ancreHorizontal: "left",
        origineTransformation: "bottom left",
      };
    case "bas-droite":
    default:
      return {
        ancreVertical: "bottom",
        ancreHorizontal: "right",
        origineTransformation: "bottom right",
      };
  }
}
