"use client";

import { Mic, Send, Sparkles } from "lucide-react";
import { useState } from "react";

type MessageUi = {
  id: string;
  role: "user" | "axi";
  content: string;
};

/**
 * Chat AXI interne (back-office client AxiSolver).
 *
 * Distinct du <ChatWidget> grand public qui vit sur les sites installés :
 * ici AXI accompagne le propriétaire d'un site AxiSolver — paramétrage,
 * ingestion de documents, lecture des rapports, demandes de passage à
 * un plan supérieur. L'endpoint `/api/dashboard/chat` sera branché
 * dans un prochain lot ; pour l'instant on démontre l'ergonomie.
 */
export function ChatAxiInterne({
  prenom,
  messagesInitiaux = [],
}: {
  prenom: string | null;
  messagesInitiaux?: MessageUi[];
}) {
  const [messages, setMessages] = useState<MessageUi[]>(
    messagesInitiaux.length > 0
      ? messagesInitiaux
      : [
          {
            id: "accueil",
            role: "axi",
            content: prenom
              ? `Bonjour ${prenom}. Je suis AXI, votre copilote AxiSolver. Dites-moi sur quel site ou sujet vous souhaitez travailler, je m'en occupe.`
              : "Bonjour. Je suis AXI, votre copilote AxiSolver. Dites-moi sur quel site ou sujet vous souhaitez travailler, je m'en occupe.",
          },
        ],
  );
  const [brouillon, setBrouillon] = useState("");

  function envoyer() {
    const texte = brouillon.trim();
    if (!texte) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: texte },
      {
        id: `a-${Date.now() + 1}`,
        role: "axi",
        content:
          "L'interface conversationnelle complète arrive dans le prochain lot. En attendant, utilisez les onglets de gauche pour configurer vos sites.",
      },
    ]);
    setBrouillon("");
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-lg">
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 text-white shadow"
            aria-hidden
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-100">AXI</p>
            <p className="text-[11px] text-slate-400">
              Votre copilote AxiSolver
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.map((m) => (
          <Bulle key={m.id} role={m.role}>
            {m.content}
          </Bulle>
        ))}
      </div>

      <form
        className="flex items-end gap-2 border-t border-slate-800 bg-slate-900 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          envoyer();
        }}
      >
        <textarea
          value={brouillon}
          onChange={(e) => setBrouillon(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              envoyer();
            }
          }}
          rows={1}
          placeholder="Écrivez à AXI…"
          className="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-500"
        />
        <button
          type="button"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 transition-colors hover:border-indigo-500 hover:text-indigo-300"
          title="Dicter (bientôt)"
          aria-label="Dicter un message"
          disabled
        >
          <Mic className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </button>
        <button
          type="submit"
          disabled={!brouillon.trim()}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </button>
      </form>
    </div>
  );
}

function Bulle({
  role,
  children,
}: {
  role: "user" | "axi";
  children: React.ReactNode;
}) {
  const estUser = role === "user";
  return (
    <div className={`flex ${estUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          estUser
            ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
            : "bg-slate-800 text-slate-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
