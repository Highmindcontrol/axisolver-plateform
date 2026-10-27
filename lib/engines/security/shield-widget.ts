import { createHash } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimitsChat } from "@/lib/db/schema";

/**
 * Shield /api/chat — protège le widget AxiSolver contre les abus :
 *
 * 1. Rate limiting par visiteur :
 *    - 60 messages / minute (burst)
 *    - 300 messages / jour
 *    Au-delà : blocage temporaire 15 min.
 *
 * 2. Détection prompt injection :
 *    - patterns connus (ignore previous, system prompt, DAN, jailbreak)
 *    - caractères de contrôle inhabituels
 *
 * 3. Fingerprint visiteur anonyme (IP + user-agent hashés) — pas de
 *    donnée identifiante stockée, uniquement un hash court pour
 *    regrouper les requêtes du même visiteur sur 24h.
 */

export type ResultatShield =
  | { autorise: true }
  | {
      autorise: false;
      raison:
        | "rate_limit_minute"
        | "rate_limit_jour"
        | "bloque_temporairement"
        | "prompt_injection_detecte"
        | "contenu_bloque";
      message: string;
      retryAfterSeconds?: number;
    };

const LIMITE_PAR_MINUTE = 60;
const LIMITE_PAR_JOUR = 300;
const DUREE_BLOCAGE_MS = 15 * 60 * 1000;

export async function verifierShield(params: {
  siteId: string;
  ip: string;
  userAgent: string;
  message: string;
}): Promise<ResultatShield> {
  const { siteId, ip, userAgent, message } = params;

  // ─── 1. Détection prompt injection (synchrone, pas d'I/O) ──────
  const injection = detecterPromptInjection(message);
  if (injection) {
    return {
      autorise: false,
      raison: "prompt_injection_detecte",
      message: `Message rejeté : ${injection}.`,
    };
  }

  // ─── 2. Rate limiting (table rate_limits_chat) ──────────────────
  const visiteurCle = calculerFingerprint(ip, userAgent);
  const maintenant = new Date();
  const bucketMinute = toBucketMinute(maintenant);
  const bucketJour = toBucketJour(maintenant);

  const [existant] = await db
    .select()
    .from(rateLimitsChat)
    .where(
      and(
        eq(rateLimitsChat.siteId, siteId),
        eq(rateLimitsChat.visiteurCle, visiteurCle),
      ),
    )
    .limit(1);

  if (existant) {
    // Blocage temporaire encore actif ?
    if (existant.bloqueJusqua && existant.bloqueJusqua > maintenant) {
      const retryAfter = Math.ceil(
        (existant.bloqueJusqua.getTime() - maintenant.getTime()) / 1000,
      );
      return {
        autorise: false,
        raison: "bloque_temporairement",
        message:
          "Trop de messages envoyés récemment. Merci de patienter avant de réessayer.",
        retryAfterSeconds: retryAfter,
      };
    }

    // Reset des compteurs si on a changé de bucket
    const nbMinute =
      existant.bucketMinute === bucketMinute ? existant.nbMsgsMinute : 0;
    const nbJour =
      existant.bucketJour === bucketJour ? existant.nbMsgsJour : 0;

    if (nbMinute >= LIMITE_PAR_MINUTE) {
      const bloqueJusqua = new Date(maintenant.getTime() + DUREE_BLOCAGE_MS);
      await db
        .update(rateLimitsChat)
        .set({ bloqueJusqua })
        .where(eq(rateLimitsChat.id, existant.id));
      return {
        autorise: false,
        raison: "rate_limit_minute",
        message:
          "Vous envoyez des messages trop vite. Merci de patienter 15 minutes.",
        retryAfterSeconds: 900,
      };
    }

    if (nbJour >= LIMITE_PAR_JOUR) {
      return {
        autorise: false,
        raison: "rate_limit_jour",
        message:
          "Vous avez atteint le quota quotidien de messages pour ce site. Revenez demain.",
        retryAfterSeconds: 3600 * 6,
      };
    }

    await db
      .update(rateLimitsChat)
      .set({
        bucketMinute,
        bucketJour,
        nbMsgsMinute: nbMinute + 1,
        nbMsgsJour: nbJour + 1,
        derniereActiviteLe: maintenant,
      })
      .where(eq(rateLimitsChat.id, existant.id));
  } else {
    await db.insert(rateLimitsChat).values({
      siteId,
      visiteurCle,
      bucketMinute,
      bucketJour,
      nbMsgsMinute: 1,
      nbMsgsJour: 1,
      derniereActiviteLe: maintenant,
    });
  }

  return { autorise: true };
}

