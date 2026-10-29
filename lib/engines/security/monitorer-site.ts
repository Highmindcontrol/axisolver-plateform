import { createHash } from "node:crypto";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  securiteInterventions,
  securityIncidents,
  securityMonitorings,
  type FindingSecurity,
} from "@/lib/db/schema";
import { analyserTls } from "./analyser-tls";

/**
 * Monitoring d'un site — exécuté toutes les 6h par cron.
 *
 * Mesure 4 signaux : status HTTP, hash du HTML servi, expiration SSL,
 * temps de réponse. Compare avec le monitoring précédent et génère un
 * incident si un changement anormal est détecté :
 *
 *   - site_indisponible : status != 2xx/3xx
 *   - hash_html_change : SHA256 du HTML a changé depuis le dernier
 *     snapshot (pistes : défacement, deploy non-prévu)
 *   - ssl_expiration_proche / ssl_expiree : < 30j, 14j, 7j, 2j, J+
 *   - cert_invalide : impossible de récupérer le certificat
 */

export type IncidentDeclenche = {
  type:
    | "ssl_expiration_proche"
    | "ssl_expiree"
    | "site_indisponible"
    | "hash_html_change"
    | "cert_invalide";
  severite: "critique" | "haute" | "moyenne" | "basse";
  message: string;
  details: Record<string, unknown>;
};

export type ResultatMonitoring = {
  statusHttp: number | null;
  hashHtml: string | null;
  tempsReponseMs: number | null;
  certificatExpireeLe: Date | null;
  certificatEmetteur: string | null;
  erreur: string | null;
  incidents: IncidentDeclenche[];
};

