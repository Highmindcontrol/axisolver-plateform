"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook de dictée (STT — speech to text).
 *
 * Stratégie :
 *  1. Si l'API `window.SpeechRecognition` (ou `webkitSpeechRecognition`)
 *     est disponible, on l'utilise directement — zéro appel backend,
 *     résultat quasi instantané.
 *  2. Sinon, on enregistre via MediaRecorder et on POST le blob audio
 *     sur `urlDictee`. Le backend renvoie `{ texte: string }`.
 *
 * Expose un API simple : `demarrer()`, `arreter()`, `enregistre`, `transcription`.
 */

type EtatDictee = "repos" | "enregistre" | "traitement";

type OptionsDictee = {
  langue?: string; // ex: "fr-FR"
  urlDictee?: string;
  entetes?: Record<string, string>;
};

type InstanceSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onerror: (ev: Event) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => InstanceSpeechRecognition;

export function useDictee(options: OptionsDictee = {}): {
  etat: EtatDictee;
  transcription: string;
  erreur: string | null;
  disponible: boolean;
  demarrer: () => Promise<void>;
  arreter: () => void;
  reinitialiser: () => void;
} {
  const [etat, setEtat] = useState<EtatDictee>("repos");
  const [transcription, setTranscription] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const refRecognition = useRef<InstanceSpeechRecognition | null>(null);
  const refRecorder = useRef<MediaRecorder | null>(null);
  const refChunks = useRef<Blob[]>([]);

  const disponible = typeof window !== "undefined" && (
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window ||
    (typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia)
  );

  const demarrer = useCallback(async () => {
    setErreur(null);
    setTranscription("");

    if (typeof window === "undefined") return;

    const CtorNatif =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
        .webkitSpeechRecognition;

    if (CtorNatif) {
      try {
        const reco = new CtorNatif();
        reco.lang = options.langue ?? "fr-FR";
        reco.continuous = false;
        reco.interimResults = true;
        reco.onresult = (ev) => {
          const dernier = ev.results[ev.results.length - 1];
          const texte = dernier[0].transcript;
          setTranscription(texte);
        };
        reco.onerror = (ev) => {
          setErreur(`Dictée indisponible (${(ev as unknown as { error?: string }).error ?? "erreur"})`);
          setEtat("repos");
        };
        reco.onend = () => setEtat("repos");
        reco.start();
        refRecognition.current = reco;
        setEtat("enregistre");
        return;
      } catch (e) {
        console.warn("[axi-chat] dictée native échouée, fallback MediaRecorder", e);
      }
    }

    if (!options.urlDictee) {
      setErreur("Dictée non supportée par ce navigateur.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      refChunks.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) refChunks.current.push(ev.data);
      };
      recorder.onstop = async () => {
        setEtat("traitement");
        const blob = new Blob(refChunks.current, { type: "audio/webm" });
        try {
          const form = new FormData();
          form.append("audio", blob, "dictee.webm");
          const resp = await fetch(options.urlDictee!, {
            method: "POST",
            headers: options.entetes,
            body: form,
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const data = (await resp.json()) as { texte?: string };
          setTranscription(data.texte ?? "");
        } catch (e) {
          setErreur(
            e instanceof Error ? e.message : "Transcription impossible.",
          );
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          setEtat("repos");
        }
      };
      recorder.start();
      refRecorder.current = recorder;
      setEtat("enregistre");
    } catch {
      setErreur("Micro inaccessible — vérifie les permissions.");
      setEtat("repos");
    }
  }, [options.langue, options.urlDictee, options.entetes]);

  const arreter = useCallback(() => {
    if (refRecognition.current) {
      refRecognition.current.stop();
      refRecognition.current = null;
    }
    if (refRecorder.current && refRecorder.current.state !== "inactive") {
      refRecorder.current.stop();
      refRecorder.current = null;
    }
  }, []);

  const reinitialiser = useCallback(() => {
    setTranscription("");
    setErreur(null);
  }, []);

  useEffect(() => () => arreter(), [arreter]);

  return {
    etat,
    transcription,
    erreur,
    disponible,
    demarrer,
    arreter,
    reinitialiser,
  };
}
