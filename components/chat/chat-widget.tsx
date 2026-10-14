"use client";

/**
 * ChatWidget — architecture triptyque d'AxiSolver sur axisolver.app.
 *
 *   ┌─────────────┬──────────────────┬─────────────┐
 *   │ ACTIONS     │                  │ FICHE       │
 *   │ (ailette    │     CHAT         │ (ailette    │
 *   │  gauche)    │   (central,      │  droite)    │
 *   │             │    dominant)     │             │
 *   │ formulaires │                  │ récap pur   │
 *   │ aperçu site │  stream SSE      │ qui se      │
 *   │ catalogue   │  text + tools    │ construit   │
 *   │ morpion     │                  │             │
 *   └─────────────┴──────────────────┴─────────────┘
 *
 * Effet triptyque : les ailettes sont visuellement plus courtes (my-X)
 * que la colonne centrale, qui occupe toute la hauteur.
 *
 * Responsive mobile : 3 vues en bascule (actions / chat / fiche).
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PanneauActions, PanneauFiche } from "./panneau-travail";
import {
  ETAT_PANNEAU_INITIAL,
  type EtatPanneauTravail,
} from "@/lib/axi-solver/tools";

type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string };
type VueMobile = "actions" | "chat" | "fiche";

const CONTENU_ACCUEIL =
  "Bonjour, bienvenue chez moi. Je suis AxiSolver, le meilleur ami des sites web. On fait connaissance ? Que puis-je faire pour vous ?";

export function ChatWidget() {
  const [widgetOuvert, setWidgetOuvert] = useState(false);
  // Pas de message d'accueil dans le chat au démarrage — il est affiché
  // dans la mascotte à gauche, et ne passera dans le chat qu'après la
  // première réponse du visiteur.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [etatPanneau, setEtatPanneau] = useState<EtatPanneauTravail>(
    ETAT_PANNEAU_INITIAL,
  );
  const [vueMobile, setVueMobile] = useState<VueMobile>("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // La mascotte d'accueil est affichée tant que le visiteur n'a pas répondu.
  const mascotteVisible =
    widgetOuvert && !messages.some((m) => m.role === "user");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  // Bascule mobile automatique vers "actions" quand quelque chose s'y passe
  useEffect(() => {
    if (etatPanneau.elementActif.kind !== "aucun") {
      setVueMobile("actions");
    }
  }, [etatPanneau.elementActif.kind]);

  // Autofocus permanent du champ de saisie : au montage, après chaque
  // envoi, et dès que l'IA finit de répondre. Ça évite au visiteur de
  // devoir cliquer manuellement dans l'input entre chaque échange.
  useEffect(() => {
    if (widgetOuvert && !thinking && inputRef.current) {
      inputRef.current.focus();
    }
  }, [widgetOuvert, thinking, messages.length]);

  async function envoyerTexte(texte: string) {
    const idUser = crypto.randomUUID();
    const idAssistant = crypto.randomUUID();
    const userMsg: ChatMessage = { id: idUser, role: "user", content: texte };

    // Au premier échange, on injecte le message d'accueil dans le chat
    // juste avant la réponse visiteur pour conserver le fil narratif.
    const estPremierEchange = !messages.some((m) => m.role === "user");
    const messageAccueilInjecte: ChatMessage | null = estPremierEchange
      ? { id: "accueil-injecte", role: "assistant", content: CONTENU_ACCUEIL }
      : null;

    // On transmet TOUT à Claude, y compris les messages système [Email saisi : ...]
    // car ce sont des informations essentielles. Le filtre d'affichage est fait
    // uniquement au rendu du fil de messages (pas ici).
    const historiquePourAPI = [
      ...messages,
      ...(messageAccueilInjecte ? [messageAccueilInjecte] : []),
      userMsg,
    ].map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      ...(messageAccueilInjecte ? [messageAccueilInjecte] : []),
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

    if (type === "audit_termine") {
      // Compte-rendu structuré de l'audit backend — reste affiché à gauche
      type FindingAudit = {
        categorie: "seo" | "securite" | "performance" | "metier";
        severite: "info" | "amelioration" | "critique";
        titre: string;
        detail?: string;
      };
      const findings = (evt.findings as FindingAudit[] | undefined) ?? [];
      const technologies = (evt.technologies as string[] | undefined) ?? [];
      const url = (evt.url as string) ?? "";
      const volet = evt.volet as "securite" | "seo" | undefined;
      setEtatPanneau((e) => ({
        ...e,
        elementActif: {
          kind: "analyse_site",
          url,
          etat: "terminee",
          volet,
          findings,
          technologies,
        },
      }));
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
      case "proposer_choix_multiple": {
        const question = input.question as string;
        const options = input.options as Array<{
          libelle: string;
          valeur: string;
        }>;
        if (!question || !Array.isArray(options)) return;
        setEtatPanneau((e) => ({
          ...e,
          elementActif: { kind: "choix_multiple", question, options },
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
      case "afficher_site_hote": {
        const url = input.url as string;
        if (!url) return;
        setEtatPanneau((e) => ({
          ...e,
          elementActif: { kind: "site_hote", url },
        }));
        break;
      }
      case "auditer_site": {
        const url = input.url as string;
        if (!url) return;
        setEtatPanneau((e) => ({
          ...e,
          elementActif: { kind: "analyse_site", url, etat: "en_cours" },
        }));
        break;
      }
      case "auditer_securite": {
        const url = input.url as string;
        if (!url) return;
        setEtatPanneau((e) => ({
          ...e,
          elementActif: {
            kind: "analyse_site",
            url,
            etat: "en_cours",
            volet: "securite",
          },
        }));
        break;
      }
      case "auditer_seo": {
        const url = input.url as string;
        if (!url) return;
        setEtatPanneau((e) => ({
          ...e,
          elementActif: {
            kind: "analyse_site",
            url,
            etat: "en_cours",
            volet: "seo",
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

  function handleChoixMultipleValide(valeurs: string[]) {
    setEtatPanneau((e) => ({ ...e, elementActif: { kind: "aucun" } }));
    envoyerTexte(`[Choix multiple : ${valeurs.join(", ")}]`);
  }

  function handleEnvoiFicheConfirme(email: string) {
    setEtatPanneau((e) => ({ ...e, elementActif: { kind: "aucun" } }));
    envoyerTexte(`[Fiche à envoyer à : ${email}]`);
  }

  function handleMorpionMessage(message: string) {
    envoyerTexte(message);
  }

  function handleMorpionTermine() {
    setEtatPanneau((e) => ({ ...e, elementActif: { kind: "aucun" } }));
  }

  function envoyer() {
    const texte = input.trim();
    if (!texte || thinking) return;
    setInput("");
    envoyerTexte(texte);
  }

  // Pour le badge de notification mobile sur les ailettes
  const actionsOntContenu = etatPanneau.elementActif.kind !== "aucun";
  const ficheACunChamp =
    Object.keys(etatPanneau.fiche).length > 0 ||
    !!etatPanneau.emailValide ||
    !!etatPanneau.telephoneValide ||
    !!etatPanneau.reference;

  // Si le widget n'est pas encore ouvert, on affiche le bouton d'invitation
  if (!widgetOuvert) {
    return <BoutonOuverture onOuvrir={() => setWidgetOuvert(true)} />;
  }

  return (
    <div className="flex h-[640px] items-stretch gap-3 md:h-[680px]">
      {/* === AILETTE GAUCHE — Actions (desktop) === */}
      <aside
        className={`animate-slideOutLeft flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md ${vueMobile === "actions" ? "flex" : "hidden md:flex"} my-5 md:basis-[32%] md:flex-grow-0 md:flex-shrink-0`}
        aria-label="Panneau actions"
      >
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <button
              onClick={() => setVueMobile("chat")}
              className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 md:hidden"
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
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Zone d&apos;action
            </h3>
            <div className="w-5 md:hidden" />
          </div>
          <div className="flex-1 overflow-auto">
            {mascotteVisible ? (
              <MascotteAccueil />
            ) : (
              <PanneauActions
                etat={etatPanneau}
                onEmailValide={handleEmailValide}
                onTelephoneValide={handleTelephoneValide}
                onChoixClique={handleChoixClique}
                onChoixMultipleValide={handleChoixMultipleValide}
                onEnvoiFicheConfirme={handleEnvoiFicheConfirme}
                onMorpionMessage={handleMorpionMessage}
                onMorpionTermine={handleMorpionTermine}
              />
            )}
          </div>
        </div>
      </aside>

      {/* === COLONNE CENTRALE — Chat (dominante) === */}
      <section
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ${vueMobile === "chat" ? "flex flex-1" : "hidden md:flex md:basis-[36%] md:flex-grow md:flex-shrink"}`}
      >
        <div className="flex w-full flex-col">
          {/* Header chat */}
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
            {/* Boutons de bascule mobile */}
            <div className="flex gap-1 md:hidden">
              <button
                onClick={() => setVueMobile("actions")}
                className="relative rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
                aria-label="Voir la zone d'action"
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
                  <rect width="18" height="11" x="3" y="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {actionsOntContenu && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                )}
              </button>
              <button
                onClick={() => setVueMobile("fiche")}
                className="relative rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
                aria-label="Voir la fiche visiteur"
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
                {ficheACunChamp && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                )}
              </button>
            </div>
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
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={thinking}
                autoFocus
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
      </section>

      {/* === AILETTE DROITE — Fiche (desktop) === */}
      <aside
        className={`animate-slideOutRight flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md ${vueMobile === "fiche" ? "flex" : "hidden md:flex"} my-5 md:basis-[32%] md:flex-grow-0 md:flex-shrink-0`}
        aria-label="Fiche visiteur"
      >
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <button
              onClick={() => setVueMobile("chat")}
              className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 md:hidden"
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
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Récap conversation
            </h3>
            <div className="w-5 md:hidden" />
          </div>
          <div className="flex-1 overflow-auto">
            <PanneauFiche etat={etatPanneau} />
          </div>
        </div>
      </aside>
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

// ================================================================== //
// Bouton d'ouverture — invite à démarrer la conversation             //
// ================================================================== //

function BoutonOuverture({ onOuvrir }: { onOuvrir: () => void }) {
  return (
    <div className="flex min-h-[480px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/50 p-10 text-center md:min-h-[560px]">
      <div className="mb-6">
        <Image
          src="/logo-axisolver.png"
          alt="AxiSolver"
          width={280}
          height={280}
          priority
          className="h-auto w-32 md:w-40"
        />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        AxiSolver vous attend
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600 md:text-base">
        Il va vous accueillir en direct, écouter votre contexte,
        regarder votre site, et vous dire ce qu&apos;il peut faire pour
        vous. Deux à trois minutes maximum.
      </p>
      <button
        onClick={onOuvrir}
        className="animate-pulseGlow mt-8 inline-flex items-center gap-3 rounded-full bg-blue-600 px-8 py-4 text-base font-medium text-white transition-all hover:bg-blue-700 hover:scale-105"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Démarrer la conversation
      </button>
      <p className="mt-4 text-xs text-slate-400">
        Pas d&apos;inscription, pas de formulaire — un dialogue direct.
      </p>
    </div>
  );
}

// ================================================================== //
// Mascotte d'accueil — à gauche au premier contact                   //
// ================================================================== //

function MascotteAccueil() {
  return (
    <div className="flex h-full flex-col items-center justify-end bg-gradient-to-br from-slate-50 to-blue-50/40 px-5 pt-5">
      {/* Bulle de dialogue, posée au-dessus de la mascotte */}
      <div className="animate-bulle relative mb-3 w-full max-w-xs rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-5 py-4 shadow-md">
        <p className="text-sm leading-relaxed text-slate-900">
          Bonjour, bienvenue chez moi.{" "}
          <span className="font-semibold text-blue-600">
            Je suis AxiSolver, le meilleur ami des sites web.
          </span>{" "}
          On fait connaissance ? Que puis-je faire pour vous ?
        </p>
        {/* Petite flèche vers la mascotte */}
        <div className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 border-b border-r border-slate-200 bg-white" />
      </div>

      {/* Mascotte — bras derrière le dos, pieds cachés par le fond
          (le dégradé du bas se fond pour masquer la base) */}
      <div className="relative w-full">
        <div className="animate-mascotte mx-auto flex justify-center">
          <Image
            src="/logo-axisolver.png"
            alt="AxiSolver"
            width={320}
            height={320}
            priority
            className="h-auto w-40 md:w-44 lg:w-48"
          />
        </div>
        {/* Dégradé qui masque la base de la mascotte */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>
    </div>
  );
}