export async function monitorerSite(params: {
  siteId: string;
  url: string;
}): Promise<ResultatMonitoring> {
  const { siteId, url } = params;

  const resultat: ResultatMonitoring = {
    statusHttp: null,
    hashHtml: null,
    tempsReponseMs: null,
    certificatExpireeLe: null,
    certificatEmetteur: null,
    erreur: null,
    incidents: [],
  };

  // ─── 1. Mesure HTTP ──────────────────────────────────────────────
  const debut = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "AxiSolver-Monitor/1.0 (+https://axisolver.app)",
      },
      signal: AbortSignal.timeout(10000),
    });
    resultat.tempsReponseMs = Date.now() - debut;
    resultat.statusHttp = res.status;

    if (res.status >= 500 || res.status === 404) {
      resultat.incidents.push({
        type: "site_indisponible",
        severite: res.status >= 500 ? "critique" : "haute",
        message: `Site renvoie HTTP ${res.status}.`,
        details: { status: res.status, url, duree_ms: resultat.tempsReponseMs },
      });
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html") && res.ok) {
      const html = await res.text();
      resultat.hashHtml = createHash("sha256").update(html).digest("hex");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    resultat.erreur = msg;
    resultat.incidents.push({
      type: "site_indisponible",
      severite: "critique",
      message: `Impossible de contacter le site : ${msg}`,
      details: { url, erreur: msg },
    });
  }

  // ─── 2. Mesure TLS ───────────────────────────────────────────────
  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    // URL invalide — on arrête ici.
  }

  if (hostname && url.startsWith("https://")) {
    const tls = await analyserTls(hostname);
    resultat.certificatExpireeLe = tls.expireeLe;
    resultat.certificatEmetteur = tls.emetteur;

    if (tls.expireeLe) {
      const joursRestants = Math.round(
        (tls.expireeLe.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (joursRestants < 0) {
        resultat.incidents.push({
          type: "ssl_expiree",
          severite: "critique",
          message: `Certificat SSL expiré depuis ${Math.abs(joursRestants)} jour(s).`,
          details: { expire_le: tls.expireeLe.toISOString(), jours: joursRestants },
        });
      } else if (joursRestants <= 30) {
        const severite: IncidentDeclenche["severite"] =
          joursRestants <= 2 ? "critique" : joursRestants <= 7 ? "haute" : "moyenne";
        resultat.incidents.push({
          type: "ssl_expiration_proche",
          severite,
          message: `Certificat SSL expire dans ${joursRestants} jour(s).`,
          details: { expire_le: tls.expireeLe.toISOString(), jours: joursRestants },
        });
      }
    } else {
      // TLS a répondu findings sans date : connexion impossible ou cert pourri
      const critique = tls.findings.find(
        (f: FindingSecurity) => f.code === "tls_connexion_impossible",
      );
      if (critique) {
        resultat.incidents.push({
          type: "cert_invalide",
          severite: "critique",
          message: critique.message,
          details: { url },
        });
      }
    }
  }

  // ─── 3. Détection changement HTML ────────────────────────────────
  if (resultat.hashHtml) {
    const [precedent] = await db
      .select({ hashHtml: securityMonitorings.hashHtml })
      .from(securityMonitorings)
      .where(eq(securityMonitorings.siteId, siteId))
      .orderBy(desc(securityMonitorings.mesureLe))
      .limit(1);

    if (precedent?.hashHtml && precedent.hashHtml !== resultat.hashHtml) {
      // Avant de déclencher l'incident, vérifier si une intervention
      // AXI Security Shield a modifié le site récemment (30 min).
      // Si oui, c'est un faux positif attendu — on marque le changement
      // comme légitime au lieu de créer un incident.
      const interventionRecente = await interventionAxiRecente(siteId);
      if (interventionRecente) {
        console.log(
          `[monitoring] hash HTML changé mais intervention AXI « ${interventionRecente.titre} » détectée à ${interventionRecente.termineLe?.toISOString()} — pas d'incident créé.`,
        );
      } else {
        resultat.incidents.push({
          type: "hash_html_change",
          severite: "moyenne",
          message:
            "Le contenu HTML de la page d'accueil a changé. Vérifier qu'il s'agit d'un deploy légitime.",
          details: {
            hash_precedent: precedent.hashHtml.slice(0, 16),
            hash_courant: resultat.hashHtml.slice(0, 16),
          },
        });
      }
    }
  }

  // ─── 4. Persistance du snapshot + incidents ─────────────────────
  await db.insert(securityMonitorings).values({
    siteId,
    statusHttp: resultat.statusHttp,
    hashHtml: resultat.hashHtml,
    certificatExpireeLe: resultat.certificatExpireeLe,
    certificatEmetteur: resultat.certificatEmetteur,
    tempsReponseMs: resultat.tempsReponseMs,
    erreur: resultat.erreur,
  });

  for (const inc of resultat.incidents) {
    // Déduplique : si un incident ouvert du même type existe déjà pour
    // ce site, on ne crée pas de doublon.
    const [existant] = await db
      .select({ id: securityIncidents.id })
      .from(securityIncidents)
      .where(
        and(
          eq(securityIncidents.siteId, siteId),
          eq(securityIncidents.type, inc.type),
          eq(securityIncidents.statut, "ouvert"),
        ),
      )
      .limit(1);
    if (existant) continue;

    await db.insert(securityIncidents).values({
      siteId,
      type: inc.type,
      severite: inc.severite,
      message: inc.message,
      details: inc.details,
    });
  }

  return resultat;
}

/**
 * Retourne la dernière intervention AXI Security Shield terminée avec
 * succès dans les 30 dernières minutes, ou null si aucune.
 */
async function interventionAxiRecente(
  siteId: string,
): Promise<{ titre: string; termineLe: Date | null } | null> {
  try {
    const il30Min = new Date(Date.now() - 30 * 60 * 1000);
    const [row] = await db
      .select({
        titre: securiteInterventions.titre,
        termineLe: securiteInterventions.termineLe,
      })
      .from(securiteInterventions)
      .where(
        and(
          eq(securiteInterventions.siteId, siteId),
          eq(securiteInterventions.statut, "terminee"),
          gte(securiteInterventions.termineLe, il30Min),
        ),
      )
      .orderBy(desc(securiteInterventions.termineLe))
      .limit(1);
    return row ?? null;
  } catch {
    // Table pas encore créée en prod (migration 0020 pas appliquée)
    return null;
  }
}
