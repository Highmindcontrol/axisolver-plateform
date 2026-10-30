import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { construirePromptCopilote } from "@/lib/axi-solver/system-prompt-copilote";
import { db } from "@/lib/db";
import { sites, users } from "@/lib/db/schema";
import {
  appendMessages,
  chargerOuCreerFil,
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
  const messagesClaude = [
    ...historiqueBase.map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as
        | "user"
        | "assistant",
      content: m.contenu,
    })),
    { role: "user" as const, content: dernierVisiteur.contenu },
  ];

  const anthropic = new Anthropic({ apiKey: cle });

  try {
    const reponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system:
        fil.memoireLongue
          ? `${systemPrompt}\n\n## Mémoire longue (synthèses d'anciennes conversations)\n\n${fil.memoireLongue}`
          : systemPrompt,
      messages: messagesClaude,
    });

    const bloc = reponse.content.find((b) => b.type === "text");
    const contenu =
      bloc && bloc.type === "text" ? bloc.text : "Désolé, pas de réponse.";

    // Persistance de la réponse d'AXI
    await appendMessages(fil.id, [
      {
        role: "assistant",
        contenu,
        tokensInput: reponse.usage.input_tokens,
        tokensOutput: reponse.usage.output_tokens,
      },
    ]);

    return NextResponse.json({ contenu });
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
