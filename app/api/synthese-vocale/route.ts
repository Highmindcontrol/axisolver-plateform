import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/synthese-vocale
 *
 * Reçoit un texte à vocaliser et retourne un flux audio MP3
 * via OpenAI TTS (modèle tts-1, voix "nova" par défaut).
 *
 * Body attendu : { texte: string, voix?: "nova" | "shimmer" | "alloy" | "echo" | "fable" | "onyx" }
 *
 * Les emojis et caractères non-prononçables sont nettoyés avant
 * envoi pour éviter que la voix énonce « emoji sourire » ou autre
 * artefact gênant.
 */
export async function POST(request: Request) {
  const cle = process.env.OPENAI_API_KEY;
  if (!cle) {
    return Response.json(
      { erreur: "OPENAI_API_KEY manquante côté serveur" },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as {
      texte?: string;
      voix?: string;
    };
    const texteOriginal = body?.texte;
    if (!texteOriginal || typeof texteOriginal !== "string") {
      return Response.json({ erreur: "Texte manquant" }, { status: 400 });
    }

    // Nettoyage pré-TTS : retirer emojis + markdown lourd
    const texteNettoye = nettoyerPourVocal(texteOriginal);
    if (!texteNettoye.trim()) {
      return Response.json({ erreur: "Texte vide après nettoyage" }, { status: 400 });
    }

    const voix = (body?.voix ?? "nova") as
      | "nova"
      | "shimmer"
      | "alloy"
      | "echo"
      | "fable"
      | "onyx";

    const openai = new OpenAI({ apiKey: cle });
    // Modèle gpt-4o-mini-tts : nouvelle génération, 3-4× plus rapide
    // que tts-1 avec une qualité égale ou supérieure, et vrai streaming
    // des chunks dès les premières millisecondes.
    const audio = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voix,
      input: texteNettoye,
      response_format: "mp3",
      speed: 1.05,
    });

    // Le SDK retourne un ReadableStream — on le relaie tel quel
    return new Response(audio.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "erreur TTS";
    return Response.json({ erreur: message }, { status: 500 });
  }
}

/**
 * Supprime les artefacts qui gêneraient la lecture vocale :
 * emojis, markdown (gras / italique / listes), caractères spéciaux.
 */
function nettoyerPourVocal(texte: string): string {
  return (
    texte
      // Emojis courants (gamme Unicode émojis)
      // eslint-disable-next-line no-misleading-character-class
      .replace(
        /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1F0FF}\u{1F100}-\u{1F2FF}]/gu,
        "",
      )
      // Markdown gras ** et italique *
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      // Puces de liste
      .replace(/^[-—•]\s+/gm, "")
      // Guillemets français qui bugent parfois
      .replace(/«\s?/g, "")
      .replace(/\s?»/g, "")
      // Codes markdown inline
      .replace(/`([^`]+)`/g, "$1")
      // Liens markdown [texte](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Nettoyage espaces multiples
      .replace(/\s+/g, " ")
      .trim()
  );
}
