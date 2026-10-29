"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook de synthèse vocale (TTS).
 *
 * Appelle `urlVoix` avec `{ texte, voixId? }` et attend un flux audio
 * en réponse. Le backend AxiSolver sert typiquement du MP3 depuis
 * ElevenLabs (plan Scale/Business — voix clonée AXI).
 *
 * Fallback Web Speech API (`speechSynthesis`) si pas d'endpoint : voix
 * système, moins jolie mais toujours fonctionnel.
 */

type EtatVoix = "repos" | "chargement" | "lecture" | "erreur";

type OptionsVoix = {
  urlVoix?: string;
  voixId?: string;
  entetes?: Record<string, string>;
  /** Langue pour fallback Web Speech API (ex: 'fr-FR'). */
  langue?: string;
};

export function useVoixSynthese(options: OptionsVoix = {}): {
  etat: EtatVoix;
  lire: (texte: string) => Promise<void>;
  stop: () => void;
} {
  const [etat, setEtat] = useState<EtatVoix>("repos");
  const refAudio = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (refAudio.current) {
      refAudio.current.pause();
      refAudio.current.src = "";
      refAudio.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setEtat("repos");
  }, []);

  const lire = useCallback(
    async (texte: string) => {
      stop();
      if (!texte.trim()) return;

      if (options.urlVoix) {
        setEtat("chargement");
        try {
          const resp = await fetch(options.urlVoix, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(options.entetes ?? {}),
            },
            body: JSON.stringify({ texte, voixId: options.voixId }),
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          refAudio.current = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            setEtat("repos");
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            setEtat("erreur");
          };
          await audio.play();
          setEtat("lecture");
        } catch (e) {
          console.warn("[axi-chat] voix synthèse backend échouée", e);
          lireNative(texte, options.langue);
        }
        return;
      }

      lireNative(texte, options.langue);

      function lireNative(t: string, langue: string | undefined) {
        if (
          typeof window === "undefined" ||
          !window.speechSynthesis ||
          typeof window.SpeechSynthesisUtterance === "undefined"
        ) {
          setEtat("erreur");
          return;
        }
        const utterance = new SpeechSynthesisUtterance(t);
        utterance.lang = langue ?? "fr-FR";
        utterance.onend = () => setEtat("repos");
        utterance.onerror = () => setEtat("erreur");
        window.speechSynthesis.speak(utterance);
        setEtat("lecture");
      }
    },
    [options.urlVoix, options.voixId, options.entetes, options.langue, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return { etat, lire, stop };
}
