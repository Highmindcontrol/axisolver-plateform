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
  // Voix TTS actuelle — par défaut echo (voix d'homme neutre, moins grave qu'onyx)
  const [voix, setVoix] = useState<
    "onyx" | "echo" | "nova" | "shimmer" | "alloy" | "fable"
  >("echo");

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
    // 2a. Après 3500ms (temps de lire la bulle au revoir), les ailettes se replient
    setTimeout(() => setPhaseFermeture("ailettes"), 3500);
    // 2b. Après 5400ms (ailettes 1900ms), le chat central fade-out
    setTimeout(() => setPhaseFermeture("chat"), 5400);
    // 3. Après 6300ms (chat fade 900ms), on referme vraiment le widget
    setTimeout(() => {
      setWidgetOuvert(false);
      setFermetureEnCours(false);
      setPhaseFermeture("aucune");
      // Reset pour une éventuelle réouverture
      setMessages([]);
      setEtatPanneau(ETAT_PANNEAU_INITIAL);
    }, 6300);
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
              className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100"
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

          {/* Fil de messages — masqué pendant la fermeture pour éviter
              l'effet palimpseste (texte visible derrière la mascotte) */}
          <div
            ref={scrollRef}
            className={`flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-5 transition-opacity duration-500 ${
              phaseFermeture === "aurevoir" || phaseFermeture === "ailettes"
                ? "opacity-0"
                : "opacity-100"
            }`}
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
          Bonjour, bienvenue !{" "}
          <span className="font-semibold text-blue-600">
            Je suis AxiSolver,
          </span>{" "}
          et je n&apos;en ai peut-être pas l&apos;air comme ça 😄 mais
          d&apos;ici peu, vous n&apos;allez plus pouvoir vous passer de
          moi. On fait connaissance ?
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
