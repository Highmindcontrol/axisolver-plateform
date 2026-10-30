"use client";

import { useEffect, useRef, useState } from "react";

import { useDictee } from "../hooks/use-dictee";
import { usePiecesJointes } from "../hooks/use-pieces-jointes";
import {
  createSentenceExtractor,
  useStreamingTts,
} from "../hooks/use-streaming-tts";
import { useTheme } from "../theme/use-theme";
import type {
  ConfigAxiChat,
  MessageAxi,
  OrdreAxi,
  RepereAxi,
} from "../types";

import { ApercuPiecesJointes } from "./apercu-pieces-jointes";
import { BulleMessage } from "./bulle-message";
import { EnteteChat } from "./entete-chat";
import { ModalNotationGaugista } from "./modal-notation-gaugista";
import { SuggestionsRapides } from "./suggestions-rapides";
import { ZoneSaisie } from "./zone-saisie";

/**
 * Composant racine du pack @axi-chat.
 *
 * Streaming NDJSON (pattern AxiHub turn-stream) : le backend émet
 * ligne par ligne les événements `speech_delta`, `ordre`, `done`,
 * `error`. On met à jour la bulle AXI en live + on alimente le
 * streaming TTS phrase par phrase. Résultat : la voix démarre
 * typiquement en ~1-2s au lieu d'attendre la fin complète.
 */
