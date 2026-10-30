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
  lireMessagesContexte,
} from "@/lib/services/copilote-memoire";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type MessagePack = {
  role: "visiteur" | "axi" | "systeme";
  contenu: string;
};

/**
 * POST /api/dashboard/chat
 *
 * Endpoint du chat copilote AXI (admin AxiSolver). Pattern mémoire
 * repris d'AxiHub : persistance granulaire message-par-message en
 * base, chargement des derniers N messages (60) à chaque appel pour
 * reconstituer le contexte Claude.
 *
 * Doctrine : AXI se souvient de TOUT depuis le premier jour, sans
 * perte. Le client envoie uniquement le NOUVEAU message visiteur ;
 * tout l'historique est reconstruit côté serveur depuis la DB.
 *
 * Payload reçu :
 *   { messages: [MessagePack], contexte?: { siteId? }, siteId? }
 *
 * Note : on prend le DERNIER message visiteur du payload comme
 * nouveau message à envoyer. Les anciens messages du payload sont
 * ignorés — c'est la DB qui fait foi.
 */
export async function POST(req: Request) {
  try {
    return await traiterChat(req);
  } catch (e) {
    console.error("[dashboard/chat] erreur fatale", e);
    return NextResponse.json(
      {
        contenu:
          "AXI est momentanément indisponible. Réessaie dans un instant — je garde la mémoire de notre échange.",
      },
      { status: 200 },
    );
  }
}

