"use client";

import type { MessageAxi } from "../types";

/**
 * Bulle de message AXI, visiteur ou système.
 *
 * Pas de dépendance Tailwind-slate directe : les couleurs viennent
 * des variables CSS injectées par le conteneur parent (<AxiChatRoot>).
 */
export function BulleMessage({ message }: { message: MessageAxi }) {
  if (message.invisible) return null;

  const estVisiteur = message.role === "visiteur";
  const estSysteme = message.role === "systeme";

  if (estSysteme) {
    return (
      <div className="flex justify-center py-1">
        <p
          className="text-[11px] italic"
          style={{ color: "var(--axi-chat-texte-tertiaire)" }}
        >
          {message.contenu}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${estVisiteur ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] px-4 py-2.5 text-sm leading-relaxed"
        style={{
          borderRadius: "var(--axi-chat-rayon)",
          background: estVisiteur
            ? `linear-gradient(135deg, var(--axi-chat-accent), var(--axi-chat-accent-secondaire))`
            : "var(--axi-chat-surface)",
          color: estVisiteur
            ? "var(--axi-chat-texte-sur-accent)"
            : "var(--axi-chat-texte)",
        }}
      >
        {message.contenu}
      </div>
    </div>
  );
}
