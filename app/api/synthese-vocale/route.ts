export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/synthese-vocale
 *
 * Synthèse vocale française avec cascade de providers (28 oct 2026) :
 *   1. ElevenLabs (voix ultra-réaliste, formule Premium AxiSolver)
 *   2. Azure AI Speech (voix neurales françaises, fallback)
 *   3. OpenAI TTS (fallback ultime)
 *
 * Body attendu : { texte: string, voix?: string }
 *
 * Variables d'environnement :
 *   - ELEVENLABS_API_KEY     : clé API ElevenLabs
 *   - ELEVENLABS_VOICE_ID    : identifiant de la voix (ex: 21m00Tcm4TlvDq8ikWAM)
 *   - ELEVENLABS_MODEL_ID    : modèle TTS (défaut: eleven_multilingual_v2)
 *   - AZURE_SPEECH_KEY       : clé Azure Speech (fallback)
 *   - AZURE_SPEECH_REGION    : région Azure (fallback)
 *   - OPENAI_API_KEY         : clé OpenAI (fallback ultime)
 */

export async function POST(request: Request) {
  let body: { texte?: string; voix?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ erreur: "JSON invalide" }, { status: 400 });
  }

  const texteOriginal = body?.texte;
  if (!texteOriginal || typeof texteOriginal !== "string") {
    return Response.json({ erreur: "Texte manquant" }, { status: 400 });
  }

  const texteNettoye = nettoyerPourVocal(texteOriginal);
  if (!texteNettoye.trim()) {
    return Response.json(
      { erreur: "Texte vide après nettoyage" },
      { status: 400 },
    );
  }

  // Doctrine AxiHub (21 oct 2026) : UNE SEULE voix pour tout
  // l'écosystème AXI, pilotée par la variable d'environnement
  // `AXI_VOICE` partagée avec axihub.live. Fallback technique si
  // la var n'est pas posée côté Vercel.
  const VOIX_PAR_DEFAUT =
    process.env.AXI_VOICE ?? "fr-FR-HenriNeural";
  // Si l'appelant envoie directement un nom de voix Azure
  // (fr-FR-*Neural), on la respecte ; sinon on utilise la voix
  // doctrine AXI. Toute voix OpenAI historique (onyx/echo/…) est
  // ignorée au profit de la voix unique de l'écosystème.
  const voixDemandee = body?.voix;
  const voixAzure =
    voixDemandee && voixDemandee.startsWith("fr-FR-")
      ? voixDemandee
      : VOIX_PAR_DEFAUT;

  // === Priorité 1 : ElevenLabs === //
  const cleElevenLabs = process.env.ELEVENLABS_API_KEY;
  const voixElevenLabs = process.env.ELEVENLABS_VOICE_ID;
  if (cleElevenLabs && voixElevenLabs) {
    try {
      const modeleElevenLabs =
        process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voixElevenLabs)}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": cleElevenLabs,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: texteNettoye,
            model_id: modeleElevenLabs,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        },
      );

      if (res.ok && res.body) {
        return new Response(res.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-cache, no-store",
          },
        });
      }

      const detail = await res.text();
      console.warn(
        `[synthese-vocale] ElevenLabs a échoué (${res.status}) : ${detail.slice(0, 200)}`,
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : "fetch ElevenLabs échoué";
      console.warn(`[synthese-vocale] ElevenLabs exception : ${detail}`);
    }
  }

  // === Priorité 2 : Azure TTS (voix françaises natives) === //
  const cleAzure = process.env.AZURE_SPEECH_KEY;
  const regionAzure = process.env.AZURE_SPEECH_REGION;

  if (cleAzure && regionAzure) {
    try {
      const ssml = construireSSML(texteNettoye, voixAzure);
      const url = `https://${regionAzure}.tts.speech.microsoft.com/cognitiveservices/v1`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": cleAzure,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
          "User-Agent": "axisolver",
        },
        body: ssml,
      });

      if (res.ok && res.body) {
        return new Response(res.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-cache, no-store",
          },
        });
      }

      const detail = await res.text();
      console.warn(
        `[synthese-vocale] Azure TTS a échoué (${res.status}) : ${detail.slice(0, 200)}`,
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : "fetch Azure échoué";
      console.warn(`[synthese-vocale] Azure TTS exception : ${detail}`);
    }
  }

  // === Fallback OpenAI TTS === //
  return fallbackOpenAI(texteNettoye, voixDemandee ?? "onyx");
}

