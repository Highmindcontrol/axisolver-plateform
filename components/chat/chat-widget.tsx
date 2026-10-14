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
import { BoutonMicro } from "./bouton-micro";
import { PanneauActions, PanneauFiche } from "./panneau-travail";
import {
  ETAT_PANNEAU_INITIAL,
  type EtatPanneauTravail,
} from "@/lib/axi-solver/tools";

type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string };
type VueMobile = "actions" | "chat" | "fiche";

const CONTENU_ACCUEIL =
  "Bonjour, bienvenue ! Je suis AxiSolver, et je n'en ai peut-être pas l'air comme ça 😄 mais d'ici peu, vous n'allez plus pouvoir vous passer de moi. On fait connaissance ?";

export function ChatWidget() {
  const [widgetOuvert, setWidgetOuvert] = useState(false);
  // Phase d'ouverture séquencée :
  // 1. "chat" → chat central fade-in seul (0-900ms)
  // 2. "complet" → ailettes glissent et deviennent visibles
  const [phaseOuverture, setPhaseOuverture] = useState<"chat" | "complet">(
    "chat",
  );
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
    // Protection : si on est en pleine partie de morpion et que Claude
    // tente d'afficher autre chose (clôture par ex.), on IGNORE pour
    // laisser le visiteur finir sa partie. Le morpion n'est libéré que
    // via onMorpionTermine (callback du composant JeuMorpion).
    if (
      etatPanneau.elementActif.kind === "morpion" &&
      tool !== "ajouter_note_fiche" &&
      tool !== "generer_reference_axi"
    ) {
      // On note silencieusement — l'intention de Claude sera revalidée
      // automatiquement à la fin du morpion
      console.warn(
        `[chat-widget] Tool ${tool} ignoré pendant une partie de morpion en cours`,
      );
      return;
    }

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
      case "demander_url_site":
        setEtatPanneau((e) => ({
          ...e,
          elementActif: {
            kind: "demande_url_site",
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
      case "proposer_cloture_conversation":
        setEtatPanneau((e) => ({
          ...e,
          elementActif: { kind: "cloture" },
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

  function handleEmailRefuse() {
    setEtatPanneau((e) => ({ ...e, elementActif: { kind: "aucun" } }));
    envoyerTexte("[Email : visiteur préfère ne pas le donner pour l'instant.]");
  }

  function handleTelephoneValide(tel: string) {
    setEtatPanneau((e) => ({
      ...e,
      telephoneValide: tel,
      elementActif: { kind: "aucun" },
    }));
    envoyerTexte(`[Téléphone saisi : ${tel}]`);
  }

  function handleTelephoneRefuse() {
    setEtatPanneau((e) => ({ ...e, elementActif: { kind: "aucun" } }));
    envoyerTexte(
      "[Téléphone : visiteur préfère ne pas le donner pour l'instant.]",
    );
  }

  function handleUrlSiteValide(url: string) {
    setEtatPanneau((e) => ({
      ...e,
      fiche: { ...e.fiche, site_web: url },
      elementActif: { kind: "aucun" },
    }));
    envoyerTexte(`[URL site : ${url}]`);
  }

  function handleUrlSiteRefuse() {
    setEtatPanneau((e) => ({ ...e, elementActif: { kind: "aucun" } }));
    envoyerTexte("[URL site : visiteur préfère ne pas la donner pour l'instant.]");
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

  const [fermetureEnCours, setFermetureEnCours] = useState(false);
  const [lectureVocaleActive, setLectureVocaleActive] = useState(true);
  // Voix TTS actuelle — par défaut onyx (voix d'homme, posée, confiance)
  const [voix, setVoix] = useState<
    "onyx" | "echo" | "nova" | "shimmer" | "alloy" | "fable"
  >("onyx");
  const dernierMessageLuRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lecture TTS automatique du dernier message assistant à chaque fois
  // qu'une réponse se termine (thinking passe de true à false).
  useEffect(() => {
    if (!lectureVocaleActive || thinking) return;
    const dernierMessage = messages[messages.length - 1];
    if (!dernierMessage || dernierMessage.role !== "assistant") return;
    if (!dernierMessage.content.trim()) return;
    if (dernierMessageLuRef.current === dernierMessage.id) return;

    dernierMessageLuRef.current = dernierMessage.id;
    lireMessageAssistant(dernierMessage.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking, lectureVocaleActive]);

  async function lireMessageAssistant(texte: string) {
    try {
      // Si une lecture est déjà en cours, on l'arrête
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const res = await fetch("/api/synthese-vocale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte, voix }),
      });
      if (!res.ok || !res.body) return;

      // Streaming TTS via MediaSource API — réduit la latence perceptive
      // en commençant la lecture dès les premiers chunks reçus (sans
      // attendre que tout le fichier MP3 soit généré).
      const supporteMSE =
        typeof MediaSource !== "undefined" &&
        MediaSource.isTypeSupported("audio/mpeg");

      if (supporteMSE) {
        const mediaSource = new MediaSource();
        const audioUrl = URL.createObjectURL(mediaSource);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        mediaSource.addEventListener("sourceopen", async () => {
          try {
            const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
            const reader = res.body!.getReader();

            const appendChunk = (chunk: Uint8Array) =>
              new Promise<void>((resolve) => {
                const onUpdate = () => {
                  sourceBuffer.removeEventListener("updateend", onUpdate);
                  resolve();
                };
                sourceBuffer.addEventListener("updateend", onUpdate);
                // Copie dans un ArrayBuffer propre pour éviter les
                // conflits de type SharedArrayBuffer vs ArrayBuffer
                const buffer = new Uint8Array(chunk.byteLength);
                buffer.set(chunk);
                sourceBuffer.appendBuffer(buffer.buffer);
              });

            let dejaDemarre = false;
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                if (mediaSource.readyState === "open") {
                  mediaSource.endOfStream();
                }
                break;
              }
              await appendChunk(value);
              if (!dejaDemarre) {
                dejaDemarre = true;
                audio.play().catch(() => {
                  /* autoplay bloqué, on ignore */
                });
              }
            }
          } catch {
            /* erreur silencieuse */
          }
        });

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (audioRef.current === audio) audioRef.current = null;
        };
      } else {
        // Fallback : attendre le blob complet (safari ancien, etc.)
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(() => {});
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
        };
      }
    } catch {
      /* erreur silencieuse */
    }
  }

  function basculerLectureVocale() {
    setLectureVocaleActive((prev) => {
      const nouveau = !prev;
      if (!nouveau && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return nouveau;
    });
  }

  function handleTranscription(texte: string) {
    envoyerTexte(texte);
  }

  // Phase de fermeture séquencée :
  // 1. "aurevoir"    → mascotte au revoir apparaît au centre bas (0-1000ms)
  // 2. "ailettes"    → ailettes se replient (1000-2900ms)
  // 3. "chat"        → chat central fade-out (2900-3800ms)
  // 4. widget fermé  → retour au bouton d'ouverture (4000ms)
  const [phaseFermeture, setPhaseFermeture] = useState<
    "aucune" | "aurevoir" | "ailettes" | "chat"
  >("aucune");

  function handleClotureConfirmee(optInRecontact: boolean) {
    // 1. Note l'opt-in dans l'historique pour l'équipe
    envoyerTexte(
      optInRecontact
        ? "[Clôture confirmée. Opt-in Ataraxis : OUI.]"
        : "[Clôture confirmée. Opt-in Ataraxis : NON.]",
    );
    // 2. Déclenche la séquence de fermeture
    setFermetureEnCours(true);
    setPhaseFermeture("aurevoir");
    // 2a. Après 1000ms, les ailettes se replient (durée slideBack ~1900ms)
    setTimeout(() => setPhaseFermeture("ailettes"), 1000);
    // 2b. Après 2900ms, le chat central fade-out (durée chatFadeOut ~900ms)
    setTimeout(() => setPhaseFermeture("chat"), 2900);
    // 3. Après 3800ms, on referme vraiment le widget
    setTimeout(() => {
      setWidgetOuvert(false);
      setFermetureEnCours(false);
      setPhaseFermeture("aucune");
      // Reset pour une éventuelle réouverture
      setMessages([]);
      setEtatPanneau(ETAT_PANNEAU_INITIAL);
    }, 3800);
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
    return (
      <BoutonOuverture
        onOuvrir={() => {
          setWidgetOuvert(true);
          setPhaseOuverture("chat");
          // Les ailettes apparaissent 900ms après le chat central
          setTimeout(() => setPhaseOuverture("complet"), 900);
        }}
      />
    );
  }

  return (
    <div className="flex h-[640px] items-stretch gap-3 md:h-[680px]">
      {/* === AILETTE GAUCHE — Actions (desktop) === */}
      <aside
        className={`${
          phaseFermeture === "ailettes" || phaseFermeture === "chat"
            ? "animate-slideBackLeft"
            : phaseOuverture === "complet"
              ? "animate-slideOutLeft"
              : "pointer-events-none opacity-0"
        } flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md ${vueMobile === "actions" ? "flex" : "hidden md:flex"} my-5 md:basis-[32%] md:flex-grow-0 md:flex-shrink-0`}
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
                onEmailRefuse={handleEmailRefuse}
                onTelephoneValide={handleTelephoneValide}
                onTelephoneRefuse={handleTelephoneRefuse}
                onUrlSiteValide={handleUrlSiteValide}
                onUrlSiteRefuse={handleUrlSiteRefuse}
                onChoixClique={handleChoixClique}
                onChoixMultipleValide={handleChoixMultipleValide}
                onEnvoiFicheConfirme={handleEnvoiFicheConfirme}
                onMorpionMessage={handleMorpionMessage}
                onMorpionTermine={handleMorpionTermine}
                onClotureConfirmee={handleClotureConfirmee}
              />
            )}
          </div>
        </div>
      </aside>

      {/* === COLONNE CENTRALE — Chat (dominante) === */}
      <section
        className={`relative ${
          phaseFermeture === "chat"
            ? "animate-chatFadeOut"
            : phaseOuverture === "chat" || phaseOuverture === "complet"
              ? "animate-chatFadeIn"
              : ""
        } overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ${vueMobile === "chat" ? "flex flex-1" : "hidden md:flex md:basis-[36%] md:flex-grow md:flex-shrink"}`}
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
            {/* Sélecteur de voix TTS — menu caché affiché au clic */}
            {lectureVocaleActive && (
              <select
                value={voix}
                onChange={(e) =>
                  setVoix(e.target.value as typeof voix)
                }
                className="hidden rounded-full bg-white/15 px-2 py-1 text-xs font-medium text-white outline-none transition-colors hover:bg-white/25 md:inline-flex [&>option]:text-slate-900"
                title="Choisir la voix d'AxiSolver"
                aria-label="Choisir la voix"
              >
                <option value="onyx">Onyx (homme grave)</option>
                <option value="echo">Echo (homme neutre)</option>
                <option value="fable">Fable (homme UK)</option>
                <option value="nova">Nova (femme)</option>
                <option value="shimmer">Shimmer (femme douce)</option>
                <option value="alloy">Alloy (neutre)</option>
              </select>
            )}
            {/* Toggle lecture vocale */}
            <button
              onClick={basculerLectureVocale}
              className="hidden rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25 md:inline-flex"
              aria-label={
                lectureVocaleActive
                  ? "Désactiver la lecture vocale"
                  : "Activer la lecture vocale"
              }
              title={
                lectureVocaleActive
                  ? "Lecture vocale activée — cliquer pour la couper"
                  : "Lecture vocale coupée — cliquer pour l'activer"
              }
            >
              {lectureVocaleActive ? (
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
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
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
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" x2="17" y1="9" y2="15" />
                  <line x1="17" x2="23" y1="9" y2="15" />
                </svg>
              )}
            </button>
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

          {/* Mascotte au revoir — superposée en bas pendant la fermeture */}
          {(phaseFermeture === "aurevoir" ||
            phaseFermeture === "ailettes") && (
            <MascotteAuRevoir prenom={etatPanneau.fiche.prenom} />
          )}

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
              <BoutonMicro
                disabled={thinking}
                onTranscription={handleTranscription}
              />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={thinking}
                autoFocus
                placeholder="Répondez à AxiSolver (texte ou micro)…"
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
        className={`${
          phaseFermeture === "ailettes" || phaseFermeture === "chat"
            ? "animate-slideBackRight"
            : phaseOuverture === "complet"
              ? "animate-slideOutRight"
              : "pointer-events-none opacity-0"
        } flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md ${vueMobile === "fiche" ? "flex" : "hidden md:flex"} my-5 md:basis-[32%] md:flex-grow-0 md:flex-shrink-0`}
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
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        AxiSolver vous attend
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600 md:text-base">
        Il va vous accueillir en direct, écouter votre contexte,
        regarder votre site, et vous dire ce qu&apos;il peut faire pour
        vous. Deux à trois minutes maximum.
      </p>

      {/* Gros bouton rond noir avec la mascotte AxiSolver — pulsation permanente */}
      <button
        onClick={onOuvrir}
        aria-label="Démarrer la conversation avec AxiSolver"
        className="animate-pulseAxi group mt-10 flex h-44 w-44 items-center justify-center overflow-hidden rounded-full bg-slate-900 shadow-xl transition-transform hover:scale-105 md:h-52 md:w-52"
      >
        <Image
          src="/axi-mascotte-bouton.png"
          alt="AxiSolver"
          width={400}
          height={400}
          priority
          className="h-auto w-36 translate-y-1 transition-transform group-hover:scale-110 md:w-40"
        />
      </button>

      <p className="mt-8 text-xs text-slate-400">
        Cliquez sur AxiSolver pour démarrer la conversation.
      </p>
    </div>
  );
}

// ================================================================== //
// Mascotte "au revoir" — à l'écran central avant fermeture           //
// ================================================================== //

function MascotteAuRevoir({ prenom }: { prenom?: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center">
      <div className="animate-mascotteAuRevoir mb-3 w-full max-w-sm rounded-2xl rounded-br-sm border border-slate-200 bg-white px-5 py-4 shadow-md">
        <p className="text-sm leading-relaxed text-slate-900">
          Merci {prenom ? `${prenom} ` : ""}d&apos;être passé par ici.{" "}
          <span className="font-semibold text-blue-600">
            À très bientôt
          </span>{" "}
          — et n&apos;oubliez pas, vous allez recevoir votre compte-rendu
          par email dès que notre canal sera activé. 👋
        </p>
      </div>
      <div className="animate-mascotteAuRevoir relative w-full">
        <div className="mx-auto flex justify-center">
          <Image
            src="/axi-mascotte-aurevoir.png"
            alt="AxiSolver vous salue"
            width={400}
            height={400}
            className="h-auto w-36 md:w-40"
          />
        </div>
      </div>
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

      {/* Mascotte — bras derrière le dos (image dédiée accueil) */}
      <div className="relative w-full">
        <div className="animate-mascotte mx-auto flex justify-center">
          <Image
            src="/axi-mascotte-accueil.png"
            alt="AxiSolver vous accueille"
            width={420}
            height={420}
            priority
            className="h-auto w-44 md:w-48 lg:w-52"
          />
        </div>
      </div>
    </div>
  );
}
