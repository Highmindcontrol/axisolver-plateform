"use client";

/**
 * ChatWidget — composant complet de la conversation AxiSolver sur
 * axisolver.app.
 *
 * Lot A : split-view (chat à gauche, panneau de travail à droite).
 * - Le chat affiche les messages texte en streaming.
 * - Le panneau de travail affiche en live ce qu'AxiSolver fait :
 *   fiche visiteur qui se remplit, champs email/téléphone à saisir,
 *   boutons de choix, téléchargements, référence AXI-XXXX, morpion.
 *
 * Communication avec le backend :
 *   POST /api/chat retourne un stream SSE multiplexé avec deux types
 *   d'events : {type:"text_delta",delta:"..."} pour le texte conversation
 *   et {type:"tool_use",tool:"...",input:{...}} pour les commandes du
 *   panneau. Le composant parse les deux et met à jour l'UI en temps réel.
 */

import { useEffect, useRef, useState } from "react";
import { PanneauTravail } from "./panneau-travail";
import {
  ETAT_PANNEAU_INITIAL,
  type EtatPanneauTravail,
} from "@/lib/axi-solver/tools";

type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string };

const CONTENU_ACCUEIL =
  "Bonjour. Je suis AxiSolver. Ne perdons pas de temps : je peux vous montrer en 3 minutes ce que je ferais sur votre site. Vous dirigez quoi comme activité ?";

