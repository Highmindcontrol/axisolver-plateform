import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT_AXISOLVER_AUTOSELL } from "@/lib/axi-solver/system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * POST /api/chat
 *
 * Streaming SSE endpoint pour la conversation avec AxiSolver sur
 * axisolver.app (mode auto-vendeur).
 *
 * Body attendu : { messages: ClientMessage[] }
 * - Les messages n'incluent PAS le system prompt ni le premier message
 *   d'accueil (ajoutés côté serveur).
 * - On passe à Claude l'historique complet pour conserver le fil.
 *
 * Si ANTHROPIC_API_KEY n'est pas configuré, l'endpoint renvoie une
 * réponse de secours expliquant la situation (pas de 500) pour que
 * le widget reste fonctionnel pendant la configuration Vercel.
 */
export async function POST(request: Request) {
  const cle = process.env.ANTHROPIC_API_KEY;

  // Fallback propre si pas de clé configurée (Phase 1 vers Phase 2)
  if (!cle) {
    return new Response(
      stringToSSEStream(
        "AxiSolver sera branché en direct dès que la clé Claude sera posée côté serveur. En attendant, pour composer votre équipe AXI et souscrire, direction axihub.live — AXI vous y attend en live.",
      ),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      },
    );
  }

  let body: { messages: ClientMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ erreur: "JSON invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) {
    return new Response(
      JSON.stringify({ erreur: "Aucun message fourni" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const client = new Anthropic({ apiKey: cle });

  // Encoder le flux Claude en SSE pour le client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: SYSTEM_PROMPT_AXISOLVER_AUTOSELL,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = `data: ${JSON.stringify({ delta: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur Claude";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ erreur: message })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

/** Encode un simple message statique au format SSE (fallback sans clé). */
function stringToSSEStream(texte: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ delta: texte })}\n\n`),
      );
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
      );
      controller.close();
    },
  });
}
