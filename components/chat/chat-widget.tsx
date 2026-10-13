"use client";

/**
 * Composant Chat intégré au hero de axisolver.app.
 *
 * Ici AxiSolver EST le vendeur. Pas de bulle flottante bottom-right —
 * la conversation est au cœur de la page. Le visiteur voit immédiatement
 * ce qu'il obtiendrait sur son propre site : un AXI qui l'accueille,
 * mène l'entretien, qualifie et oriente vers l'adoption.
 *
 * Phase 1 (ce fichier) : UI complète + animations, mais messages
 * pré-scriptés côté client. Permet de valider l'ergonomie avant de
 * brancher Claude.
 *
 * Phase 2 (à venir) : brancher POST /api/chat avec streaming SSE,
 * conserver la mémoire de session, scripter les questions imposées.
 */

import { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string };

const MESSAGE_ACCUEIL: ChatMessage = {
  id: "accueil",
  role: "assistant",
  content:
    "Bonjour. Je suis AxiSolver. Ne perdons pas de temps : je peux vous montrer en 3 minutes ce que je ferais sur votre site. Vous dirigez quoi comme activité ?",
};

export function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([MESSAGE_ACCEUIL_INITIAL()]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  function envoyer() {
    const texte = input.trim();
    if (!texte || thinking) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: texte,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    // Placeholder Phase 1 — réponse pré-scriptée après délai pour l'effet.
    // Phase 2 remplacera ça par un appel streaming à /api/chat.
    setTimeout(() => {
      const reponse: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Bonne base. Un dernier mot avant qu'on avance : AxiSolver sera branché en direct dès que la clé Claude sera posée côté serveur. En attendant, pour composer votre équipe AXI et souscrire, direction axihub.live — AXI vous y attend en live.",
      };
      setMessages((prev) => [...prev, reponse]);
      setThinking(false);
    }, 900);
  }

  return (
    <div className="flex h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:h-[560px]">
      {/* Header avec pastille "AXI en ligne" pulsante */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4 text-white">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
          A
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-blue-700" />
          </span>
        </div>
        <div className="flex-1">
          <div className="font-semibold leading-tight">AxiSolver</div>
          <div className="text-xs font-medium text-blue-100">
            En ligne — répond maintenant
          </div>
        </div>
      </div>

      {/* Fil de messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-5"
      >
        {messages.map((msg) => (
          <MessageBulle key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {thinking && <IndicateurFrappe />}
      </div>

      {/* Input */}
      <form
        className="border-t border-slate-100 bg-white px-3 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          envoyer();
        }}
      >
        <div className="flex items-end gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={thinking}
            placeholder="Posez votre question…"
            className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Envoyer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="mt-2 px-2 text-[11px] text-slate-400">
          AxiSolver répond en direct — pas de formulaire, pas de robot
          scripté.
        </div>
      </form>
    </div>
  );
}

/** Message avec initialisation UUID safe (crypto peut manquer SSR). */
function MESSAGE_ACCEUIL_INITIAL(): ChatMessage {
  return { ...MESSAGE_ACCUEIL };
}

function MessageBulle({ role, content }: { role: Role; content: string }) {
  if (role === "assistant") {
    return (
      <div className="flex gap-2">
        <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
          A
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-900 shadow-sm">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
        {content}
      </div>
    </div>
  );
}

function IndicateurFrappe() {
  return (
    <div className="flex gap-2">
      <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
        A
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
        </div>
      </div>
    </div>
  );
}
