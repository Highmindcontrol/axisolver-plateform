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

type ResultatSpeech = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type InstanceSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (ev: {
    resultIndex: number;
    results: ArrayLike<ResultatSpeech>;
  }) => void;
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
  // true tant que l'utilisateur n'a pas cliqué stop ; permet de
  // redémarrer SpeechRecognition quand Chrome le coupe sur silence.
  const refArretManuel = useRef(false);
  // Accumulateur des blocs isFinal depuis le démarrage courant.
  const refTextFinal = useRef("");

  const disponible = typeof window !== "undefined" && (
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window ||
    (typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia)
  );

  const demarrer = useCallback(async () => {
    setErreur(null);
    setTranscription("");
    refTextFinal.current = "";
    refArretManuel.current = false;

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
        // continuous=true : la session reste ouverte jusqu'au stop
        // manuel, même pendant les silences. Chrome coupe quand même
        // au bout de ~1 min — on relance dans onend si pas arrêté.
        reco.continuous = true;
        reco.interimResults = true;
        reco.onresult = (ev) => {
          // ev.results s'étend à chaque event ; on parcourt depuis
          // resultIndex pour n'ajouter que les NOUVEAUX blocs finaux
          // à l'accumulateur, et on affiche interim en plus pour le
          // temps réel.
          let interim = "";
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const r = ev.results[i];
            const texte = r[0].transcript;
            if (r.isFinal) {
              refTextFinal.current = (refTextFinal.current + " " + texte).trim();
            } else {
              interim += texte;
            }
          }
          setTranscription((refTextFinal.current + " " + interim).trim());
        };
        reco.onerror = (ev) => {
          const code = (ev as unknown as { error?: string }).error;
          // "no-speech" / "aborted" : silence prolongé ou stop normal.
          // On ne polue pas l'UI avec un message d'erreur.
          if (code && code !== "no-speech" && code !== "aborted") {
            setErreur(`Dictée indisponible (${code})`);
          }
        };
        reco.onend = () => {
          // Si l'utilisateur n'a PAS cliqué stop, Chrome a coupé seul :
          // on relance immédiatement pour simuler un enregistrement
          // continu « jusqu'au clic ».
          if (!refArretManuel.current && refRecognition.current === reco) {
            try {
              reco.start();
              return;
            } catch {
              // start() peut échouer si la session est encore en
              // cours de fermeture — on tombe en repos dans ce cas.
            }
          }
          refRecognition.current = null;
          setEtat("repos");
        };
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
    refArretManuel.current = true;
    if (refRecognition.current) {
      try {
        refRecognition.current.stop();
      } catch {
        // stop() peut lever si pas encore démarré ; ignoré.
      }
      // On NE nullifie PAS refRecognition.current ici : onend s'en
      // charge et c'est lui qui bascule l'état en "repos".
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
