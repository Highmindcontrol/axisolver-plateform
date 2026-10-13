import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT_AXISOLVER_AUTOSELL } from "@/lib/axi-solver/system-prompt";
import { TOOLS_AXISOLVER } from "@/lib/axi-solver/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * POST /api/chat
 *
 * Streaming SSE pour la conversation AxiSolver avec tool calling natif.
 *
 * Format du stream SSE côté client :
 *   data: {"type":"text_delta","delta":"..."}       → chunk texte
 *   data: {"type":"tool_use","tool":"...","input":{...}} → outil appelé
 *   data: {"type":"done"}                           → fin de réponse
 *   data: {"type":"erreur","message":"..."}         → échec
 *
 * Boucle agentic : si Claude déclenche un ou plusieurs tool_use, on lui
 * renvoie automatiquement des tool_result « OK » et on relance une
 * itération pour qu'il continue de parler (jusqu'à stop_reason=end_turn).
 */
export async function POST(request: Request) {
  const cle = process.env.ANTHROPIC_API_KEY;

  if (!cle) {
    return new Response(
      sseStreamStatique(
        "AxiSolver sera branché en direct dès que la clé Claude sera posée côté serveur. En attendant, pour composer votre équipe AXI et souscrire, direction axihub.live — AXI vous y attend en live.",
      ),
      sseHeaders(),
    );
  }

  let body: { messages: ClientMessage[] };
  try {
    body = await request.json();
  } catch {
    return jsonErreur("JSON invalide", 400);
  }

  const messagesInitiaux = Array.isArray(body?.messages) ? body.messages : [];
  if (messagesInitiaux.length === 0) {
    return jsonErreur("Aucun message fourni", 400);
  }

  const client = new Anthropic({ apiKey: cle });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (payload: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      // Historique au format Anthropic (évolue à chaque tour)
      const messagesAnthropic: Anthropic.MessageParam[] = messagesInitiaux.map(
        (m) => ({ role: m.role, content: m.content }),
      );

      try {
        // Boucle agentic : chaque itération peut déclencher des tool_use.
        // On s'arrête quand Claude termine (stop_reason=end_turn ou max_turns).
        const MAX_TOURS = 5;
        let tour = 0;

        while (tour < MAX_TOURS) {
          tour++;

          // Collecte des blocs de la réponse Claude pour ce tour
          const blocsAssistant: Anthropic.ContentBlock[] = [];
          let stopReason: string | null = null;

          const claudeStream = client.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: SYSTEM_PROMPT_AXISOLVER_AUTOSELL,
            tools: TOOLS_AXISOLVER,
            messages: messagesAnthropic,
          });

          // Buffer des tool_use en cours de streaming (input JSON progressif)
          const toolsEnCours: Record<
            number,
            { id: string; name: string; inputBrut: string }
          > = {};

          for await (const event of claudeStream) {
            if (event.type === "content_block_start") {
              const bloc = event.content_block;
              if (bloc.type === "tool_use") {
                toolsEnCours[event.index] = {
                  id: bloc.id,
                  name: bloc.name,
                  inputBrut: "",
                };
              }
            }

            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                emit({ type: "text_delta", delta: event.delta.text });
              }
              if (event.delta.type === "input_json_delta") {
                const existing = toolsEnCours[event.index];
                if (existing) {
                  existing.inputBrut += event.delta.partial_json;
                }
              }
            }

            if (event.type === "content_block_stop") {
              const toolEnCours = toolsEnCours[event.index];
              if (toolEnCours) {
                let input: Record<string, unknown> = {};
                try {
                  input = toolEnCours.inputBrut
                    ? (JSON.parse(toolEnCours.inputBrut) as Record<string, unknown>)
                    : {};
                } catch {
                  /* input incomplet : on envoie vide, le composant panneau sera résilient */
                }

                emit({
                  type: "tool_use",
                  tool: toolEnCours.name,
                  input,
                });

                delete toolsEnCours[event.index];
              }
            }

            if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason ?? stopReason;
            }
          }

          // Récupère le message final pour l'historique
          const messageFinal = await claudeStream.finalMessage();
          blocsAssistant.push(...messageFinal.content);
          stopReason = messageFinal.stop_reason ?? stopReason;

          // Ajoute la réponse assistant à l'historique
          messagesAnthropic.push({
            role: "assistant",
            content: blocsAssistant,
          });

          // Si Claude n'a pas utilisé de tool, on sort
          if (stopReason !== "tool_use") {
            break;
          }

          // Sinon on simule les tool_result (fire-and-forget côté UI)
          const toolResults: Anthropic.ToolResultBlockParam[] = blocsAssistant
            .filter(
              (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
            )
            .map((b) => ({
              type: "tool_result",
              tool_use_id: b.id,
              content: "OK",
            }));

          if (toolResults.length === 0) break;

          messagesAnthropic.push({
            role: "user",
            content: toolResults,
          });
        }

        emit({ type: "done" });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur Claude";
        emit({ type: "erreur", message });
        controller.close();
      }
    },
  });

  return new Response(stream, sseHeaders());
}

// ------------------------------------------------------------------ //
// Utilitaires                                                        //
// ------------------------------------------------------------------ //

function sseHeaders(): ResponseInit {
  return {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  };
}

function jsonErreur(message: string, status: number): Response {
  return new Response(JSON.stringify({ erreur: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Flux SSE statique (fallback sans clé Anthropic). */
function sseStreamStatique(texte: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "text_delta", delta: texte })}\n\n`,
        ),
      );
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
      );
      controller.close();
    },
  });
}
