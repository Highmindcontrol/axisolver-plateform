"use client";

/**
 * BoutonMicro — push-to-talk pour AxiSolver.
 *
 * Click → démarre l'enregistrement audio du micro
 * Click à nouveau → arrête + POST vers /api/transcrire + renvoie
 *                   le texte transcrit au parent via onTranscription
 *
 * États visuels :
 *   - idle       : bouton gris, icône micro
 *   - recording  : bouton rouge pulsant, point rouge
 *   - processing : spinner animé, désactivé
 */

import { useEffect, useRef, useState } from "react";

type EtatMicro = "idle" | "recording" | "processing";

type Props = {
  disabled?: boolean;
  onTranscription: (texte: string) => void;
};

export function BoutonMicro({ disabled, onTranscription }: Props) {
  const [etat, setEtat] = useState<EtatMicro>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Nettoyage à l'unmount
  useEffect(() => {
    return () => {
      arreter();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function arreter() {
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }

  async function demarrerEnregistrement() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;

      // Format compatible Whisper (webm/opus par défaut en navigateur)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setEtat("processing");
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        try {
          const formData = new FormData();
          // Whisper exige une extension — on nomme explicitement audio.webm
          formData.append("audio", blob, "audio.webm");

          const res = await fetch("/api/transcrire", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { texte?: string; erreur?: string };

          if (data.texte && data.texte.trim()) {
            onTranscription(data.texte.trim());
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "erreur transcription";
          console.error("[micro] transcription échouée :", message);
        } finally {
          setEtat("idle");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setEtat("recording");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "accès micro refusé";
      console.error("[micro] accès refusé :", message);
      setEtat("idle");
    }
  }

  function arreterEnregistrement() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  function clic() {
    if (disabled || etat === "processing") return;
    if (etat === "idle") demarrerEnregistrement();
    else if (etat === "recording") arreterEnregistrement();
  }

  return (
    <button
      type="button"
      onClick={clic}
      disabled={disabled || etat === "processing"}
      aria-label={
        etat === "recording"
          ? "Arrêter l'enregistrement"
          : etat === "processing"
            ? "Transcription en cours"
            : "Parler à AxiSolver"
      }
      className={`relative inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all ${
        etat === "recording"
          ? "animate-pulseGlow bg-red-600 text-white hover:bg-red-700"
          : etat === "processing"
            ? "bg-slate-200 text-slate-500"
            : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {etat === "processing" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 animate-spin"
          aria-hidden
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : etat === "recording" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-3.5 w-3.5"
          aria-hidden
        >
          <rect x="6" y="6" width="12" height="12" rx="2" />
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
          aria-hidden
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      )}
      {etat === "recording" && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-400">
          <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
        </span>
      )}
    </button>
  );
}
