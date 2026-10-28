import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT_AXISOLVER_AUTOSELL } from "@/lib/axi-solver/system-prompt";
import { chargerConfigSite } from "@/lib/axi-solver/charger-config-site";
import { construirePrompt } from "@/lib/axi-solver/construire-prompt";
import { verifierOrigine } from "@/lib/axi-solver/verifier-origine";
import {
  rechercher,
  formaterResultats,
} from "@/lib/axi-solver/connaissance/rechercher";
import { TOOLS_AXISOLVER } from "@/lib/axi-solver/tools";
import { estDestructif } from "@/lib/axi-solver/tools-destructifs";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import {
  auditerSite,
  auditerSiteParCategorie,
} from "@/lib/axi-solver/audit-site";
import { auditerReferencement } from "@/lib/axi-solver/audit-referencement";
import { verifierShield } from "@/lib/engines/security/shield-widget";
import { verifierQuotaConversations } from "@/lib/stripe/verifier-quotas";
import { incrementerUsage } from "@/lib/stripe/incrementer-usage";
import {
  FORMULES,
  conversationsEstimees,
  getFormule,
  recommanderFormule,
  tauxEffectif,
  type PreferenceVoix,
  type ProfilProspect,
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
 * Preflight CORS — appelé par le navigateur avant un POST cross-origin
 * depuis un site tiers qui embed le widget. On autorise uniquement
 * les origines inscrites dans `domaines_autorises` du site cible.
 */
export async function OPTIONS(request: Request) {
  const origine = request.headers.get("origin");
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  const headers = await construireHeadersCors(origine, slug);
  return new Response(null, { status: 204, headers });
}

/**
 * Construit les headers CORS dynamiquement selon le site cible.
 * Si le slug n'existe pas ou si l'origine n'est pas autorisée, on
 * renvoie des headers sans Access-Control-Allow-Origin — le navigateur
 * bloquera la requête côté client. Vary: Origin pour que les CDN
 * ne cachent pas la réponse d'un site pour un autre.
 */
async function construireHeadersCors(
  origine: string | null,
  slug: string | null,
): Promise<Record<string, string>> {
  const base: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (!slug || !origine) return base;

  try {
    const config = await chargerConfigSite(slug);
    if (!config) return base;
    const verif = verifierOrigine(origine, config);
    if (verif.autorise) {
      base["Access-Control-Allow-Origin"] = origine;
      base["Access-Control-Allow-Credentials"] = "true";
    }
  } catch {
    // DB inaccessible — on ne renvoie pas de CORS, requête bloquée.
  }
  return base;
}

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
  const origine = request.headers.get("origin");
  const urlReq = new URL(request.url);
  const slugCors = urlReq.searchParams.get("slug");
  const headersCors = await construireHeadersCors(origine, slugCors);

  if (!cle) {
    return new Response(
      sseStreamStatique(
        "AxiSolver sera branché en direct dès que la clé Claude sera posée côté serveur. En attendant, pour composer votre équipe AXI et souscrire, direction axihub.live — AXI vous y attend en live.",
      ),
      sseHeaders(headersCors),
    );
  }

  let body: {
    messages: ClientMessage[];
    slug?: string;
    visiteurId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonErreur("JSON invalide", 400, headersCors);
  }

  const visiteurId = body?.visiteurId ?? null;
  const messagesInitiaux = Array.isArray(body?.messages) ? body.messages : [];
  if (messagesInitiaux.length === 0) {
    return jsonErreur("Aucun message fourni", 400, headersCors);
  }

  // Multi-tenant : si un `slug` est fourni (via URL ou body), on charge
  // la config du site cible. Sinon, fallback legacy sur le prompt vitrine
  // historique d'axisolver.app (rétro-compatibilité V1).
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? body?.slug ?? null;

  let promptSysteme = SYSTEM_PROMPT_AXISOLVER_AUTOSELL;
  let siteIdCourant: string | null = null;
  let ownerUserIdCourant: string | null = null;
  let proprieteVerifieeCourant = false;
  if (slug) {
    try {
      const config = await chargerConfigSite(slug);
      if (!config) {
        return jsonErreur(`Site "${slug}" introuvable ou inactif`, 404, headersCors);
      }
      // Vérification Origin pour empêcher qu'un site tiers détourne
      // l'instance d'un autre. En dev localhost toujours OK.
      const origine = request.headers.get("origin");
      const verif = verifierOrigine(origine, config);
      if (!verif.autorise) {
        console.warn(
          `[chat] Origin refusé pour slug="${slug}" : ${verif.raison}`,
        );
        return jsonErreur(verif.raison ?? "Origin non autorisé", 403, headersCors);
      }
      promptSysteme = construirePrompt(config);
      siteIdCourant = config.siteId;
      ownerUserIdCourant = config.ownerUserId;
      proprieteVerifieeCourant = config.proprieteVerifiee;
    } catch (e) {
      console.error("[chat] Erreur chargement config site :", e);
      return jsonErreur("Erreur serveur à la configuration du site", 500, headersCors);
    }
  }

  // Enforcement quota mensuel (LOT K.6) — seulement pour les sites avec
  // un propriétaire humain. Les sites système Ataraxis (owner null)
  // sont exemptés car ils sont dogfood interne.
  if (siteIdCourant && ownerUserIdCourant) {
    try {
      const quota = await verifierQuotaConversations({
        userId: ownerUserIdCourant,
      });
      if (!quota.autorise) {
        return jsonErreur(
          quota.raison ?? "Quota mensuel dépassé",
          402,
          headersCors,
        );
      }
    } catch (e) {
      console.warn("[chat] Enforcement quota échoué, requête autorisée :", e);
    }
  }

  // Shield widget (LOT I.3) — rate limiting + anti prompt injection.
  // Appliqué uniquement sur les sites multi-tenants (slug présent) pour
  // ne pas gêner le mode legacy axisolver.app.
  if (siteIdCourant) {
    const dernierMessageUser =
      [...messagesInitiaux].reverse().find((m) => m.role === "user")?.content ??
      "";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "0.0.0.0";
    const userAgent = request.headers.get("user-agent") ?? "unknown";

    try {
      const shield = await verifierShield({
        siteId: siteIdCourant,
        ip,
        userAgent,
        message: dernierMessageUser,
      });
      if (!shield.autorise) {
        const headersBlocage = { ...headersCors };
        if (shield.retryAfterSeconds) {
          headersBlocage["Retry-After"] = String(shield.retryAfterSeconds);
        }
        return jsonErreur(shield.message, 429, headersBlocage);
      }
    } catch (e) {
      // Shield ne doit pas bloquer en cas d'erreur DB — on log et on continue.
      console.warn("[chat] Shield en échec, requête autorisée par défaut :", e);
    }
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
            system: promptSysteme,
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
                // ─── Garde-fou propriété de domaine ───
                // Tout tool qui touche aux systèmes externes du client
                // (Google Ads, Cloudflare, WAF…) est refusé si la
                // propriété du domaine n'est pas vérifiée. Doctrine
                // AxiSolver missions 5 et 6.
                if (estDestructif(b.name) && !proprieteVerifieeCourant) {
                  console.warn(
                    `[chat] tool "${b.name}" refusé : propriété non vérifiée pour slug=${slug}`,
                  );
                  return {
                    type: "tool_result" as const,
                    tool_use_id: b.id,
                    content:
                      "Action refusée : la propriété du domaine n'est pas encore vérifiée. Invitez le propriétaire du site à aller sur son dashboard AxiSolver → Vérification de propriété pour valider le domaine avant toute action externe.",
                  };
                }

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
                    preferenceVoix?: string;
                  };
                  const visiteurs = Number(input.visiteursMois ?? 0);
                  if (
                    !visiteurs ||
                    !input.secteurSlug ||
                    !input.usagePrincipal ||
                    !input.preferenceVoix
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
                    tailleEquipe: "petite",
                    preferenceVoix: input.preferenceVoix as PreferenceVoix,
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
                    FORMULES.map((f) => [f.slug, f.prixMensuelHt]),
                  ) as Record<string, number>;
                  const recommandeeSlug = recommanderFormule(profil);
                  const recommandee = getFormule(recommandeeSlug);

                  emit({
                    type: "tool_use",
                    tool: "estimer_tarif_axisolver",
                    id: b.id,
                    input: {
                      visiteursMois: profil.visiteursMois,
                      secteurSlug: profil.secteurSlug,
                      usagePrincipal: profil.usagePrincipal,
                      preferenceVoix: profil.preferenceVoix,
                      formuleRecommandee: recommandeeSlug,
                      prixTextS: prix["text-s"],
                      prixTextL: prix["text-l"],
                      prixPremiumS: prix["premium-s"],
                      prixPremiumL: prix["premium-l"],
                      tauxEffectif: taux,
                      conversationsMois: conv,
                    },
                  });

                  return {
                    type: "tool_result" as const,
                    tool_use_id: b.id,
                    content: `Recommandation prête. Formule : ${recommandee.nom} à ${recommandee.prixMensuelHt} € HT/mois (${recommandee.conversationsIncluses} conv incluses). Pour ${profil.visiteursMois} visiteurs mensuels sur un ${profil.secteurSlug}, ~${conv} conversations/mois estimées. Les 4 formules : Text S 49€, Text L 69€, Premium S 99€ (phare), Premium L 129€. Annonce vocalement UNIQUEMENT la formule recommandée + son prix. Le visiteur voit le détail dans le panneau à gauche.`,
                  };
                }

                // --- Recherche RAG dans la base de connaissances --- //
                if (b.name === "chercher_base_connaissances") {
                  if (!siteIdCourant) {
                    return {
                      type: "tool_result" as const,
                      tool_use_id: b.id,
                      content:
                        "Base de connaissances non disponible pour cette instance (pas de site_id).",
                    };
                  }
                  try {
                    const input = b.input as {
                      requete?: string;
                      nb_resultats?: number;
                    };
                    const requete = String(input.requete ?? "").trim();
                    if (!requete) {
                      return {
                        type: "tool_result" as const,
                        tool_use_id: b.id,
                        content:
                          "Requête vide — précise ce que tu cherches avant de rappeler le tool.",
                      };
                    }
                    const resultats = await rechercher({
                      siteId: siteIdCourant,
                      requete,
                      limite: Math.max(
                        1,
                        Math.min(10, Number(input.nb_resultats ?? 5)),
                      ),
                    });
                    console.log(
                      `[chercher_base_connaissances] site=${siteIdCourant} requete="${requete}" nb_resultats=${resultats.length}`,
                    );
                    return {
                      type: "tool_result" as const,
                      tool_use_id: b.id,
                      content: formaterResultats(resultats),
                    };
                  } catch (err) {
                    const msg =
                      err instanceof Error ? err.message : "recherche échouée";
                    console.error("[chercher_base_connaissances]", msg);
                    return {
                      type: "tool_result" as const,
                      tool_use_id: b.id,
                      content: `Recherche base de connaissances indisponible (${msg}). Continue sans ces infos.`,
                    };
                  }
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

        // Capture asynchrone de la conversation en DB (fire-and-forget)
        // Uniquement pour les sites tiers (slug présent + siteIdCourant),
        // pas pour axisolver.app vitrine (où le flow est différent).
        if (siteIdCourant) {
          const messagesPourStockage = messagesAnthropic
            .filter(
              (m): m is { role: "user" | "assistant"; content: string } =>
                typeof m.content === "string",
            )
            .map((m) => ({
              role: m.role,
              content: m.content,
              horodatage: new Date().toISOString(),
            }));
          const nbTours = messagesPourStockage.filter(
            (m) => m.role === "assistant",
          ).length;

          db
            .insert(conversations)
            .values({
              siteId: siteIdCourant,
              visiteurId: visiteurId ?? null,
              userAgent: request.headers.get("user-agent") ?? null,
              url: request.headers.get("referer") ?? null,
              messages: messagesPourStockage,
              nbTours,
              finLe: new Date(),
            })
            .then(() => {})
            .catch((e) => {
              console.error("[chat] persist conversation failed:", e);
            });

          // Metering mensuel (LOT K.6) — on compte 1 conversation sur le
          // premier tour (nbTours == 1) et 1 message à chaque tour.
          if (ownerUserIdCourant) {
            incrementerUsage({
              siteId: siteIdCourant,
              userId: ownerUserIdCourant,
              nouvelleConversation: nbTours === 1,
            }).catch((e) => {
              console.error("[chat] metering usage failed:", e);
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur Claude";
        emit({ type: "erreur", message });
        controller.close();
      }
    },
  });

  return new Response(stream, sseHeaders(headersCors));
}

// ------------------------------------------------------------------ //
// Utilitaires                                                        //
// ------------------------------------------------------------------ //

function sseHeaders(cors: Record<string, string> = {}): ResponseInit {
  return {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...cors,
    },
  };
}

function jsonErreur(
  message: string,
  status: number,
  cors: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify({ erreur: message }), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
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
