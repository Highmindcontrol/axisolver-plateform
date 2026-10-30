import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import type Anthropic from "@anthropic-ai/sdk";

import { db } from "@/lib/db";
import {
  conversations,
  rapportsQuotidiens,
  securiteInterventions,
  siteConfigs,
  sites,
  stripeSubscriptions,
  usageConversations,
} from "@/lib/db/schema";
import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { FORMULES, type SlugPlan } from "@/lib/stripe/formules";

/**
 * Catalogue de tools donnés à AXI dans le chat copilote dashboard.
 *
 * Chaque tool a :
 *  - un JSON Schema (envoyé à Claude pour qu'il sache quand/comment l'appeler)
 *  - une implémentation serveur qui lit la DB avec l'identité de l'admin
 *    courant (jamais depuis Claude — zéro escalade de privilège)
 *
 * V1 : outils de LECTURE uniquement. Les actions (modifier une config,
 * déclencher un audit, créer une entrée KB) viendront en V2 avec
 * système de validation « AXI propose, admin valide ».
 */

/* ─── Déclarations JSON Schema envoyées à Claude ─────────────── */

export const COPILOTE_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "lister_sites",
    description:
      "Liste les sites AxiSolver auxquels l'admin a accès (slug, nom, domaine, plan Stripe). À utiliser quand l'admin demande 'quels sont mes sites', 'sur quoi je bosse', ou avant de proposer de basculer de contexte.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "lire_metriques_site",
    description:
      "Lit les métriques courantes d'un site : nombre de conversations ce mois, nombre de tickets ouverts, nombre d'interventions AXI Security Shield en attente de validation, dernier score du rapport quotidien. À utiliser quand l'admin demande 'comment va mon site X', 'où en est-on sur Y', ou pour contextualiser une réponse.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug_site: {
          type: "string",
          description:
            "Slug du site à inspecter (ex: 'coryphea', 'neuroactif'). Doit faire partie des sites de l'admin.",
        },
      },
      required: ["slug_site"],
    },
  },
  {
    name: "lire_derniers_rapports",
    description:
      "Lit les N derniers rapports quotidiens d'un site (date, score global, points saillants). À utiliser pour répondre à 'qu'est-ce qu'il y a eu la semaine dernière', 'donne-moi la tendance récente'.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug_site: { type: "string" },
        nombre: {
          type: "integer",
          description: "Nombre de rapports à récupérer (défaut 7, max 30)",
          default: 7,
        },
      },
      required: ["slug_site"],
    },
  },
  {
    name: "lire_abonnement",
    description:
      "Lit l'abonnement Stripe courant de l'admin : plan, prix mensuel, quota conversations/mois, statut (actif/trialing/annulé), prochaine échéance. À utiliser pour parler facturation ou quota.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "afficher_section",
    description:
      "Affiche un cartouche visuel sur l'ailette gauche de la conversation (ex: 'Annonces Google', 'Référencement', 'Sécurité'). À utiliser systématiquement quand tu structures une réponse en plusieurs points thématiques. INTERDICTION : ne JAMAIS écrire de titre markdown dans ton speech — appelle ce tool à la place. Pendant que tu parles d'un sujet, le cartouche apparaît côté gauche pour aider l'admin à visualiser.",
    input_schema: {
      type: "object" as const,
      properties: {
        titre: {
          type: "string",
          description:
            "Titre court (2-4 mots max) qui résume la section. Ex: 'Annonces Google', 'Score SEO', 'Base de connaissances'.",
        },
      },
      required: ["titre"],
    },
  },
  {
    name: "afficher_lien",
    description:
      "Affiche un bouton cliquable sur l'ailette gauche pour que l'admin ouvre directement une page admin (SEO, Ads, Sécurité, Configuration, etc.). À utiliser quand tu veux orienter l'admin vers une page. INTERDICTION : ne JAMAIS écrire d'URL dans ton speech — appelle ce tool. Le TTS ne lira pas d'URL imprononçable.",
    input_schema: {
      type: "object" as const,
      properties: {
        label: {
          type: "string",
          description: "Libellé du bouton. Ex: 'Audit SEO', 'Rapports', 'Configuration'.",
        },
        cible: {
          type: "string",
          description:
            "URL admin de destination. Doit commencer par '/dashboard/'. Ex: '/dashboard/sites/coryphea/seo'.",
        },
      },
      required: ["label", "cible"],
    },
  },
];

/* ─── Exécution serveur ──────────────────────────────────────── */

