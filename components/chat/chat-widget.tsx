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
import { AuroreBoreale } from "./aurore-boreale";
import { BoutonMicro } from "./bouton-micro";
import { PanneauActions, PanneauFiche } from "./panneau-travail";
import {
  OPTIONS_ACCUEIL_DEFAUT,
  type OptionAccueil,
} from "@/lib/axi-solver/options-accueil";
import {
  ETAT_PANNEAU_INITIAL,
  type EtatPanneauTravail,
} from "@/lib/axi-solver/tools";

type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string };
type VueMobile = "actions" | "chat" | "fiche";

const CONTENU_ACCUEIL =
  "Bonjour, bienvenue. Que puis-je faire pour vous ? Vous pouvez me parler, m'écrire ou voir si une réponse présentée à gauche peut vous convenir.";

export function ChatWidget() {
  const [widgetOuvert, setWidgetOuvert] = useState(false);
  // Phase d'ouverture séquencée :
  // 1. "chat" → chat central fade-in seul (0-900ms)
  // 2. "complet" → ailettes glissent et deviennent visibles
  const [phaseOuverture, setPhaseOuverture] = useState<"chat" | "complet">(
    "chat",
  );
  // Le visiteur doit cliquer sur « Démarrer la conversation » avant qu'AXI
  // ne prenne la parole. Évite les premiers mots muets si l'autoplay est
  // bloqué et donne un ancrage pro à l'ouverture du widget.
  const [conversationDemarree, setConversationDemarree] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [etatPanneau, setEtatPanneau] = useState<EtatPanneauTravail>(
    ETAT_PANNEAU_INITIAL,
  );
  const [vueMobile, setVueMobile] = useState<VueMobile>("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Le message d'accueil est déjà présent dans `messages` depuis le
    // clic sur « Démarrer la conversation » — plus d'injection ici.
    const historiquePourAPI = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

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
      // Dernière phrase sans ponctuation finale éventuelle
      flusherBufferTTS();
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
      // Streaming TTS phrase par phrase — latence quasi-nulle du 1er son
      traiterChunkTexteTTS(delta, idAssistantCourant);
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
      type FindingRef = {
        requete: string;
        position: number | null;
        totalResultats?: number;
        concurrents: Array<{ titre: string; url: string; snippet?: string }>;
      };
      const findings = (evt.findings as FindingAudit[] | undefined) ?? [];
      const findingsReferencement =
        (evt.findingsReferencement as FindingRef[] | undefined) ?? undefined;
      const technologies = (evt.technologies as string[] | undefined) ?? [];
      const url = (evt.url as string) ?? "";
      const volet = evt.volet as
        | "securite"
        | "seo"
        | "referencement"
        | undefined;
      setEtatPanneau((e) => ({
        ...e,
        elementActif: {
          kind: "analyse_site",
          url,
          etat: "terminee",
          volet,
          findings,
          technologies,
          findingsReferencement,
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
    // tente d'afficher autre chose (clôture, envoi fiche email…), on
    // IGNORE pour laisser le visiteur finir sa partie. Le morpion n'est
    // libéré que via onMorpionTermine (callback du composant JeuMorpion).
    //
    // IMPORTANT : on lit via la ref (etatPanneauRef) et pas via la
    // closure (etatPanneau) pour avoir la vraie valeur courante — car
    // plusieurs tool_use peuvent arriver dans la même frame React, et
    // la closure capturerait l'ancien état.
    const kindCourant = etatPanneauRef.current.elementActif.kind;
    if (
      kindCourant === "morpion" &&
      tool !== "ajouter_note_fiche" &&
      tool !== "generer_reference_axi"
    ) {
      console.warn(
        `[chat-widget] Tool ${tool} ignoré pendant morpion en cours`,
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
      case "demander_prenom":
        setEtatPanneau((e) => ({
          ...e,
          elementActif: {
            kind: "demande_prenom",
            raison: input.raison as string | undefined,
          },
        }));
        break;
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
      case "auditer_referencement": {
        const url = input.url as string;
        if (!url) return;
        setEtatPanneau((e) => ({
          ...e,
          elementActif: {
            kind: "analyse_site",
            url,
            etat: "en_cours",
            volet: "referencement",
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

  function handlePrenomValide(prenom: string) {
    setEtatPanneau((e) => ({
      ...e,
      fiche: { ...e.fiche, prenom },
      elementActif: { kind: "aucun" },
    }));
    envoyerTexte(`[Prénom saisi : ${prenom}]`);
  }

  function handlePrenomRefuse() {
    setEtatPanneau((e) => ({ ...e, elementActif: { kind: "aucun" } }));
    envoyerTexte(
      "[Prénom : visiteur préfère ne pas le donner pour l'instant.]",
    );
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
    // Safety net : si Claude n'a pas appelé proposer_cloture_conversation
    // dans les 6 secondes après la fin du morpion, on l'affiche
    // automatiquement pour ne pas laisser le visiteur bloqué.
    setTimeout(() => {
      if (etatPanneauRef.current.elementActif.kind === "aucun") {
        setEtatPanneau((e) => ({
          ...e,
          elementActif: { kind: "cloture" },
        }));
      }
    }, 6000);
  }

  const [fermetureEnCours, setFermetureEnCours] = useState(false);
  const [lectureVocaleActive, setLectureVocaleActive] = useState(true);
  const [autoplayBloque, setAutoplayBloque] = useState(false);

  // Streaming TTS — buffer de phrase en cours + queue de lecture.
  // Dès qu'une phrase complète est détectée dans le stream Claude,
  // elle est envoyée au TTS. Les audios s'enchaînent via la queue.
  const bufferPhraseRef = useRef<string>("");
  const queueAudioRef = useRef<Array<Promise<string | null>>>([]);
  const lectureEnCoursRef = useRef<boolean>(false);
  // Pour détecter un nouveau message et vider le buffer
  const idMessageEnCoursRef = useRef<string | null>(null);
  // Voix TTS verrouillée — doctrine AxiHub « on parle de la voix,
  // point » (21 oct 2026). Pas de sélecteur visible côté visiteur.
  // Reste sur `echo` (homme neutre) tant qu'on ne branche pas Azure
  // fr-FR comme AxiHub.
  const voix = "echo" as const;

  // Ref synchronisée avec l'état panneau — pour éviter les stale closures
  // dans appliquerToolUse quand plusieurs tools arrivent coup sur coup
  const etatPanneauRef = useRef<EtatPanneauTravail>(etatPanneau);
  useEffect(() => {
    etatPanneauRef.current = etatPanneau;
  }, [etatPanneau]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Note : plus de useEffect ici — la lecture TTS se fait en streaming
  // au fur et à mesure que Claude écrit, phrase par phrase, via
  // traiterChunkTexteTTS appelé depuis traiterEvenementSSE.

  /**
   * Génère l'audio TTS d'une phrase et le met en queue de lecture.
   * Appelé dès qu'une phrase complète est détectée dans le stream Claude.
   * La génération démarre immédiatement, la lecture suit via la queue.
   */
  function envoyerPhraseTTS(phrase: string) {
    if (!lectureVocaleActive) return;
    const texteNettoye = phrase.trim();
    if (texteNettoye.length < 2) return;

    const promesseUrl: Promise<string | null> = (async () => {
      try {
        const res = await fetch("/api/synthese-vocale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texte: texteNettoye, voix }),
        });
        if (!res.ok) {
          console.error(`[tts] phrase HTTP ${res.status}`);
          return null;
        }
        const blob = await res.blob();
        if (blob.size === 0) return null;
        return URL.createObjectURL(blob);
      } catch (err) {
        console.error("[tts] fetch phrase :", err);
        return null;
      }
    })();

    queueAudioRef.current.push(promesseUrl);
    if (!lectureEnCoursRef.current) {
      lancerQueueAudio();
    }
  }

  async function lancerQueueAudio() {
    lectureEnCoursRef.current = true;
    while (queueAudioRef.current.length > 0) {
      const promesseUrl = queueAudioRef.current.shift();
      if (!promesseUrl) continue;
      const url = await promesseUrl;
      if (!url) continue;

      const audio = new Audio(url);
      audioRef.current = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.play().catch((err) => {
          console.error("[tts] play() refusé :", err?.name, err?.message);
          setAutoplayBloque(true);
          resolve();
        });
      });
    }
    lectureEnCoursRef.current = false;
  }

  /**
   * Traite un delta de texte du stream Claude.
   * Détecte les fins de phrases et lance le TTS dès qu'une phrase
   * complète est disponible — sans attendre la fin du message.
   */
  function traiterChunkTexteTTS(delta: string, idMessage: string) {
    if (!lectureVocaleActive) return;

    // Nouveau message → reset du buffer
    if (idMessageEnCoursRef.current !== idMessage) {
      bufferPhraseRef.current = "";
      idMessageEnCoursRef.current = idMessage;
      // Vider la queue des anciens audios en cours
      queueAudioRef.current = [];
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      lectureEnCoursRef.current = false;
    }

    bufferPhraseRef.current += delta;

    // Détecter les phrases complètes (ponctuation suivie d'un espace ou fin)
    // Regex : capture jusqu'à .!?… suivi d'un espace, newline ou fin
    const regex = /(.+?[.!?…])(\s|$)/;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(bufferPhraseRef.current)) !== null) {
      const phrase = match[1].trim();
      // Évite de couper sur abréviations courantes (M., Dr., etc.)
      if (phrase.length < 8 || /\b(M|Mme|Dr|Pr|Me|St|Ste|etc)\.$/.test(phrase)) {
        break;
      }
      envoyerPhraseTTS(phrase);
      bufferPhraseRef.current = bufferPhraseRef.current.slice(
        match.index + match[1].length + (match[2] ? 1 : 0),
      );
    }
  }

  /**
   * Vide le buffer restant à la fin du streaming (phrase sans ponctuation
   * finale, ou dernière phrase un peu courte).
   */
  function flusherBufferTTS() {
    const reste = bufferPhraseRef.current.trim();
    if (reste.length > 0 && lectureVocaleActive) {
      envoyerPhraseTTS(reste);
      bufferPhraseRef.current = "";
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

  // Fermeture simple : fade out global via `fermetureEnCours` passé
  // à ModalOverlay (transition opacity 1000ms sur toute la fenêtre).

  function handleClotureConfirmee(optInRecontact: boolean) {
    // 1. Note l'opt-in dans l'historique pour l'équipe
    envoyerTexte(
      optInRecontact
        ? "[Clôture confirmée. Opt-in Ataraxis : OUI.]"
        : "[Clôture confirmée. Opt-in Ataraxis : NON.]",
    );

    // 2. Attend que la voix finisse de parler, puis fade out global
    // du modal sur 1000ms, puis fermeture effective. Pas de mascotte
    // au revoir ni de chorégraphie d'ailettes — simple, pro.
    const attendreFinVoix = (callback: () => void, debutMs = Date.now()) => {
      const audioEnCours = !!audioRef.current && !audioRef.current.ended;
      const queueActive =
        queueAudioRef.current.length > 0 || lectureEnCoursRef.current;
      const timeout = Date.now() - debutMs > 20000;

      if ((audioEnCours || queueActive) && !timeout) {
        setTimeout(() => attendreFinVoix(callback, debutMs), 400);
      } else {
        callback();
      }
    };

    attendreFinVoix(() => {
      // Petit délai pour laisser le visiteur lire le dernier message
      setTimeout(() => {
        setFermetureEnCours(true);
        // Durée synchronisée avec `transition-opacity duration-1000`
        // posée sur l'overlay — après le fade on referme vraiment.
        setTimeout(() => {
          setWidgetOuvert(false);
          setFermetureEnCours(false);
          setMessages([]);
          setEtatPanneau(ETAT_PANNEAU_INITIAL);
          setConversationDemarree(false);
        }, 1000);
      }, 1500);
    });
  }

  function envoyer() {
    const texte = input.trim();
    if (!texte || thinking) return;
    setInput("");
    envoyerTexte(texte);
  }

  // Déclenché par le bouton « Démarrer la conversation » : injecte le
  // message d'accueil dans le fil et lance la lecture TTS. Le clic
  // compte comme interaction utilisateur → l'autoplay audio est
  // autorisé par le navigateur.
  function demarrerConversation() {
    setConversationDemarree(true);
    const idAccueil = crypto.randomUUID();
    setMessages([{ id: idAccueil, role: "assistant", content: CONTENU_ACCUEIL }]);
    envoyerPhraseTTS(CONTENU_ACCUEIL);
  }

  // Pour le badge de notification mobile sur les ailettes
  const actionsOntContenu = etatPanneau.elementActif.kind !== "aucun";
  const ficheACunChamp =
    Object.keys(etatPanneau.fiche).length > 0 ||
    !!etatPanneau.emailValide ||
    !!etatPanneau.telephoneValide ||
    !!etatPanneau.reference;

  // Les options d'accueil cliquables apparaissent dans l'ailette gauche
  // dès que la conversation démarre et tant que le visiteur n'a pas
  // encore parlé — sauf si AXI a déjà ouvert un formulaire ou un choix
  // dans le panneau (dans ce cas, le formulaire a la priorité).
  const visiteurNaPasEncoreParle = !messages.some((m) => m.role === "user");
  const afficherOptionsAccueil =
    conversationDemarree &&
    visiteurNaPasEncoreParle &&
    etatPanneau.elementActif.kind === "aucun";

  // Fermeture par touche Escape quand le modal est ouvert.
  useEffect(() => {
    if (!widgetOuvert) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setWidgetOuvert(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [widgetOuvert]);

  // Ouverture externe via CustomEvent — permet à n'importe quel bouton
  // de la page (hero, CTA narratif, footer) de lancer le widget via
  // `window.dispatchEvent(new CustomEvent("axi:ouvrir"))`.
  useEffect(() => {
    function onOuvrir() {
      setWidgetOuvert(true);
      setPhaseOuverture("chat");
      setTimeout(() => setPhaseOuverture("complet"), 900);
    }
    window.addEventListener("axi:ouvrir", onOuvrir);
    return () => window.removeEventListener("axi:ouvrir", onOuvrir);
  }, []);

  // Blocage du scroll du site hôte quand le modal est ouvert — standard
  // pour tout overlay plein écran.
  useEffect(() => {
    if (!widgetOuvert) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [widgetOuvert]);

  // Si le widget n'est pas encore ouvert, on affiche uniquement la
  // pastille flottante en bas à droite.
  if (!widgetOuvert) {
    return (
      <BoutonFlottant
        onOuvrir={() => {
          setWidgetOuvert(true);
          setPhaseOuverture("chat");
          // Les ailettes apparaissent 900ms après le chat central
          setTimeout(() => setPhaseOuverture("complet"), 900);
        }}
      />
    );
  }

  if (!conversationDemarree) {
    return (
      <ModalOverlay
        onFermer={() => setWidgetOuvert(false)}
        fermetureEnCours={fermetureEnCours}
      >
        <EcranDemarrage onDemarrer={demarrerConversation} />
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay
      onFermer={() => setWidgetOuvert(false)}
      fermetureEnCours={fermetureEnCours}
    >
    <div className="flex h-full items-stretch gap-3 md:h-full">
      {/* === AILETTE GAUCHE — Actions (desktop) — titre centré au
          dessus du panneau, pattern symétrique à l'ailette droite === */}
      <aside
        className={`${
          phaseOuverture === "complet"
            ? "animate-slideOutLeft"
            : "pointer-events-none opacity-0"
        } flex-1 overflow-hidden ${vueMobile === "actions" ? "flex flex-col" : "hidden md:flex md:flex-col"} my-5 md:basis-[32%] md:flex-grow-0 md:flex-shrink-0`}
        aria-label="Panneau actions"
      >
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            Actions
          </h3>
        </div>
        <div className="flex-1 overflow-auto">
          {afficherOptionsAccueil ? (
            <OptionsAccueil
              options={OPTIONS_ACCUEIL_DEFAUT}
              onClique={(libelle) => envoyerTexte(libelle)}
            />
          ) : (
            <PanneauActions
              etat={etatPanneau}
              onPrenomValide={handlePrenomValide}
              onPrenomRefuse={handlePrenomRefuse}
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
      </aside>

      {/* Liseré vertical gauche — fine ligne qui sépare l'ailette
          du chat central sans refermer l'espace. */}
      <div
        aria-hidden
        className="hidden w-px self-stretch bg-gradient-to-b from-transparent via-white/25 to-transparent md:block"
      />

      {/* === CHAT CENTRAL — unique colonne sur l'aurore === */}
      <section
        className={`relative ${
          phaseOuverture === "chat" || phaseOuverture === "complet"
            ? "animate-chatFadeIn"
            : ""
        } overflow-hidden ${vueMobile === "chat" ? "flex flex-1" : "hidden md:flex md:basis-[36%] md:flex-grow md:flex-shrink"}`}
      >
        <div className="flex w-full flex-col">
          {/* Boutons utilitaires discrets en haut à droite (toggle voix
              + bascule mobile). Pas de header plein, le chat vit sur
              l'aurore à la façon AxiHub. */}
          <div className="flex items-center justify-end gap-1 px-2 py-1">
            <button
              onClick={basculerLectureVocale}
              className="hidden rounded-full border border-white/15 bg-white/5 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/10 md:inline-flex"
              aria-label={
                lectureVocaleActive
                  ? "Désactiver la lecture vocale"
                  : "Activer la lecture vocale"
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
            <div className="flex gap-1 md:hidden">
              <button
                onClick={() => setVueMobile("actions")}
                className="relative rounded-full border border-white/15 bg-white/5 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/10"
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
                className="relative rounded-full border border-white/15 bg-white/5 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                aria-label="Voir les infos visiteur"
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

          {/* Bandeau d'alerte si l'autoplay audio est bloqué par le navigateur */}
          {autoplayBloque && (
            <button
              onClick={() => {
                setAutoplayBloque(false);
                if (audioRef.current) {
                  audioRef.current
                    .play()
                    .catch(() => setAutoplayBloque(true));
                }
              }}
              className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 flex-shrink-0"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              <span className="flex-1 text-left">
                Votre navigateur bloque la lecture auto. Cliquez pour activer
                la voix d&apos;AxiSolver.
              </span>
            </button>
          )}

          {/* Fil de messages — directement sur l'aurore, pas de fond */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-5"
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

          {/* Input — style AxiHub sombre */}
          <form
            className="px-3 pb-3 pt-2"
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
                className="flex-1 rounded-2xl border border-white/15 bg-slate-900/70 px-4 py-2.5 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white/40 focus:bg-slate-900/85 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0068FC] text-white shadow-sm transition-all hover:bg-[#0051C7] disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* Liseré vertical droit — symétrique du gauche. */}
      <div
        aria-hidden
        className="hidden w-px self-stretch bg-gradient-to-b from-transparent via-white/25 to-transparent md:block"
      />

      {/* === AILETTE DROITE — Infos visiteur (desktop) === */}
      <aside
        className={`${
          phaseOuverture === "complet"
            ? "animate-slideOutRight"
            : "pointer-events-none opacity-0"
        } flex-1 overflow-hidden ${vueMobile === "fiche" ? "flex flex-col" : "hidden md:flex md:flex-col"} my-5 md:basis-[32%] md:flex-grow-0 md:flex-shrink-0`}
        aria-label="Infos visiteur"
      >
        <div className="relative px-5 pt-5 pb-1">
          <span className="absolute left-5 top-5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-700">
            en direct
          </span>
          <h3 className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            Infos visiteur
          </h3>
        </div>
        <div className="flex-1 overflow-auto">
          <PanneauFiche etat={etatPanneau} />
        </div>
        {/* Signature AxiSolver — logo blanc argenté avec touche dorée,
            adapté au fond sombre aurore boréale de l'ailette. */}
        <div className="pointer-events-none flex justify-center px-5 pb-5 pt-3">
          <Image
            src="/logo-axisolver-signature.png"
            alt="AxiSolver"
            width={2172}
            height={724}
            className="h-auto w-36 opacity-90"
          />
        </div>
      </aside>
    </div>
    </ModalOverlay>
  );
}

function MessageBulle({ role, content }: { role: Role; content: string }) {
  if (role === "assistant") {
    return (
      <div className="flex gap-2">
        <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0068FC] text-[10px] font-semibold text-white">
          A
        </div>
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md bg-slate-100 px-4 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm">
          {content || <span className="text-slate-400">…</span>}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-[#0068FC] px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
        {content}
      </div>
    </div>
  );
}

function IndicateurFrappe() {
  return (
    <div className="flex gap-2">
      <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0068FC] text-[10px] font-semibold text-white">
        A
      </div>
      <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
        </div>
      </div>
    </div>
  );
}

// ================================================================== //
// Bouton flottant — pastille mascotte permanente en bas à droite     //
// ================================================================== //

function BoutonFlottant({ onOuvrir }: { onOuvrir: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9998] md:bottom-6 md:right-6">
      <div className="group relative">
        {/* Halo pulsé derrière la pastille */}
        <span
          aria-hidden
          className="absolute inset-0 -z-10 animate-pulseAxi rounded-full bg-slate-900/30"
        />
        {/* Pastille noire avec la mascotte AxiSolver */}
        <button
          onClick={onOuvrir}
          aria-label="Parler à AxiSolver"
          className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-900 shadow-lg ring-1 ring-slate-900/10 transition-all hover:scale-105 hover:shadow-xl md:h-20 md:w-20"
        >
          <Image
            src="/axi-mascotte-bouton.png"
            alt="AxiSolver"
            width={400}
            height={400}
            priority
            className="h-auto w-14 translate-y-0.5 md:w-16"
          />
        </button>
        {/* Tooltip au survol */}
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Parlez à AxiSolver
          <span
            aria-hidden
            className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-slate-900"
          />
        </span>
      </div>
    </div>
  );
}

// ================================================================== //
// ModalOverlay — card centrée + backdrop flouté du site hôte         //
// ================================================================== //

function ModalOverlay({
  children,
  onFermer,
  fermetureEnCours = false,
}: {
  children: React.ReactNode;
  onFermer: () => void;
  fermetureEnCours?: boolean;
}) {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-stretch justify-center transition-opacity duration-1000 md:items-center md:p-6 ${
        fermetureEnCours ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop flouté qui laisse voir le site hôte derrière */}
      <button
        type="button"
        aria-label="Fermer AxiSolver"
        onClick={onFermer}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      {/* Card centrée — fond aurore boréale (pattern AxiHub /axi).
          Desktop : card centrée 1200×720 rounded. Mobile : plein écran. */}
      <div
        className="relative flex w-full flex-col overflow-hidden shadow-2xl md:h-[720px] md:max-h-[90vh] md:w-full md:max-w-[1200px] md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fond aurore boréale sous tout le contenu — slate-950 avec
            voiles cyan/émeraude/violet qui glissent très lentement. */}
        <AuroreBoreale />

        {/* Bouton de fermeture — toujours visible en haut à droite */}
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer AxiSolver"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Zone de contenu — 3 écrans sur l'aurore (relative z-10 pour
            passer au-dessus des blobs). */}
        <div className="relative z-10 flex-1 overflow-hidden p-3 md:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// ================================================================== //
// Options d'accueil cliquables — ailette gauche, avant 1er message    //
// ================================================================== //

function OptionsAccueil({
  options,
  onClique,
}: {
  options: OptionAccueil[];
  onClique: (libelle: string) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-3 px-4 pb-4">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onClique(o.libelle)}
          className="animate-fadeIn w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm leading-relaxed text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15"
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

// ================================================================== //
// Écran de démarrage — bouton central avant la 1re prise de parole    //
// ================================================================== //

function EcranDemarrage({ onDemarrer }: { onDemarrer: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="animate-mascotte flex flex-col items-center gap-4">
        <Image
          src="/axi-mascotte-accueil.png"
          alt="AxiSolver"
          width={420}
          height={420}
          priority
          className="h-auto w-40 md:w-48"
        />
        <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          AxiSolver
        </h2>
      </div>

      <button
        type="button"
        onClick={onDemarrer}
        className="relative inline-flex items-center gap-3 rounded-full bg-[#0068FC] px-10 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-[#0051C7] md:text-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        Démarrer la conversation
      </button>
    </div>
  );
}
