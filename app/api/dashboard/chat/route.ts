import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import {
  COPILOTE_TOOLS,
  executerTool,
  type OrdreTool,
} from "@/lib/axi-solver/copilote-tools";
import { construirePromptCopilote } from "@/lib/axi-solver/system-prompt-copilote";
import { enArrierePlan } from "@/lib/background";
import { db } from "@/lib/db";
import { sites, users } from "@/lib/db/schema";
import {
  condenserFil,
  peutDeclencherCondensation,
} from "@/lib/services/copilote-condensation";
import {
  appendMessages,
  chargerOuCreerFil,
  chercherMessagesPertinents,
  compterMessages,
  lireFilParId,
  lireMessagesContexte,
} from "@/lib/services/copilote-memoire";
import { genererTitreSiPertinent } from "@/lib/services/copilote-titre";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type MessagePack = {
  role: "visiteur" | "axi" | "systeme";
  contenu: string;
};

type EventStream =
  | { type: "speech_delta"; text: string }
  | { type: "ordre"; ordre: OrdreClient }
  | { type: "done"; contenu: string; ordres: OrdreClient[] }
  | { type: "error"; message: string };

type OrdreClient = {
  id: string;
  libelle: string;
  statut: "termine" | "echoue" | "en_cours";
  horodatage: string;
  resume?: string;
};

/**
 * POST /api/dashboard/chat
 *
 * Streaming NDJSON du copilote AXI (admin AxiSolver). Pattern repris
 * de AxiHub `/api/axihub/turn-stream` :
 *   - une ligne JSON par événement (séparateur `\n`)
 *   - TTFB ~500ms au lieu de 5-10s en non-streaming
 *   - permet au client d'afficher le texte progressivement ET de
 *     déclencher le TTS phrase par phrase sans attendre la fin
 *
 * Événements :
 *   - speech_delta : chunk de texte émis par Claude (à afficher + TTS)
 *   - ordre        : tool exécuté (alimente l'ailette d'ordres)
 *   - done         : fin, contenu complet + liste finale des ordres
 *   - error        : erreur fatale, message convivial pour l'UI
 *
 * Préserve TOUTE la logique précédente : mémoire persistante
 * fallback-safe, RAG, X-Axi-Fil-Id, boucle agentic 5 itérations,
 * condensation en arrière-plan, génération auto titre.
 */