export type OrdreTool = {
  id: string;
  nomTool: string;
  libelle: string;
  statut: "en_cours" | "termine" | "echoue";
  horodatage: Date;
  resume: string | null;
  /**
   * Nature du tool :
   *   - "action" : vrai tool qui lit/écrit, va dans l'ailette d'ordres (droite)
   *   - "section" : repère visuel « cartouche » dans l'ailette gauche
   *   - "lien" : bouton cliquable dans l'ailette gauche
   */
  kind?: "action" | "section" | "lien";
  /** URL cible si kind === "lien". */
  cible?: string;
};

export async function executerTool(
  nomTool: string,
  input: Record<string, unknown>,
  contexte: { userId: string },
): Promise<{ resultat: string; ordre: OrdreTool }> {
  const horodatage = new Date();
  const id = `${nomTool}-${horodatage.getTime()}-${Math.random().toString(36).slice(2, 7)}`;

  // Tools déclaratifs (repères visuels) — zéro I/O, retour immédiat
  if (nomTool === "afficher_section") {
    const titre = String(input.titre ?? "").trim().slice(0, 60);
    return {
      resultat: `Section « ${titre} » affichée sur l'ailette gauche.`,
      ordre: {
        id,
        nomTool,
        libelle: titre,
        statut: "termine",
        horodatage,
        resume: null,
        kind: "section",
      },
    };
  }
  if (nomTool === "afficher_lien") {
    const label = String(input.label ?? "").trim().slice(0, 60);
    const cible = String(input.cible ?? "").trim();
    if (!label || !cible.startsWith("/dashboard/")) {
      return {
        resultat:
          "Appel afficher_lien invalide : label manquant ou cible hors /dashboard/.",
        ordre: {
          id,
          nomTool,
          libelle: label || "lien invalide",
          statut: "echoue",
          horodatage,
          resume: "cible doit commencer par /dashboard/",
          kind: "lien",
        },
      };
    }
    return {
      resultat: `Bouton « ${label} » (${cible}) affiché sur l'ailette gauche.`,
      ordre: {
        id,
        nomTool,
        libelle: label,
        statut: "termine",
        horodatage,
        resume: null,
        kind: "lien",
        cible,
      },
    };
  }

  try {
    const resultat = await executerToolInterne(nomTool, input, contexte);
    return {
      resultat: resultat.resultat,
      ordre: {
        id,
        nomTool,
        libelle: resultat.libelle,
        statut: "termine",
        horodatage,
        resume: resultat.resume,
        kind: "action",
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      resultat: `Erreur lors de l'exécution : ${msg}`,
      ordre: {
        id,
        nomTool,
        libelle: `Échec de ${nomTool}`,
        statut: "echoue",
        horodatage,
        resume: msg.slice(0, 160),
        kind: "action",
      },
    };
  }
}

async function executerToolInterne(
  nomTool: string,
  input: Record<string, unknown>,
  contexte: { userId: string },
): Promise<{ resultat: string; libelle: string; resume: string | null }> {
  const { userId } = contexte;

  switch (nomTool) {
    case "lister_sites": {
      const rows = await db
        .select({
          slug: sites.slug,
          nomEntreprise: sites.nomEntreprise,
          nomSite: sites.nomSite,
          domainePrincipal: sites.domainePrincipal,
          plan: sites.plan,
        })
        .from(sites)
        .where(await filtreSitesAccessibles(userId))
        .orderBy(sites.creeLe);
      const liste = rows.map((r, i) => ({
        rang: i + 1,
        slug: r.slug,
        nom: r.nomSite ?? r.nomEntreprise,
        domaine: r.domainePrincipal,
        plan: r.plan,
      }));
      return {
        resultat: JSON.stringify(liste, null, 2),
        libelle: `Liste des sites (${liste.length})`,
        resume: liste.map((s) => s.nom).join(", "),
      };
    }

    case "lire_metriques_site": {
      const slug = String(input.slug_site ?? "").trim();
      if (!slug) throw new Error("slug_site manquant");

      const [siteRow] = await db
        .select({ id: sites.id, nomEntreprise: sites.nomEntreprise, nomSite: sites.nomSite })
        .from(sites)
        .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(userId)))
        .limit(1);
      if (!siteRow) throw new Error(`Site '${slug}' introuvable ou inaccessible`);

      const bucketMois = formatBucketMois(new Date());

      const [convRow] = await db
        .select({
          nbConversations: usageConversations.nbConversations,
          nbMessages: usageConversations.nbMessages,
        })
        .from(usageConversations)
        .where(
          and(
            eq(usageConversations.siteId, siteRow.id),
            eq(usageConversations.bucketMois, bucketMois),
          ),
        )
        .limit(1);

      const [ticketsRow] = await db
        .select({ n: sql<number>`COUNT(*)` })
        .from(conversations)
        .where(
          and(
            eq(conversations.siteId, siteRow.id),
            sql`${conversations.resumeAxi} IS NOT NULL`,
          ),
        );

      const [interventionsRow] = await db
        .select({ n: sql<number>`COUNT(*)` })
        .from(securiteInterventions)
        .where(
          and(
            eq(securiteInterventions.siteId, siteRow.id),
            eq(securiteInterventions.statut, "en_attente_validation"),
          ),
        );

      const [dernierRapport] = await db
        .select({
          creeLe: rapportsQuotidiens.creeLe,
          stats: rapportsQuotidiens.stats,
        })
        .from(rapportsQuotidiens)
        .where(eq(rapportsQuotidiens.siteId, siteRow.id))
        .orderBy(desc(rapportsQuotidiens.creeLe))
        .limit(1);

      const metriques = {
        site: siteRow.nomSite ?? siteRow.nomEntreprise,
        slug,
        mois_courant: bucketMois,
        nb_conversations_mois: Number(convRow?.nbConversations ?? 0),
        nb_messages_mois: Number(convRow?.nbMessages ?? 0),
        nb_tickets_total: Number(ticketsRow?.n ?? 0),
        nb_interventions_shield_en_attente: Number(interventionsRow?.n ?? 0),
        dernier_rapport_le: dernierRapport?.creeLe?.toISOString() ?? null,
        dernier_rapport_stats: dernierRapport?.stats ?? null,
      };

      return {
        resultat: JSON.stringify(metriques, null, 2),
        libelle: `Métriques ${metriques.site}`,
        resume: `${metriques.nb_conversations_mois} conv ce mois · ${metriques.nb_interventions_shield_en_attente} intervention(s) Shield en attente`,
      };
    }

    case "lire_derniers_rapports": {
      const slug = String(input.slug_site ?? "").trim();
      const nombre = Math.min(
        Math.max(parseInt(String(input.nombre ?? 7), 10) || 7, 1),
        30,
      );
      if (!slug) throw new Error("slug_site manquant");

      const [siteRow] = await db
        .select({ id: sites.id, nomEntreprise: sites.nomEntreprise })
        .from(sites)
        .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(userId)))
        .limit(1);
      if (!siteRow) throw new Error(`Site '${slug}' introuvable`);

      const rapports = await db
        .select({
          creeLe: rapportsQuotidiens.creeLe,
          stats: rapportsQuotidiens.stats,
          opportunite: rapportsQuotidiens.opportunite,
        })
        .from(rapportsQuotidiens)
        .where(eq(rapportsQuotidiens.siteId, siteRow.id))
        .orderBy(desc(rapportsQuotidiens.creeLe))
        .limit(nombre);

      return {
        resultat: JSON.stringify(
          rapports.map((r) => ({
            date: r.creeLe.toISOString().slice(0, 10),
            stats: r.stats,
            opportunite: r.opportunite,
          })),
          null,
          2,
        ),
        libelle: `${rapports.length} derniers rapports de ${slug}`,
        resume: rapports.length > 0
          ? `Du ${rapports[rapports.length - 1].creeLe.toISOString().slice(0, 10)} au ${rapports[0].creeLe.toISOString().slice(0, 10)}`
          : "Aucun rapport",
      };
    }

    case "lire_abonnement": {
      const [sub] = await db
        .select()
        .from(stripeSubscriptions)
        .where(eq(stripeSubscriptions.userId, userId))
        .orderBy(desc(stripeSubscriptions.creeLe))
        .limit(1);
      if (!sub) {
        return {
          resultat: JSON.stringify({ actif: false, message: "Aucun abonnement Stripe actif." }),
          libelle: "Abonnement Stripe",
          resume: "Aucun abonnement actif",
        };
      }
      const formule = FORMULES[sub.plan as SlugPlan];
      const payload = {
        plan: sub.plan,
        nom_formule: formule?.nom ?? sub.plan,
        prix_mensuel_ht: formule?.prixMensuelHt ?? null,
        quota_conv_mois: formule?.nbConversationsMoisMax ?? null,
        statut: sub.statut,
        annule_fin_de_periode: sub.annuleFinDePeriode,
        periode_fin_le: sub.periodeFinLe?.toISOString() ?? null,
        essai_fin_le: sub.essaiFinLe?.toISOString() ?? null,
      };
      return {
        resultat: JSON.stringify(payload, null, 2),
        libelle: "Abonnement Stripe",
        resume: `${payload.nom_formule} · ${payload.statut}`,
      };
    }

    default:
      throw new Error(`Tool inconnu : ${nomTool}`);
  }
}

function formatBucketMois(d: Date): string {
  const an = d.getUTCFullYear();
  const mois = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${an}-${mois}`;
}
