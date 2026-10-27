"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X, Loader2 } from "lucide-react";
import type { BrandingConfig } from "@/lib/db/schema";

/**
 * <WidgetChat> — composant chat multi-tenant pour l'embed sur sites
 * tiers. Chat simple avec streaming SSE sur /api/chat?slug={slug},
 * options d'accueil cliquables, branding paramétrable par site.
 *
 * V1 — version simplifiée (pas de triptyque, pas de panneau de
 * travail, pas de tools complexes). V1.1 alignera avec le ChatWidget
 * complet d'axisolver.app une fois les tools multi-tenant extraits.
 *
 * Communication avec le site hôte via postMessage :
 *   · { type: "axi:fermer" } → fermer l'overlay
 *   · { type: "axi:pret" } → signale au loader que le widget est chargé
 */

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function WidgetChat({
  slug,
  nomAssistant,
  nomEntreprise,
  optionsAccueil,
  branding,
  langueDefaut,
  afficherPropulsePar,
}: {
  slug: string;
  nomAssistant: string;
  nomEntreprise: string;
  optionsAccueil: Array<{ id: string; libelle: string }>;
  branding: BrandingConfig;
  langueDefaut: string;
  afficherPropulsePar: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "accueil",
      role: "assistant",
      content: `Bonjour, bienvenue sur ${nomEntreprise}. Je suis ${nomAssistant}. Que puis-je faire pour vous ?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [enCours, setEnCours] = useState(false);
  const visiteurAParle = messages.some((m) => m.role === "user");

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Signale au loader qu'on est prêt
  useEffect(() => {
    window.parent?.postMessage({ type: "axi:pret" }, "*");
  }, []);

  // Scroll bas à chaque nouveau message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const couleurPrincipale = branding.couleurPrincipale || "#4f46e5";
  const couleurSecondaire = branding.couleurSecondaire || "#8b5cf6";

  function fermer() {
    window.parent?.postMessage({ type: "axi:fermer" }, "*");
  }

  async function envoyer(contenu: string) {
    const texte = contenu.trim();
    if (!texte || enCours) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: texte,
    };
    const assistantMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
    };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");
    setEnCours(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const historique = messages
        .filter((m) => m.id !== "accueil")
        .map((m) => ({ role: m.role, content: m.content }))
        .concat([{ role: "user", content: texte }]);

      const res = await fetch(`/api/chat?slug=${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historique, slug }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE : chaque event est "data: {...}\n\n"
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const ligne = part.trim();
          if (!ligne.startsWith("data:")) continue;
          const json = ligne.slice(5).trim();
          if (!json) continue;
          try {
            const evt = JSON.parse(json) as {
              type: string;
              delta?: string;
              message?: string;
            };
            if (evt.type === "text_delta" && evt.delta) {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantMsg.id
                    ? { ...msg, content: msg.content + evt.delta }
                    : msg,
                ),
              );
            } else if (evt.type === "erreur") {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantMsg.id
                    ? {
                        ...msg,
                        content: `Désolé, une erreur est survenue : ${evt.message ?? ""}`,
                      }
                    : msg,
                ),
              );
            }
          } catch {
            // event mal formé, on continue
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantMsg.id
              ? {
                  ...msg,
                  content:
                    "Je n'arrive pas à joindre le serveur pour l'instant. Réessayez dans un instant.",
                }
              : msg,
          ),
        );
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div
      className="relative flex h-screen w-full flex-col overflow-hidden bg-white font-sans"
      style={{
        ["--axi-couleur-principale" as string]: couleurPrincipale,
        ["--axi-couleur-secondaire" as string]: couleurSecondaire,
      }}
    >
      {/* Header */}
      <header
        className="flex flex-shrink-0 items-center justify-between px-4 py-3 text-white shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${couleurPrincipale}, ${couleurSecondaire})`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold"
            aria-hidden
          >
            {nomAssistant.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">{nomAssistant}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/80">
              {nomEntreprise}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fermer}
          aria-label="Fermer la conversation"
          className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 px-4 py-5"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "text-white"
                  : "border border-slate-200 bg-white text-slate-900"
              }`}
              style={
                m.role === "user"
                  ? { background: couleurPrincipale }
                  : undefined
              }
            >
              {m.content || (
                <Loader2
                  className="h-4 w-4 animate-spin text-slate-400"
                  aria-label="En cours"
                />
              )}
            </div>
          </div>
        ))}

        {/* Options d'accueil tant que le visiteur n'a pas parlé */}
        {!visiteurAParle && optionsAccueil.length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            {optionsAccueil.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => envoyer(o.libelle)}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-left text-sm text-slate-900 shadow-sm transition-all hover:border-slate-400 hover:shadow-md"
              >
                {o.libelle}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          envoyer(input);
        }}
        className="flex flex-shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-3 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre message…"
          disabled={enCours}
          className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-100 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={enCours || !input.trim()}
          aria-label="Envoyer"
          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: couleurPrincipale }}
        >
          {enCours ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          )}
        </button>
      </form>

      {/* Mention « Propulsé par » */}
      {afficherPropulsePar && (
        <div className="flex flex-shrink-0 items-center justify-center border-t border-slate-100 bg-white px-4 py-2">
          <a
            href="https://axisolver.app"
            target="_blank"
            rel="noopener"
            className="text-[10px] font-medium uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
          >
            Propulsé par AxiSolver
          </a>
        </div>
      )}
    </div>
  );
}