export function AxiChatRoot({ config }: { config: ConfigAxiChat }) {
  const { variablesCss } = useTheme(config.theme);

  const [messages, setMessages] = useState<MessageAxi[]>(() => {
    if (config.messagesInitiaux && config.messagesInitiaux.length > 0) {
      return config.messagesInitiaux;
    }
    return [messageAccueil(config)];
  });
  const [brouillon, setBrouillon] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [envoyerApresDictee, setEnvoyerApresDictee] = useState(false);
  const brouillonRef = useRef("");
  const refBaseAvantDictee = useRef("");
  const refListeMessages = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    brouillonRef.current = brouillon;
  }, [brouillon]);

  // Scroll auto en bas à chaque nouveau message (ou delta streaming)
  // pour que le dernier message ne reste pas caché derrière la zone
  // de saisie.
  useEffect(() => {
    const el = refListeMessages.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ─── Chargement de l'historique persisté au mount ────────
  useEffect(() => {
    const url = config.endpoints.urlHistorique;
    if (!url) return;
    let annule = false;
    fetch(url, { headers: config.endpoints.entetes })
      .then(async (resp) => {
        if (!resp.ok) return;
        const data = (await resp.json()) as { messages?: MessageAxi[] };
        if (annule) return;
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((m) => ({
              ...m,
              horodatage: m.horodatage ? new Date(m.horodatage) : undefined,
            })),
          );
        } else {
          setMessages([messageAccueil(config)]);
        }
      })
      .catch(() => undefined);
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.endpoints.urlHistorique, config.cleReload]);

  // ─── Dictée (STT) ─────────────────────────────────────────
  const dictee = useDictee({
    langue: localeDepuisLangue(config.contexte?.langue),
    urlDictee: config.endpoints.urlDictee,
    entetes: config.endpoints.entetes,
  });
  useEffect(() => {
    if (dictee.etat === "repos") return;
    const base = refBaseAvantDictee.current;
    const t = dictee.transcription;
    if (!t) {
      setBrouillon(base);
      return;
    }
    setBrouillon(base ? `${base} ${t}`.trim() : t);
  }, [dictee.transcription, dictee.etat]);

  // ─── Voix synthèse (TTS streaming phrase par phrase) ─────
  const voixStream = useStreamingTts({
    urlVoix: config.endpoints.urlVoix,
    entetes: config.endpoints.entetes,
  });

  // ─── Pièces jointes ───────────────────────────────────────
  const piecesJointes = usePiecesJointes({
    urlUpload: config.endpoints.urlUpload ?? "",
    entetes: config.endpoints.entetes,
  });

  // ─── Notation Gaugista ────────────────────────────────────
  const [notationOuverte, setNotationOuverte] = useState(false);
  const peutNoter =
    !!config.fonctionnalites?.notationGaugista &&
    !!config.endpoints.urlGaugista;
  const declencheurs = config.notationGaugista?.declencheurs ?? [
    "bouton",
    "fermeture",
  ];

  const suggestionsCourantes =
    messages.length > 0 &&
    messages[messages.length - 1].role === "axi" &&
    (messages[messages.length - 1].suggestions?.length ?? 0) > 0
      ? messages[messages.length - 1].suggestions ?? []
      : [];

  async function envoyer(texte: string) {
    const contenu = texte.trim();
    const pieces = piecesJointes.pieces;
    if ((!contenu && pieces.length === 0) || envoiEnCours) return;
    if (dictee.etat !== "repos") dictee.arreter();

    // Coupe toute lecture TTS en cours — la nouvelle réponse va parler.
    voixStream.stopAll();

    const msgVisiteur: MessageAxi = {
      id: `v-${Date.now()}`,
      role: "visiteur",
      contenu,
      piecesJointes: pieces.length > 0 ? pieces : undefined,
      horodatage: new Date(),
    };
    const idAxi = `a-${Date.now()}`;
    const msgAxiVide: MessageAxi = {
      id: idAxi,
      role: "axi",
      contenu: "",
      horodatage: new Date(),
      ordres: [],
    };

    setMessages((prev) => [...prev, msgVisiteur, msgAxiVide]);
    config.surMessage?.(msgVisiteur);
    setBrouillon("");
    piecesJointes.vider();
    dictee.reinitialiser();

    setEnvoiEnCours(true);
    try {
      await consommerStream({
        url: config.endpoints.urlChat,
        entetes: config.endpoints.entetes,
        payload: {
          messages: [...messages, msgVisiteur].map((m) => ({
            role: m.role,
            contenu: m.contenu,
          })),
          contexte: config.contexte,
          siteId: config.contexte?.siteId,
          channel: config.channel,
        },
        voixActive: !!config.fonctionnalites?.voixSynthese,
        onDelta: (text) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === idAxi ? { ...m, contenu: m.contenu + text } : m,
            ),
          );
        },
        onPhrase: (phrase) => {
          if (config.fonctionnalites?.voixSynthese) {
            voixStream.enqueue(phrase);
          }
        },
        onOrdre: (ordre) => {
          const o: OrdreAxi = {
            id: ordre.id,
            libelle: ordre.libelle,
            statut: ordre.statut,
            horodatage: ordre.horodatage ? new Date(ordre.horodatage) : undefined,
          };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === idAxi
                ? { ...m, ordres: [...(m.ordres ?? []), o] }
                : m,
            ),
          );
          config.surOrdre?.(o);
        },
        onRepere: (repere) => {
          const r: RepereAxi = {
            id: repere.id,
            kind: repere.kind,
            label: repere.label,
            cible: repere.cible,
            horodatage: repere.horodatage
              ? new Date(repere.horodatage)
              : undefined,
          };
          config.surRepere?.(r);
        },
        onDone: (contenu) => {
          // Si le serveur a renvoyé un `contenu` final différent (cas
          // rare — fallback non-streaming), on remplace. Sinon on garde
          // ce qu'on a accumulé via les deltas.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === idAxi && contenu && !m.contenu.trim()
                ? { ...m, contenu }
                : m,
            ),
          );
          config.surMessage?.({
            id: idAxi,
            role: "axi",
            contenu,
          });
        },
      });
    } catch (e) {
      const message =
        e instanceof Error && e.message
          ? e.message
          : "AXI est momentanément indisponible. Réessayez.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === idAxi ? { ...m, role: "systeme", contenu: message } : m,
        ),
      );
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function toggleDictee() {
    if (dictee.etat === "repos") {
      refBaseAvantDictee.current = brouillonRef.current.trim();
      setEnvoyerApresDictee(false);
      dictee.demarrer().catch(() => undefined);
    } else {
      setEnvoyerApresDictee(true);
      dictee.arreter();
    }
  }

  useEffect(() => {
    if (!envoyerApresDictee) return;
    if (dictee.etat !== "repos") return;
    const t = setTimeout(() => {
      const texte = brouillonRef.current.trim();
      if (texte) envoyer(texte);
      setEnvoyerApresDictee(false);
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dictee.etat, envoyerApresDictee]);

  const peutDeclencherParBouton =
    peutNoter && declencheurs.includes("bouton");

  return (
    <div
      className="flex h-full flex-col"
      style={{
        ...variablesCss,
        fontFamily: "var(--axi-chat-police)",
        color: "var(--axi-chat-texte)",
      }}
    >
      {notationOuverte && config.endpoints.urlGaugista ? (
        <ModalNotationGaugista
          config={config.notationGaugista}
          urlGaugista={config.endpoints.urlGaugista}
          entetes={config.endpoints.entetes}
          onFerme={() => setNotationOuverte(false)}
          onEnvoye={(n, c) => config.surNotation?.(n, c)}
        />
      ) : (
        <>
          {config.avecEntete !== false && (
            <EnteteChat
              contexte={config.contexte}
              onTerminer={
                peutDeclencherParBouton
                  ? () => setNotationOuverte(true)
                  : undefined
              }
              onNouvelleConversation={config.surNouvelleConversation}
            />
          )}

          <div
            ref={refListeMessages}
            className="flex-1 space-y-3 overflow-y-auto py-2"
          >
            {messages.map((m) => (
              <BulleMessage key={m.id} message={m} />
            ))}
          </div>

      {config.fonctionnalites?.suggestionsRapides &&
        suggestionsCourantes.length > 0 && (
          <SuggestionsRapides
            suggestions={suggestionsCourantes}
            onChoisir={(t) => envoyer(t)}
          />
        )}

      {config.fonctionnalites?.piecesJointes && (
        <ApercuPiecesJointes
          pieces={piecesJointes.pieces}
          enCours={piecesJointes.enCours}
          onRetirer={piecesJointes.retirer}
        />
      )}

      {dictee.erreur && (
        <p
          className="pt-2 text-xs"
          style={{ color: "var(--axi-chat-texte-tertiaire)" }}
        >
          {dictee.erreur}
        </p>
      )}

      <ZoneSaisie
        valeur={brouillon}
        onChange={setBrouillon}
        onEnvoyer={() => envoyer(brouillon)}
        placeholder={config.placeholderSaisie}
        fonctionnalites={config.fonctionnalites}
        envoiDesactive={envoiEnCours}
        onDictee={config.fonctionnalites?.dictee ? toggleDictee : undefined}
        dicteeActive={dictee.etat !== "repos"}
        onPiecesJointes={
          config.fonctionnalites?.piecesJointes && config.endpoints.urlUpload
            ? piecesJointes.ouvrir
            : undefined
        }
      />

      {config.fonctionnalites?.piecesJointes && config.endpoints.urlUpload && (
        <input
          ref={piecesJointes.input.ref}
          type="file"
          multiple
          hidden
          accept={piecesJointes.input.accept}
          onChange={piecesJointes.input.onChange}
        />
      )}
        </>
      )}
    </div>
  );
}

function localeDepuisLangue(langue: ConfigAxiChat["contexte"] extends infer _
  ? NonNullable<ConfigAxiChat["contexte"]>["langue"] | undefined
  : never): string {
  const map: Record<string, string> = {
    fr: "fr-FR",
    en: "en-US",
    es: "es-ES",
    de: "de-DE",
    it: "it-IT",
  };
  return (langue && map[langue]) ?? "fr-FR";
}

function messageAccueil(config: ConfigAxiChat): MessageAxi {
  const prenom = config.contexte?.prenomUtilisateur;
  const nom = config.contexte?.nomAssistant ?? "AXI";
  const marque = config.contexte?.sousTitre ?? "votre copilote AxiSolver";
  const texte =
    config.accueilPersonnalise ??
    (prenom
      ? `Bonjour ${prenom}. Je suis ${nom}, ${marque}. Dites-moi sur quel sujet vous souhaitez avancer.`
      : `Bonjour. Je suis ${nom}, ${marque}. Dites-moi sur quel sujet vous souhaitez avancer.`);
  return {
    id: "accueil",
    role: "axi",
    contenu: texte,
    horodatage: new Date(),
  };
}

/**
 * Consomme le flux NDJSON émis par `/api/dashboard/chat` et déclenche
 * les callbacks correspondants au fur et à mesure. Lecture ligne par
 * ligne via TextDecoder.
 */
async function consommerStream(params: {
  url: string;
  entetes?: Record<string, string>;
  payload: unknown;
  voixActive: boolean;
  onDelta: (text: string) => void;
  onPhrase: (phrase: string) => void;
  onOrdre: (ordre: {
    id: string;
    libelle: string;
    statut: "propose" | "en_cours" | "termine" | "echoue" | "refuse";
    horodatage?: string;
  }) => void;
  onRepere: (repere: {
    id: string;
    kind: "section" | "lien";
    label: string;
    cible?: string;
    horodatage?: string;
  }) => void;
  onDone: (contenu: string) => void;
}): Promise<void> {
  const resp = await fetch(params.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.entetes ?? {}),
    },
    body: JSON.stringify(params.payload),
  });
  if (!resp.ok || !resp.body) {
    throw new Error(`AXI indisponible (HTTP ${resp.status}).`);
  }

  const extractor = createSentenceExtractor((phrase) => {
    if (params.voixActive) params.onPhrase(phrase);
  });

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let dernierContenu = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lignes = buffer.split("\n");
    buffer = lignes.pop() ?? "";
    for (const ligne of lignes) {
      const brut = ligne.trim();
      if (!brut) continue;
      let evt: {
        type: string;
        text?: string;
        contenu?: string;
        message?: string;
        ordre?: {
          id: string;
          libelle: string;
          statut: "propose" | "en_cours" | "termine" | "echoue" | "refuse";
          horodatage?: string;
        };
        repere?: {
          id: string;
          kind: "section" | "lien";
          label: string;
          cible?: string;
          horodatage?: string;
        };
      };
      try {
        evt = JSON.parse(brut);
      } catch {
        continue;
      }
      if (evt.type === "speech_delta" && typeof evt.text === "string") {
        params.onDelta(evt.text);
        extractor.feed(evt.text);
      } else if (evt.type === "ordre" && evt.ordre) {
        params.onOrdre(evt.ordre);
      } else if (evt.type === "repere" && evt.repere) {
        params.onRepere(evt.repere);
      } else if (evt.type === "done") {
        dernierContenu = evt.contenu ?? "";
      } else if (evt.type === "error") {
        extractor.flush();
        throw new Error(evt.message ?? "Erreur serveur.");
      }
    }
  }

  // Traite le dernier reliquat (dernière demi-phrase sans ponctuation)
  extractor.flush();
  params.onDone(dernierContenu);
}