/**
 * Nettoie les buckets rate_limits_chat plus vieux que 48h.
 * À appeler par un cron de maintenance.
 */
export async function nettoyerRateLimitsAnciens(): Promise<number> {
  const limite = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const result = await db
    .delete(rateLimitsChat)
    .where(lt(rateLimitsChat.derniereActiviteLe, limite))
    .returning({ id: rateLimitsChat.id });
  return result.length;
}

/* ─── Détection prompt injection ────────────────────────────────── */

/**
 * Patterns couramment utilisés dans les tentatives de prompt injection.
 * Retourne la raison si détecté, null sinon.
 *
 * On vise le mode « soft » : rejeter proprement sans révéler quelles
 * patterns ont été détectées (pour ne pas aider l'attaquant à itérer).
 */
export function detecterPromptInjection(message: string): string | null {
  const normalise = message.toLowerCase().normalize("NFKC");

  // ─── Caractères de contrôle inhabituels ─────────────────────────
  // U+202E (RLO), U+200B (ZWSP), etc. — utilisés pour tromper les LLMs
  if (/[\u202a-\u202e\u2066-\u2069\u200b-\u200f]/.test(message)) {
    return "le message contient des caractères Unicode suspects";
  }

  // ─── Patterns de bypass ─────────────────────────────────────────
  const patterns: Array<{ regex: RegExp; raison: string }> = [
    {
      regex: /ignore\s+(previous|above|all)\s+(instructions|prompts|rules)/i,
      raison: "tentative d'ignorance des instructions système",
    },
    {
      regex: /disregard\s+(previous|above|all)\s+(instructions|prompts)/i,
      raison: "tentative d'ignorance des instructions système",
    },
    {
      regex: /you\s+are\s+now\s+(dan|do\s+anything\s+now|jailbroken)/i,
      raison: "tentative de jailbreak via rôle alternatif",
    },
    {
      regex: /system\s*prompt|system\s*message\s*:/i,
      raison: "tentative d'extraction du prompt système",
    },
    {
      regex: /\brepeat\s+(the\s+)?(above|previous|first|initial|original)\s+(instructions|prompt|message|text)/i,
      raison: "tentative d'extraction du prompt système",
    },
    {
      regex: /\bprint\s+(your|the)\s+(system|initial|first|original)\s+(prompt|instructions|message)/i,
      raison: "tentative d'extraction du prompt système",
    },
    {
      regex: /\[\[end\s+of\s+(instructions|prompt|system)\]\]/i,
      raison: "tentative d'injection de marqueur de fin de prompt",
    },
    {
      regex: /oublie\s+(toutes\s+)?(tes|les)\s+(instructions|règles|consignes)/i,
      raison: "tentative d'ignorance des instructions système",
    },
    {
      regex: /donne-moi\s+(ton|votre)\s+(prompt|instructions|consignes)\s+(système|initial)/i,
      raison: "tentative d'extraction du prompt système",
    },
  ];

  for (const p of patterns) {
    if (p.regex.test(normalise)) {
      return p.raison;
    }
  }

  // ─── Message trop long = soupçon ────────────────────────────────
  if (message.length > 8000) {
    return "le message est trop long (plus de 8 000 caractères)";
  }

  return null;
}

function calculerFingerprint(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip}::${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

function toBucketMinute(d: Date): string {
  // Clé YYYY-MM-DDTHH:MM
  return d.toISOString().slice(0, 16);
}

function toBucketJour(d: Date): string {
  return d.toISOString().slice(0, 10);
}
