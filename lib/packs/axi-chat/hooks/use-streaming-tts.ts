"use client";

import { useCallback, useRef } from "react";

/**
 * Queue TTS streamée — reprise du pattern AxiHub.
 *
 * - `enqueue(segment)` : lance en parallèle un fetch TTS pour ce
 *   segment de phrase. L'audio sera joué quand ce sera son tour
 *   dans la queue.
 * - `stopAll()` : coupe l'audio en cours + vide la queue. À appeler
 *   au début d'un nouveau tour pour qu'un reliquat du tour précédent
 *   ne recouvre pas la nouvelle réponse.
 *
 * Les fetchs TTS tournent EN PARALLÈLE (pour que le son suivant soit
 * prêt dès que l'actuel termine), mais la lecture reste strictement
 * SÉQUENTIELLE via `audio.onended`.
 *
 * Si le TTS plante ou prend trop longtemps sur un segment, on passe
 * au suivant sans bloquer la queue (fire-and-forget résilient).
 */
export function useStreamingTts(options: {
  urlVoix?: string;
  voixId?: string;
  entetes?: Record<string, string>;
}) {
  const queueRef = useRef<Array<Promise<HTMLAudioElement | null>>>([]);
  const playingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<string[]>([]);

  const playNext = useCallback(async () => {
    const nextPromise = queueRef.current.shift();
    if (!nextPromise) {
      playingRef.current = false;
      return;
    }
    playingRef.current = true;
    const audio = await nextPromise;
    if (!audio) {
      void playNext();
      return;
    }
    currentAudioRef.current = audio;
    audio.onended = () => {
      currentAudioRef.current = null;
      void playNext();
    };
    audio.onerror = () => {
      currentAudioRef.current = null;
      void playNext();
    };
    try {
      await audio.play();
    } catch {
      void playNext();
    }
  }, []);

  const enqueue = useCallback(
    (segment: string) => {
      const text = segment.trim();
      if (!text || !options.urlVoix) return;

      const promise = fetchTts(text, options).then((result) => {
        if (!result) return null;
        urlsRef.current.push(result.url);
        return result.audio;
      });
      queueRef.current.push(promise);
      if (!playingRef.current) {
        void playNext();
      }
    },
    [playNext, options],
  );

  const stopAll = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    for (const u of urlsRef.current) URL.revokeObjectURL(u);
    urlsRef.current = [];
    queueRef.current = [];
    playingRef.current = false;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { enqueue, stopAll };
}

async function fetchTts(
  text: string,
  options: {
    urlVoix?: string;
    voixId?: string;
    entetes?: Record<string, string>;
  },
): Promise<{ audio: HTMLAudioElement; url: string } | null> {
  if (!options.urlVoix) return null;
  try {
    const res = await fetch(options.urlVoix, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.entetes ?? {}),
      },
      body: JSON.stringify({ texte: text, voixId: options.voixId }),
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    return { audio, url };
  } catch {
    return null;
  }
}

/**
 * Extracteur de phrases depuis un buffer qui grossit par deltas.
 *
 * Appelle `onSentence(text)` chaque fois qu'une phrase complète est
 * détectée (fin : `.`, `!`, `?` suivie d'espace ou de fin de string).
 *
 * `flush()` à appeler à la fin du stream pour émettre le reste du
 * buffer qui n'a pas de ponctuation finale (dernière demi-phrase).
 *
 * Repris verbatim du pattern AxiHub — regex éprouvée en prod.
 */
export function createSentenceExtractor(
  onSentence: (sentence: string) => void,
) {
  let buffer = "";
  let flushedUpTo = 0;

  // `.`, `!` ou `?` suivie d'espace ou fin. Évite les faux positifs
  // sur `3.5 €` (point suivi d'un chiffre) et sur les points internes
  // d'URL. Pas parfait sur `etc.` ou `M. Durand` mais acceptable — au
  // pire ça coupe l'audio en 2 segments qui jouent à la suite.
  const SENTENCE_END = /[.!?](?=\s|$)/g;

  function feed(chunk: string) {
    buffer += chunk;
    SENTENCE_END.lastIndex = flushedUpTo;
    let match: RegExpExecArray | null;
    while ((match = SENTENCE_END.exec(buffer)) !== null) {
      const endIdx = match.index + 1;
      const segment = buffer.slice(flushedUpTo, endIdx).trim();
      if (segment.length > 0) onSentence(segment);
      flushedUpTo = endIdx;
      SENTENCE_END.lastIndex = endIdx;
    }
  }

  function flush() {
    const remaining = buffer.slice(flushedUpTo).trim();
    if (remaining.length > 0) onSentence(remaining);
    flushedUpTo = buffer.length;
  }

  return { feed, flush };
}
