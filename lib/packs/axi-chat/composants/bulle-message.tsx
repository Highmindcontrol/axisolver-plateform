"use client";

import type { MessageAxi } from "../types";

/**
 * Bulle de message AXI, visiteur ou système.
 *
 * Pas de dépendance Tailwind-slate directe : les couleurs viennent
 * des variables CSS injectées par le conteneur parent (<AxiChatRoot>).
 *
 * Nettoyage markdown à l'affichage : même si Claude Sonnet lâche
 * des **gras** ou des ## titres malgré le prompt, on les élimine
 * avant le rendu pour que l'écran reste lisible.
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
          {nettoyerAffichage(message.contenu)}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${estVisiteur ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed"
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
        {estVisiteur ? message.contenu : nettoyerAffichage(message.contenu)}
      </div>
    </div>
  );
}

/**
 * Supprime le markdown résiduel que Claude Sonnet laisse parfois
 * malgré l'interdiction du system prompt : **gras**, *italique*,
 * `code`, ## titres, puces en début de ligne. On conserve le texte
 * lisible, pas de rendu HTML (volontairement — on veut UN texte,
 * pas un document stylé).
 */
function nettoyerAffichage(texte: string): string {
  return (
    texte
      // Titres markdown
      .replace(/^#{1,6}\s+/gm, "")
      // Séparateurs horizontaux
      .replace(/^[-=_]{3,}\s*$/gm, "")
      // Gras et italique
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/\b_([^_\n]+)_\b/g, "$1")
      // Astérisques orphelins
      .replace(/\*/g, "")
      // Code inline et blocs
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      // Liens markdown [texte](url) → texte
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Puces en début de ligne (- * •) + numéros (1. 2))
      .replace(/^\s*[-•]\s+/gm, "")
      .replace(/^\s*\d+[.)]\s+/gm, "")
      // Normalise les sauts de ligne (max 2 d'affilée)
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
