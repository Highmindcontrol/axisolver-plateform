"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook de synthèse vocale (TTS).
 *
 * Doctrine latence (reprise du pattern AxiHub) : on NE génère PAS un
 * seul MP3 pour tout le texte. On découpe en phrases, on lance les
 * requêtes ElevenLabs EN PARALLÈLE, et on commence à parler dès que
 * la première phrase est prête. Résultat : voix démarre en ~1s au
 * lieu de 5-10s pour un gros texte.
 *
 * Fallback Web Speech API si pas d'endpoint ou si fetch plante.
 */

type EtatVoix = "repos" | "chargement" | "lecture" | "erreur";

type OptionsVoix = {
  urlVoix?: string;
  voixId?: string;
  entetes?: Record<string, string>;
  /** Langue pour fallback Web Speech API (ex: 'fr-FR'). */
  langue?: string;
};

/**
 * Découpe un texte en phrases ≤ max caractères. Regex `.!?` suivie
 * d'espace, repli sur virgules pour les phrases très longues (pour
 * éviter les coupures silencieuses d'ElevenLabs > 500 car).
 */
function couperEnPhrases(texte: string, max = 240): string[] {
  const brut = texte
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of brut) {
    if (p.length <= max) {
      out.push(p);
      continue;
    }
    const morceaux = p.split(/(?<=,)\s+/);
    let buf = "";
    for (const m of morceaux) {
      if ((buf + " " + m).trim().length > max) {
        if (buf) out.push(buf.trim());
        buf = m;
      } else {
        buf = buf ? `${buf} ${m}` : m;
      }
    }
    if (buf) out.push(buf.trim());
  }
  return out;
}

/** Nettoie markdown/émojis/parenthèses techniques avant TTS. */
function nettoyerPourVocal(t: string): string {
  return t
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function useVoixSynthese(options: OptionsVoix = {}): {
  etat: EtatVoix;
  lire: (texte: string) => Promise<void>;
  stop: () => void;
} {
  const [etat, setEtat] = useState<EtatVoix>("repos");
  const refAudio = useRef<HTMLAudioElement | null>(null);
  const refAnnule = useRef(false);
  const refUrls = useRef<string[]>([]);

  const stop = useCallback(() => {
    refAnnule.current = true;
    if (refAudio.current) {
      refAudio.current.onended = null;
      refAudio.current.onerror = null;
      refAudio.current.pause();
      refAudio.current.src = "";
      refAudio.current = null;
    }
    for (const u of refUrls.current) URL.revokeObjectURL(u);
    refUrls.current = [];
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setEtat("repos");
  }, []);

  const lire = useCallback(
    async (texte: string) => {
      stop();
      refAnnule.current = false;

      const propre = nettoyerPourVocal(texte);
      if (!propre) return;

      const phrases = couperEnPhrases(propre);
      if (phrases.length === 0) return;

      // Pas d'endpoint ElevenLabs → fallback Web Speech API
      // immédiat (zéro latence réseau). Enchaîne phrase par phrase
      // via `onend`.
      if (!options.urlVoix) {
        lireNative(phrases, options.langue, () => setEtat("repos"));
        setEtat("lecture");
        return;
      }

      setEtat("chargement");

      // Fire-and-forget : on lance TOUTES les requêtes en parallèle
      // dès maintenant. Pendant que la première se télécharge, les
      // suivantes se chargent en arrière-plan — elles seront prêtes
      // quand on en aura besoin.
      const promessesAudio = phrases.map((p) =>
        fetch(options.urlVoix!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(options.entetes ?? {}),
          },
          body: JSON.stringify({ texte: p, voixId: options.voixId }),
        })
          .then(async (resp) => {
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            refUrls.current.push(url);
            return url;
          })
          .catch((e) => {
            console.warn("[axi-chat] voix segment échoué", e);
            return null;
          }),
      );

      // Joue séquentiellement : chaque phrase attend que la précédente
      // soit finie, puis consomme sa promesse (qui est déjà en vol).
      // Fallback natif pour les segments qui ont échoué.
      try {
        for (let i = 0; i < phrases.length; i++) {
          if (refAnnule.current) return;
          const url = await promessesAudio[i];
          if (refAnnule.current) return;
          if (!url) {
            await new Promise<void>((resolve) => {
              lireNative([phrases[i]], options.langue, () => resolve());
            });
            continue;
          }
          const audio = new Audio(url);
          refAudio.current = audio;
          if (etat !== "lecture") setEtat("lecture");
          await new Promise<void>((resolve) => {
            audio.onended = () => resolve();
            audio.onerror = () => resolve();
            audio.play().catch(() => resolve());
          });
        }
      } finally {
        if (!refAnnule.current) setEtat("repos");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.urlVoix, options.voixId, options.entetes, options.langue, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return { etat, lire, stop };
}

/** Lit une liste de phrases via Web Speech API, enchaînement `onend`. */
function lireNative(
  phrases: string[],
  langue: string | undefined,
  onFini: () => void,
) {
  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    typeof window.SpeechSynthesisUtterance === "undefined"
  ) {
    onFini();
    return;
  }
  window.speechSynthesis.cancel();
  let i = 0;
  function dire() {
    if (i >= phrases.length) {
      onFini();
      return;
    }
    const u = new SpeechSynthesisUtterance(phrases[i]);
    i += 1;
    u.lang = langue ?? "fr-FR";
    u.rate = 1.05;
    u.onend = () => dire();
    u.onerror = () => dire();
    window.speechSynthesis.speak(u);
  }
  dire();
}