async function traiterChat(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erreur: "non_authentifie" }, { status: 401 });
  }

  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) {
    return NextResponse.json(
      {
        contenu:
          "AXI copilote est momentanément indisponible — la clé Claude n'est pas configurée côté serveur.",
      },
      { status: 200 },
    );
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
    return NextResponse.json({ erreur: "body_invalide" }, { status: 400 });
  }

  const messages = Array.isArray(body?.messages) ? body!.messages : [];
  const slugSiteCourant =
    (typeof body?.siteId === "string" && body.siteId.length > 0
      ? body.siteId
      : null) ??
    (typeof body?.contexte?.siteId === "string" && body.contexte.siteId.length > 0
      ? body.contexte.siteId
      : null);

  // On prend le DERNIER message visiteur (le nouveau à traiter)
  const dernierVisiteur = [...messages]
    .reverse()
    .find((m) => m.role === "visiteur");
  if (!dernierVisiteur) {
    return NextResponse.json({
      contenu: "Je n'ai pas reçu de message. Dis-moi ce qui t'intéresse.",
    });
  }

  // Prénom + site courant pour le system prompt
  const [profilRow] = await db
    .select({ nomAffiche: users.nomAffiche })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const prenom =
    profilRow?.nomAffiche?.split(" ")[0] ??
    user.user_metadata?.first_name ??
    null;

  let siteCourant:
    | { slug: string; nomEntreprise: string; domainePrincipal: string }
    | undefined;
  if (slugSiteCourant) {
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
  }

  // Charge ou crée le fil pour (user, siteSlug)
  const fil = await chargerOuCreerFil(user.id, slugSiteCourant);
  const historiqueBase = await lireMessagesContexte(fil.id);

  // Recherche RAG : messages pertinents dans TOUT l'historique de
  // l'utilisateur (hors fenêtre récente). Si AXI parle d'un sujet
  // évoqué il y a plusieurs mois, on le retrouve par similarité
  // sémantique et on l'injecte en préambule.
  const messagesPertinents = await chercherMessagesPertinents({
    userId: user.id,
    conversationId: fil.id,
    requete: dernierVisiteur.contenu,
    limite: 5,
    seuilSimilarite: 0.65,
  });

  // Enregistre d'abord le nouveau message user AVANT d'appeler Claude
  // (préserver la mémoire même en cas d'échec Claude)
  await appendMessages(fil.id, [
    { role: "user", contenu: dernierVisiteur.contenu },
  ]);

  // Construit le system prompt + le payload Claude
  const systemPrompt = construirePromptCopilote(
    { prenomUtilisateur: prenom, sites: [] },
    siteCourant,
  );

  // Préambule RAG : si des messages pertinents ont été repêchés dans
  // l'historique long terme (hors fenêtre récente), on les ajoute au
  // system prompt sous forme de notes contextuelles.
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

  // Historique sous forme de messages Anthropic (text content). Le
  // dernier message user est ajouté explicitement en fin.
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
    (fil.memoireLongue
      ? `${systemPrompt}\n\n## Mémoire longue (synthèse des anciennes conversations)\n\n${fil.memoireLongue}`
      : systemPrompt) + preambuleRag;

  // Boucle agentic : Claude peut appeler des tools (lire_metriques_site,
  // etc.) ; on les exécute, on relance Claude avec les tool_results.
  // Garde-fou : max 5 itérations pour éviter boucle infinie.
  const ordresPris: OrdreTool[] = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let contenuFinal = "Désolé, pas de réponse.";

  try {
    for (let iter = 0; iter < 5; iter++) {
      const reponse = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        system: systemFinal,
        tools: COPILOTE_TOOLS,
        messages: messagesClaude,
      });
      totalTokensIn += reponse.usage.input_tokens;
      totalTokensOut += reponse.usage.output_tokens;

      const toolUses = reponse.content.filter(
        (b) => b.type === "tool_use",
      ) as Anthropic.Messages.ToolUseBlock[];
      const texteBlocs = reponse.content.filter(
        (b) => b.type === "text",
      ) as Anthropic.Messages.TextBlock[];

      // Pousse la réponse assistant dans l'historique Claude
      messagesClaude.push({ role: "assistant", content: reponse.content });

      // Si pas de tool_use, c'est la réponse finale
      if (toolUses.length === 0 || reponse.stop_reason === "end_turn") {
        contenuFinal =
          texteBlocs.map((b) => b.text).join("\n").trim() || contenuFinal;
        break;
      }

      // Exécute chaque tool et prépare les tool_results
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const t of toolUses) {
        const { resultat, ordre } = await executerTool(
          t.name,
          (t.input as Record<string, unknown>) ?? {},
          { userId: user.id },
        );
        ordresPris.push(ordre);
        toolResults.push({
          type: "tool_result",
          tool_use_id: t.id,
          content: resultat,
          is_error: ordre.statut === "echoue",
        });
      }
      messagesClaude.push({ role: "user", content: toolResults });

      // Si Claude a aussi parlé en texte dans cette itération, on
      // garde ça comme réponse de secours au cas où la boucle plafonne.
      if (texteBlocs.length > 0) {
        contenuFinal = texteBlocs.map((b) => b.text).join("\n").trim();
      }
    }

    // Persistance de la réponse finale d'AXI
    await appendMessages(fil.id, [
      {
        role: "assistant",
        contenu: contenuFinal,
        tokensInput: totalTokensIn,
        tokensOutput: totalTokensOut,
      },
    ]);

    // Condensation en arrière-plan si le fil dépasse le seuil (120
    // messages). Permet de garder une mémoire longue à jour sans
    // bloquer la réponse à l'admin.
    if (await peutDeclencherCondensation(fil.id)) {
      enArrierePlan(
        condenserFil(fil.id).catch((e) =>
          console.error("[copilote-condensation] échouée", e),
        ),
      );
    }

    return NextResponse.json({
      contenu: contenuFinal,
      ordres: ordresPris.map((o) => ({
        id: o.id,
        libelle: o.libelle,
        statut: o.statut === "termine" ? "termine" : o.statut === "echoue" ? "echoue" : "en_cours",
        horodatage: o.horodatage.toISOString(),
        resume: o.resume,
      })),
    });
  } catch (e) {
    console.error("[dashboard/chat] erreur Claude", e);
    return NextResponse.json(
      {
        contenu:
          "J'ai eu un petit souci pour te répondre. Réessaie dans un instant.",
      },
      { status: 200 },
    );
  }
}
