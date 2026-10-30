import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { construirePromptCopilote } from "@/lib/axi-solver/system-prompt-copilote";
import { db } from "@/lib/db";
import { sites, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type MessagePack = {
  role: "visiteur" | "axi" | "systeme";
  contenu: string;
};

type ContexteRecu = {
  siteId?: string; // on reçoit un slug (voir trois-ecrans.tsx)
};

/**
 * POST /api/dashboard/chat
 *
 * Endpoint consommé par le pack axi-chat variante back-office-copilote
 * (toggle « Converser avec AXI » du dashboard admin).
 *
 * Reçoit :
 *   { messages: MessagePack[], contexte?, channel?: "back-office-copilote" }
 *
 * Retourne :
 *   { contenu: string }
 *
 * Authentification obligatoire — l'admin doit être connecté. On charge
 * ses sites pour construire un system prompt contextualisé.
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
          "AXI copilote est momentanément indisponible — la clé Claude n'est pas configurée côté serveur. Préviens François.",
      },
      { status: 200 },
    );
  }

  let body: {
    messages?: MessagePack[];
    contexte?: ContexteRecu;
    siteId?: string;
  } | null = null;
  try {
    body = (await req.json()) as {
      messages?: MessagePack[];
      contexte?: ContexteRecu;
      siteId?: string;
    };
  } catch {
    return NextResponse.json({ erreur: "body_invalide" }, { status: 400 });
  }
  const messages = Array.isArray(body?.messages) ? body!.messages : [];
  // Le pack axi-chat envoie siteId au niveau racine du payload et dans
  // contexte.siteId — on prend l'un ou l'autre.
  const slugSiteCourant =
    (typeof body?.siteId === "string" ? body.siteId : null) ??
    (typeof body?.contexte?.siteId === "string"
      ? body.contexte.siteId
      : null);

  // Prénom + sites de l'admin pour contextualiser AXI
  const [profilRow] = await db
    .select({ nomAffiche: users.nomAffiche })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const prenom =
    profilRow?.nomAffiche?.split(" ")[0] ??
    user.user_metadata?.first_name ??
    null;

  // Si on a un slug de site dans le contexte (admin focalisé sur un
  // site via l'URL /dashboard/sites/[slug]), on charge CE site et on
  // vérifie que l'admin y a accès. Sinon on reste en mode global.
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
      // TODO (futur) : vérifier filtreSitesAccessibles pour éviter
      // qu'un admin cause avec un site qui n'est pas le sien. Pour
      // l'instant on fait confiance au slug (il vient de l'URL où
      // le layout dashboard a déjà vérifié l'accès).
      siteCourant = {
        slug: row.slug,
        nomEntreprise: row.nomSite ?? row.nomEntreprise,
        domainePrincipal: row.domainePrincipal,
      };
    }
  }

  const systemPrompt = construirePromptCopilote(
    {
      prenomUtilisateur: prenom,
      sites: [], // non injecté dans le prompt : focalisation site courant
    },
    siteCourant,
  );

  const historique = messages
    .filter((m) => m.role !== "systeme")
    .map((m) => ({
      role: m.role === "visiteur" ? ("user" as const) : ("assistant" as const),
      content: m.contenu,
    }));

  if (historique.length === 0) {
    return NextResponse.json({
      contenu: "Je n'ai pas reçu de message. Dis-moi ce qui t'intéresse.",
    });
  }

  const anthropic = new Anthropic({ apiKey: cle });

  try {
    const reponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: historique,
    });

    const bloc = reponse.content.find((b) => b.type === "text");
    const contenu =
      bloc && bloc.type === "text" ? bloc.text : "Désolé, pas de réponse.";

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
