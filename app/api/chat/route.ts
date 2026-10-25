import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT_AXISOLVER_AUTOSELL } from "@/lib/axi-solver/system-prompt";
import { TOOLS_AXISOLVER } from "@/lib/axi-solver/tools";
import {
  auditerSite,
  auditerSiteParCategorie,
} from "@/lib/axi-solver/audit-site";
import { auditerReferencement } from "@/lib/axi-solver/audit-referencement";
import {
  FORMULES,
  calculerPrix,
  conversationsEstimees,
  getFormule,
  recommanderFormule,
  tauxEffectif,
  type ProfilProspect,
  type SlugFormule,
  type TailleEquipe,
  type UsagePrincipal,
} from "@/lib/axi-solver/tarification";
import type { SlugSecteur } from "@/lib/axi-solver/secteurs";

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

          // Résolution des tool_result : certains tools ont un vrai retour
          // à injecter dans la conversation (ex: auditer_site), les autres
          // sont fire-and-forget côté UI et renvoient "OK".
          const toolUseBlocks = blocsAssistant.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          const toolResults: Anthropic.ToolResultBlockParam[] =
            await Promise.all(
              toolUseBlocks.map(async (b) => {
                // --- Audits par volet (sécurité ou SEO) --- //
                if (b.name === "auditer_securite" || b.name === "auditer_seo") {
                  const volet = b.name === "auditer_securite"
                    ? "securite"
                    : "seo";
                  try {
                    const input = b.input as { url?: string };
                    if (!input?.url) {
                      return {
                        type: "tool_result" as const,
                        tool_use_id: b.id,
                        content: "Erreur : URL manquante.",
                      };
                    }
                    const resultat = await auditerSiteParCategorie(
                      input.url,
                      volet,
                    );
                    // Trace observable des findings bruts renvoyés au LLM.
                    // Permet de recouper si Claude invente une faille ou un
                    // problème SEO qui n'est pas dans le résultat du tool.
                    console.log(
                      `[auditer_${volet}] url=${resultat.url} hostname=${resultat.hostname} findings=${JSON.stringify(
                        resultat.findings.map((f) => ({
                          titre: f.titre,
                          severite: f.severite,
                          detail: f.detail?.slice(0, 160),
                        })),
                      )}`,
                    );
                    emit({
                      type: "audit_termine",
                      url: resultat.url,
                      hostname: resultat.hostname,
                      volet,
                      findings: resultat.findings,
                      technologies: resultat.technologies,
                    });
                    return {
                      type: "tool_result" as const,
                      tool_use_id: b.id,
                      content: resultat.resumePourClaude,
                    };
                  } catch (err) {
                    const msg =
                      err instanceof Error ? err.message : "audit échoué";
                    return {
                      type: "tool_result" as const,
                      tool_use_id: b.id,
                      content: `Audit non réalisable (${msg}). Continue sans ces infos.`,
                    };
                  }
                }

                // --- Audit référencement externe (Serper/Google) --- //
                if (b.name === "auditer_referencement") {
                  try {
                    const input = b.input as {
                      url?: string;
                      mots_cles?: string[];
                    };
                    if (!input?.url) {
                      return {
                        type: "tool_result" as const,
                        tool_use_id: b.id,
                        content: "Erreur : URL manquante.",
                      };
                    }
                    const resultat = await auditerReferencement(
                      input.url,
                      input.mots_cles,
                    );
                    // Trace observable des positions ET des concurrents
                    // renvoyés à Claude, pour recouper côté logs si Claude
                    // invente ou enjolive dans sa réponse texte au visiteur.
                    console.log(
                      `[audit_referencement] url=${resultat.url} hostname=${resultat.hostname} mots_cles=${JSON.stringify(
                        input.mots_cles ?? [],
                      )} positions=${JSON.stringify(
                        resultat.findings.map((f) => ({
                          requete: f.requete,
                          position: f.position,
                          concurrents: f.concurrents.map((c) => c.url),
                        })),
                      )}`,
                    );
                    emit({
                      type: "audit_termine",
                      url: resultat.url,
                      hostname: resultat.hostname,
                      volet: "referencement",
                      findingsReferencement: resultat.findings,
                    });
                    return {
                      type: "tool_result" as const,
                      tool_use_id: b.id,
                      content: resultat.resumePourClaude,
                    };
                  } catch (err) {
                    const msg =
                      err instanceof Error ? err.message : "audit échoué";
                    return {
                      type: "tool_result" as const,
                      tool_use_id: b.id,
                      content: `Audit référencement non réalisable (${msg}). Continue sans ces infos.`,
                    };
                  }
                }

                // --- Legacy : auditer_site (tout en un) --- //
                if (b.name === "auditer_site") {
                  try {
                    const input = b.input as { url?: string };
                    if (!input?.url) {
                      return {
                        type: "tool_result" as const,
                        tool_use_id: b.id,
                        content: "Erreur : URL manquante.",
                      };
                    }
                    const resultat = await auditerSite(input.url);
                    emit({
                      type: "audit_termine",
                      url: resultat.url,
                      hostname: resultat.hostname,
                      findings: resultat.findings,
                      technologies: resultat.technologies,
                    });
                    return {
                      type: "tool_result" as const,
                      tool_use_id: b.id,
                      content: resultat.resumePourClaude,
                    };
                  } catch (err) {
                    const msg =
                      err instanceof Error ? err.message : "audit échoué";
                    return {
                      type: "tool_result" as const,
                      tool_use_id: b.id,
                      content: `Audit non réalisable (${msg}). Continue sans ces infos.`,
                    };
                  }
                }

                // --- Estimation tarifaire officielle --- //
                if (b.name === "estimer_tarif_axisolver") {
                  const input = b.input as {
                    visiteursMois?: number;
                    secteurSlug?: string;
                    usagePrincipal?: string;
                    tailleEquipe?: string;
                  };
                  const visiteurs = Number(input.visiteursMois ?? 0);
                  if (
                    !visiteurs ||
                    !input.secteurSlug ||
                    !input.usagePrincipal ||
                    !input.tailleEquipe
                  ) {
                    return {
                      type: "tool_result" as const,
                      tool_use_id: b.id,
                      content:
                        "Paramètres incomplets. Repose les questions manquantes avant de rappeler le tool.",
                    };
                  }
                  const profil: ProfilProspect = {
                    aSite: true,
                    visiteursMois: visiteurs,
                    secteurSlug: input.secteurSlug as SlugSecteur,
                    usagePrincipal: input.usagePrincipal as UsagePrincipal,
                    tailleEquipe: input.tailleEquipe as TailleEquipe,
                  };
                  const taux = tauxEffectif(
                    profil.secteurSlug,
                    profil.usagePrincipal,
                  );
                  const conv = conversationsEstimees(
                    profil.visiteursMois,
                    taux,
                  );
                  const prix = Object.fromEntries(
                    FORMULES.map((f) => [
                      f.slug,
                      calculerPrix(f, profil.visiteursMois, taux),
                    ]),
                  ) as Record<SlugFormule, number>;
                  const recommandeeSlug = recommanderFormule(profil);
                  const recommandee = getFormule(recommandeeSlug);

                  emit({
                    type: "tool_use",
                    tool: "estimer_tarif_axisolver",
                    id: b.id,
                    input: {
                      ...profil,
                      formuleRecommandee: recommandeeSlug,
                      prixTextOnly: prix.text,
                      prixClassique: prix.classique,
                      prixPremium: prix.premium,
                      tauxEffectif: taux,
                      conversationsMois: conv,
                    },
                  });

                  return {
                    type: "tool_result" as const,
                    tool_use_id: b.id,
                    content: `Estimation calculée. Formule recommandée : ${recommandee.nom} à ${prix[recommandeeSlug]} € HT / mois pour ${profil.visiteursMois} visiteurs mensuels (taux retenu ${taux}%, ~${conv} conversations/mois). Autres formules : Text Only ${prix.text} €, Classique ${prix.classique} €, Premium ${prix.premium} €. Annonce vocalement UNIQUEMENT la formule recommandée + son prix. Le visiteur voit le détail dans le panneau à gauche.`,
                  };
                }

                return {
                  type: "tool_result" as const,
                  tool_use_id: b.id,
                  content: "OK",
                };
              }),
            );

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