/**
 * Construit le SSML pour Azure TTS avec la voix française demandée.
 * On ajoute une légère accélération (rate=+8%) pour un rythme vif
 * cohérent avec le style AxiSolver.
 */
function construireSSML(texte: string, voix: string): string {
  // Échappement XML des caractères spéciaux
  const texteEchappe = texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  return `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xml:lang="fr-FR" xmlns="http://www.w3.org/2001/10/synthesis">
  <voice name="${voix}">
    <prosody rate="+8%">${texteEchappe}</prosody>
  </voice>
</speak>`;
}

/**
 * Fallback vers OpenAI TTS si Azure n'est pas disponible.
 */
async function fallbackOpenAI(
  texte: string,
  voix: string,
): Promise<Response> {
  const cleOpenAI = process.env.OPENAI_API_KEY;
  if (!cleOpenAI) {
    return Response.json(
      {
        erreur:
          "Ni Azure Speech ni OpenAI TTS ne sont configurés côté serveur.",
      },
      { status: 500 },
    );
  }

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: cleOpenAI });
    const voixOpenAI = (
      ["nova", "shimmer", "alloy", "echo", "fable", "onyx"].includes(voix)
        ? voix
        : "onyx"
    ) as "nova" | "shimmer" | "alloy" | "echo" | "fable" | "onyx";

    const audio = await openai.audio.speech.create({
      model: "tts-1",
      voice: voixOpenAI,
      input: texte,
      response_format: "mp3",
      speed: 1.05,
    });

    return new Response(audio.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : "fallback OpenAI échoué";
    console.error(`[synthese-vocale] fallback OpenAI : ${detail}`);
    return Response.json(
      { erreur: `TTS indisponible (${detail})` },
      { status: 500 },
    );
  }
}

/**
 * Supprime les artefacts qui gêneraient la lecture vocale :
 * emojis, markdown (gras / italique / listes), caractères spéciaux.
 */
function nettoyerPourVocal(texte: string): string {
  return (
    texte
      // eslint-disable-next-line no-misleading-character-class
      .replace(
        /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1F0FF}\u{1F100}-\u{1F2FF}]/gu,
        "",
      )
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      // Filet de sécurité : astérisques résiduels (markdown mal formé,
      // ** orphelin, séquences ***, puces, etc.) → ne doivent JAMAIS
      // atteindre Azure TTS qui les prononcerait « astérisque ».
      .replace(/\*/g, "")
      // Abréviations pénibles à l'oral — Azure prononce « 24/7 »
      // comme « 24 juillet ». On déplie en toutes lettres.
      .replace(/\b24\s*\/\s*7\b/g, "24 heures sur 24 et 7 jours sur 7")
      .replace(/\b7\s*\/\s*7\b/g, "7 jours sur 7")
      .replace(/^[-—•]\s+/gm, "")
      .replace(/«\s?/g, "")
      .replace(/\s?»/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Supprime la virgule avant un mot capitalisé probablement prénom
      // (évite la pause synthétique artificielle avant 'François', 'Lucien', etc.)
      // Pattern : espace + virgule + espace + Majuscule → espace + Majuscule
      .replace(/\s*,\s+([A-ZÉÈÀÇÎÔÛÄÖÜŒÆ][a-zéèàçîôûäöüœæ]+)/g, " $1")
      .replace(/\s+/g, " ")
      .trim()
  );
}