export async function POST(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (evt: EventStream) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(evt) + "\n"));
        } catch {
          // Flux déjà fermé — ignoré.
        }
      };

      try {
        await traiterChatStream(req, emit);
      } catch (e) {
        const detail =
          e instanceof Error
            ? `${e.name}: ${e.message}\n${e.stack ?? ""}`
            : String(e);
        console.error("[dashboard/chat] erreur fatale\n", detail);
        emit({
          type: "error",
          message:
            "AXI est momentanément indisponible. Réessaie dans un instant — je garde la mémoire de notre échange.",
        });
      } finally {
        try {
          controller.close();
        } catch {
          // ignoré
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function traiterChatStream(
  req: Request,
  emit: (evt: EventStream) => void,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    emit({ type: "error", message: "Non authentifié." });
    return;
  }

  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) {
    emit({
      type: "error",
      message:
        "AXI copilote est momentanément indisponible — la clé Claude n'est pas configurée côté serveur.",
    });
    return;
  }

  type BodyRecu = {
    messages?: MessagePack[];
    contexte?: { siteId?: string };
    siteId?: string;
  };
  let body: BodyRecu | null = null;
  try {
    body = (await req.json()) as BodyRecu;
  } catch {
    emit({ type: "error", message: "Requête invalide." });
    return;
  }

  const messages = Array.isArray(body?.messages) ? body!.messages : [];
  const slugSiteCourant =
    (typeof body?.siteId === "string" && body.siteId.length > 0
      ? body.siteId
      : null) ??
    (typeof body?.contexte?.siteId === "string" && body.contexte.siteId.length > 0
      ? body.contexte.siteId
      : null);

  const dernierVisiteur = [...messages]
    .reverse()
    .find((m) => m.role === "visiteur");
  if (!dernierVisiteur) {
    emit({
      type: "done",
      contenu: "Je n'ai pas reçu de message. Dis-moi ce qui t'intéresse.",
      ordres: [],
    });
    return;
  }

  // Prénom + site courant — tolérants aux erreurs DB
  let prenom: string | null = null;
  try {
    const [profilRow] = await db
      .select({ nomAffiche: users.nomAffiche })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    prenom =
      profilRow?.nomAffiche?.split(" ")[0] ??
      user.user_metadata?.first_name ??
      null;
  } catch (e) {
    console.warn("[dashboard/chat] lecture users échouée", e);
    prenom = user.user_metadata?.first_name ?? null;
  }

  let siteCourant:
    | { slug: string; nomEntreprise: string; domainePrincipal: string }
    | undefined;
  if (slugSiteCourant) {
    try {
      const [row] = await db
        .select({
          slug: sites.slug,
          nomEntreprise: sites.nomEntreprise,
          nomSite: sites.nomSite,
          domainePrincipal: sites.domainePrincipal,
        })
        .from(sites)
        .where(eq(sites.slug, slugSiteCourant))
        .limit(1);
      if (row) {
        siteCourant = {
          slug: row.slug,
          nomEntreprise: row.nomSite ?? row.nomEntreprise,
          domainePrincipal: row.domainePrincipal,
        };
      }
    } catch (e) {
      console.warn("[dashboard/chat] lecture sites échouée", e);
    }
  }

  // Mémoire persistante — fallback-safe
  let fil: { id: string; memoireLongue: string | null } | null = null;
  let historiqueBase: Array<{
    role: "user" | "assistant" | "system";
    contenu: string;
  }> = [];
  let messagesPertinents: Array<{
    role: "user" | "assistant" | "system";
    contenu: string;
    creeLe: Date;
    similarite: number;
  }> = [];

  const filIdForce = req.headers.get("x-axi-fil-id")?.trim() || null;

  try {
    if (filIdForce) {
      const trouve = await lireFilParId(filIdForce, user.id);
      fil = trouve ?? (await chargerOuCreerFil(user.id, slugSiteCourant));
    } else {
      fil = await chargerOuCreerFil(user.id, slugSiteCourant);
    }
    historiqueBase = await lireMessagesContexte(fil.id);
  } catch (e) {
    console.error(
      "[dashboard/chat] mémoire indisponible — fallback sans mémoire",
      e,
    );
  }

  if (fil) {
    try {
      messagesPertinents = await chercherMessagesPertinents({
        userId: user.id,
        conversationId: fil.id,
        requete: dernierVisiteur.contenu,
        limite: 5,
        seuilSimilarite: 0.65,
      });
    } catch (e) {
      console.warn("[dashboard/chat] RAG indisponible", e);
    }

    try {
      await appendMessages(fil.id, [
        { role: "user", contenu: dernierVisiteur.contenu },
      ]);
    } catch (e) {
      console.warn("[dashboard/chat] persistance message user échouée", e);
    }
  }

  const systemPrompt = construirePromptCopilote(
    { prenomUtilisateur: prenom, sites: [] },
    siteCourant,
  );

  const preambuleRag =
    messagesPertinents.length > 0
      ? `\n\n## Messages pertinents repêchés depuis l'historique\n\nTu as repéré ces échanges passés qui touchent au sujet actuel. Utilise-les si c'est utile, cite-les naturellement sans dire « j'ai cherché » :\n\n${messagesPertinents
          .map(
            (m) =>
              `[${m.creeLe.toISOString().slice(0, 10)}] ${
                m.role === "user" ? "ADMIN" : "AXI"
              } : ${m.contenu.slice(0, 500)}`,
          )
          .join("\n\n")}`
      : "";

  const messagesClaude: Anthropic.Messages.MessageParam[] = [
    ...historiqueBase.map(
      (m) =>
        ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.contenu,
        }) as Anthropic.Messages.MessageParam,
    ),
    { role: "user", content: dernierVisiteur.contenu },
  ];

  const anthropic = new Anthropic({ apiKey: cle });
  const systemFinal =
    (fil?.memoireLongue
      ? `${systemPrompt}\n\n## Mémoire longue (synthèse des anciennes conversations)\n\n${fil.memoireLongue}`
      : systemPrompt) + preambuleRag;

  // Boucle agentic streaming : à chaque itération on ouvre un stream
  // Claude, on émet les deltas de texte au client en live, puis on
  // récupère la réponse finale pour inspecter les éventuels tool_use.
  const ordresPris: OrdreTool[] = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let contenuFinal = "Désolé, pas de réponse.";

  for (let iter = 0; iter < 5; iter++) {
    const streamClaude = anthropic.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: systemFinal,
      tools: COPILOTE_TOOLS,
      messages: messagesClaude,
    });

    // Relaie chaque delta de texte au client au fur et à mesure.
    // Les deltas de tool_use (input_json_delta) ne sont pas émis au
    // TTS — ils seront exposés comme ordres après exécution.
    for await (const event of streamClaude) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta" &&
        event.delta.text
      ) {
        emit({ type: "speech_delta", text: event.delta.text });
      }
    }

    const reponse = await streamClaude.finalMessage();
    totalTokensIn += reponse.usage.input_tokens;
    totalTokensOut += reponse.usage.output_tokens;

    const toolUses = reponse.content.filter(
      (b) => b.type === "tool_use",
    ) as Anthropic.Messages.ToolUseBlock[];
    const texteBlocs = reponse.content.filter(
      (b) => b.type === "text",
    ) as Anthropic.Messages.TextBlock[];

    messagesClaude.push({ role: "assistant", content: reponse.content });

    if (toolUses.length === 0 || reponse.stop_reason === "end_turn") {
      contenuFinal =
        texteBlocs.map((b) => b.text).join("\n").trim() || contenuFinal;
      break;
    }

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const t of toolUses) {
      const { resultat, ordre } = await executerTool(
        t.name,
        (t.input as Record<string, unknown>) ?? {},
        { userId: user.id },
      );
      ordresPris.push(ordre);
      emit({
        type: "ordre",
        ordre: ordreVersClient(ordre),
      });
      toolResults.push({
        type: "tool_result",
        tool_use_id: t.id,
        content: resultat,
        is_error: ordre.statut === "echoue",
      });
    }
    messagesClaude.push({ role: "user", content: toolResults });

    if (texteBlocs.length > 0) {
      contenuFinal = texteBlocs.map((b) => b.text).join("\n").trim();
    }
  }

  // Persistance de la réponse finale + arrière-plan (titre + condensation)
  if (fil) {
    try {
      await appendMessages(fil.id, [
        {
          role: "assistant",
          contenu: contenuFinal,
          tokensInput: totalTokensIn,
          tokensOutput: totalTokensOut,
        },
      ]);
    } catch (e) {
      console.warn("[dashboard/chat] persistance réponse AXI échouée", e);
    }

    try {
      if (await peutDeclencherCondensation(fil.id)) {
        enArrierePlan(
          condenserFil(fil.id).catch((e) =>
            console.error("[copilote-condensation] échouée", e),
          ),
        );
      }
    } catch (e) {
      console.warn("[dashboard/chat] test condensation échoué", e);
    }

    try {
      const n = await compterMessages(fil.id);
      if (n >= 6) {
        const filId = fil.id;
        enArrierePlan(
          genererTitreSiPertinent(filId, user.id).catch((e) =>
            console.warn("[copilote-titre] génération échouée", e),
          ),
        );
      }
    } catch (e) {
      console.warn("[dashboard/chat] test génération titre échoué", e);
    }
  }

  emit({
    type: "done",
    contenu: contenuFinal,
    ordres: ordresPris.map(ordreVersClient),
  });
}

function ordreVersClient(o: OrdreTool): OrdreClient {
  return {
    id: o.id,
    libelle: o.libelle,
    statut:
      o.statut === "termine"
        ? "termine"
        : o.statut === "echoue"
          ? "echoue"
          : "en_cours",
    horodatage: o.horodatage.toISOString(),
    resume: o.resume ?? undefined,
  };
}

// Garde-fou TypeScript : NextResponse n'est plus utilisé mais on garde
// l'import pour cohérence des types (import "server-only" implicite).
void NextResponse;
