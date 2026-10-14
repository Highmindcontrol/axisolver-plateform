import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/transcrire
 *
 * Reçoit un blob audio (webm, mp3, m4a…) en multipart/form-data
 * sous la clé "audio", et retourne la transcription texte via
 * OpenAI Whisper en français.
 *
 * Format de réponse : { texte: string }
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
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || typeof audio === "string") {
      return Response.json(
        { erreur: "Fichier audio manquant" },
        { status: 400 },
      );
    }

    // OpenAI SDK accepte directement un File / Blob (web standard)
    const openai = new OpenAI({ apiKey: cle });
    const transcription = await openai.audio.transcriptions.create({
      file: audio as unknown as Parameters<
        typeof openai.audio.transcriptions.create
      >[0]["file"],
      model: "whisper-1",
      language: "fr",
      // Prompt court pour aider Whisper à mieux reconnaître le vocabulaire
      // spécifique AxiSolver / Ataraxis en français
      prompt:
        "AxiSolver, Ataraxis, AXI Hub, Ataraxis Bridge, SEO, chatbot, site web, audit, sécurité.",
    });

    return Response.json({ texte: transcription.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "erreur Whisper";
    return Response.json({ erreur: message }, { status: 500 });
  }
}