export function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "accueil", role: "assistant", content: CONTENU_ACCUEIL },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [etatPanneau, setEtatPanneau] = useState<EtatPanneauTravail>(
    ETAT_PANNEAU_INITIAL,
  );
  const [vueMobile, setVueMobile] = useState<"chat" | "panneau">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand nouveau message / token
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  // Si le panneau devient actif, bascule mobile vers "panneau"
  useEffect(() => {
    if (etatPanneau.elementActif.kind !== "aucun") {
      setVueMobile("panneau");
    }
  }, [etatPanneau.elementActif.kind]);

  async function envoyerTexte(texte: string) {
    const idUser = crypto.randomUUID();
    const idAssistant = crypto.randomUUID();
    const userMsg: ChatMessage = { id: idUser, role: "user", content: texte };

    const historiquePourAPI = [
      ...messages.filter((m) => m.id !== "accueil"),
      userMsg,
    ].map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: idAssistant, role: "assistant", content: "" },
    ]);
    setThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historiquePourAPI }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const line = event.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const payload = line.slice(6);
          try {
            const parsed = JSON.parse(payload);
            traiterEvenementSSE(parsed, idAssistant);
          } catch {
            /* chunk partiel */
          }
        }
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : "erreur réseau";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === idAssistant
            ? {
                ...m,
                content: `Désolé, je n'ai pas pu répondre (${detail}). Réessayez ou direction axihub.live.`,
              }
            : m,
        ),
      );
    } finally {
      setThinking(false);
    }
  }

  /** Traite un événement SSE : soit du texte, soit un tool_use. */
  function traiterEvenementSSE(
    evt: Record<string, unknown>,
    idAssistantCourant: string,
  ) {
    const type = evt.type;

    if (type === "text_delta" && typeof evt.delta === "string") {
      const delta = evt.delta;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === idAssistantCourant
            ? { ...m, content: m.content + delta }
            : m,
        ),
      );
      return;
    }

    if (type === "tool_use" && typeof evt.tool === "string") {
      appliquerToolUse(evt.tool, (evt.input as Record<string, unknown>) ?? {});
      return;
    }

    if (type === "erreur" && typeof evt.message === "string") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === idAssistantCourant
            ? { ...m, content: `(erreur : ${evt.message})` }
            : m,
        ),
      );
    }
  }

  /** Applique un tool_use sur l'état du panneau de travail. */
  function appliquerToolUse(tool: string, input: Record<string, unknown>) {
    switch (tool) {
      case "ajouter_note_fiche": {
        const champ = input.champ as string | undefined;
        const valeur = input.valeur as string | undefined;
        if (!champ || !valeur) return;
        setEtatPanneau((e) => ({
          ...e,
          fiche: { ...e.fiche, [champ]: valeur },
        }));
        break;
      }
      case "demander_email":
        setEtatPanneau((e) => ({
          ...e,
          elementActif: {
            kind: "demande_email",
            raison: input.raison as string | undefined,
          },
        }));
        break;
      case "demander_telephone":
        setEtatPanneau((e) => ({
          ...e,
          elementActif: {
            kind: "demande_telephone",
            raison: input.raison as string | undefined,
          },
        }));
        break;
      case "proposer_choix": {
        const question = input.question as string;
        const options = input.options as Array<{
          libelle: string;
          valeur: string;
        }>;
        if (!question || !Array.isArray(options)) return;
        setEtatPanneau((e) => ({
          ...e,
          elementActif: { kind: "choix", question, options },
        }));
        break;
      }
      case "proposer_telechargement": {
        const libelle = input.libelle as string;
        const url = input.url as string;
        if (!libelle || !url) return;
        setEtatPanneau((e) => ({
          ...e,
          elementActif: { kind: "telechargement", libelle, url },
        }));
        break;
      }
      case "montrer_page_web": {
        const url = input.url as string;
        if (!url) return;
        setEtatPanneau((e) => ({
          ...e,
          elementActif: {
            kind: "page_web",
            url,
            titre: input.titre as string | undefined,
          },
        }));
        break;
      }
      case "generer_reference_axi": {
        const reference = input.reference as string;
        const resume = input.resume as string;
        const chaleur = (input.chaleur as string) ?? "tiede";
        if (!reference) return;
        setEtatPanneau((e) => ({
          ...e,
          reference: {
            reference,
            resume,
            chaleur: chaleur as EtatPanneauTravail["reference"] extends infer R
              ? R extends { chaleur: infer C }
                ? C
                : never
              : never,
          },
          elementActif: { kind: "aucun" },
        }));
        break;
      }
      case "proposer_envoi_fiche_email":
        setEtatPanneau((e) => ({
          ...e,
          elementActif: {
            kind: "envoi_fiche_email",
            email: (input.email as string) ?? e.emailValide,
          },
        }));
        break;
      case "proposer_jeu_morpion":
        setEtatPanneau((e) => ({
          ...e,
          elementActif: { kind: "morpion" },
        }));
        break;
    }
  }

  // --------------- Interactions depuis le panneau de travail ------------- //

  function handleEmailValide(email: string) {
    setEtatPanneau((e) => ({
      ...e,
      emailValide: email,
      elementActif: { kind: "aucun" },
    }));
    envoyerTexte(`[Email saisi : ${email}]`);
  }

  function handleTelephoneValide(tel: string) {
    setEtatPanneau((e) => ({
      ...e,
      telephoneValide: tel,
      elementActif: { kind: "aucun" },
    }));
    envoyerTexte(`[Téléphone saisi : ${tel}]`);
  }

  function handleChoixClique(valeur: string) {
    setEtatPanneau((e) => ({ ...e, elementActif: { kind: "aucun" } }));
    envoyerTexte(valeur);
  }

  function handleEnvoiFicheConfirme(email: string) {
    setEtatPanneau((e) => ({ ...e, elementActif: { kind: "aucun" } }));
    envoyerTexte(`[Fiche à envoyer à : ${email}]`);
  }

  function envoyer() {
    const texte = input.trim();
    if (!texte || thinking) return;
    setInput("");
    envoyerTexte(texte);
  }

  return (
    <div className="flex h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:h-[640px]">
      {/* === Zone Chat (gauche en desktop) === */}
      <div
        className={`flex flex-1 flex-col ${vueMobile === "panneau" ? "hidden md:flex" : "flex"} md:max-w-[55%]`}
      >
        {/* Header avec pastille "AXI en ligne" */}
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
          {/* Bascule mobile Panneau */}
          <button
            onClick={() => setVueMobile("panneau")}
            className="relative rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25 md:hidden"
            aria-label="Voir le panneau de travail"
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            {(Object.keys(etatPanneau.fiche).length > 0 ||
              etatPanneau.elementActif.kind !== "aucun" ||
              etatPanneau.reference) && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Fil de messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-5"
        >
          {messages
            .filter((m) => !m.content.startsWith("["))
            .map((msg) => (
              <MessageBulle
                key={msg.id}
                role={msg.role}
                content={msg.content}
              />
            ))}
          {thinking &&
            !messages[messages.length - 1]?.content && <IndicateurFrappe />}
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
              placeholder="Répondez à AxiSolver…"
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
        </form>
      </div>

      {/* === Zone Panneau de Travail (droite en desktop, overlay mobile) === */}
      <div
        className={`flex flex-1 flex-col border-slate-200 bg-slate-50 ${vueMobile === "chat" ? "hidden md:flex" : "flex"} md:border-l md:max-w-[45%]`}
      >
        {/* Header panneau avec retour mobile */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <button
            onClick={() => setVueMobile("chat")}
            className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 md:hidden"
            aria-label="Retour chat"
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
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Panneau de travail
          </h3>
          <div className="w-6 md:hidden" />
        </div>

        <div className="flex-1 overflow-hidden">
          <PanneauTravail
            etat={etatPanneau}
            onEmailValide={handleEmailValide}
            onTelephoneValide={handleTelephoneValide}
            onChoixClique={handleChoixClique}
            onEnvoiFicheConfirme={handleEnvoiFicheConfirme}
          />
        </div>
      </div>
    </div>
  );
}

function MessageBulle({ role, content }: { role: Role; content: string }) {
  if (role === "assistant") {
    return (
      <div className="flex gap-2">
        <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
          A
        </div>
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-900 shadow-sm">
          {content || <span className="text-slate-300">…</span>}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
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
