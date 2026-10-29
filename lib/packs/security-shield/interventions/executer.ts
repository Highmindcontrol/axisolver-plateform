import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteAccesSecurite } from "@/lib/db/schema";
import { recupererCredentiels } from "../acces/repository";
import type {
  AccesCredentiels,
  AccesParametresPublics,
} from "../acces/types";
import { appliquerRemediation } from "../plugin-wordpress/client";
import { marquerExecution, recupererIntervention } from "./repository";

/**
 * Exécute une intervention : lit l'accès WordPress configuré, appelle
 * le plugin AXI Security Shield pour appliquer la remédiation, et
 * journalise le résultat.
 */
export async function executerIntervention(params: {
  interventionId: string;
  siteId: string;
}): Promise<{ ok: boolean; journal: string }> {
  const intervention = await recupererIntervention(
    params.interventionId,
    params.siteId,
  );
  if (!intervention) {
    return { ok: false, journal: "Intervention introuvable." };
  }

  // Récupère le premier accès WordPress actif du site
  const [acces] = await db
    .select()
    .from(siteAccesSecurite)
    .where(eq(siteAccesSecurite.siteId, params.siteId))
    .limit(1);

  if (!acces) {
    await marquerExecution({
      interventionId: params.interventionId,
      siteId: params.siteId,
      statut: "echec",
      erreur:
        "Aucun accès configuré pour ce site. Configure au moins un accès dans la page Accès au site pour AXI.",
    });
    return {
      ok: false,
      journal: "Aucun accès configuré pour ce site.",
    };
  }

  if (acces.type !== "wordpress_rest") {
    await marquerExecution({
      interventionId: params.interventionId,
      siteId: params.siteId,
      statut: "echec",
      erreur: `Type d'accès « ${acces.type} » pas encore supporté par le moteur de remédiation. V1 : WordPress REST uniquement.`,
    });
    return {
      ok: false,
      journal: `Type d'accès « ${acces.type} » pas encore supporté.`,
    };
  }

  const creds = await recupererCredentiels(acces.id, params.siteId);
  if (!creds) {
    await marquerExecution({
      interventionId: params.interventionId,
      siteId: params.siteId,
      statut: "echec",
      erreur: "Impossible de déchiffrer les credentiels de l'accès.",
    });
    return { ok: false, journal: "Impossible de déchiffrer les credentiels." };
  }

  // Marque en cours
  await marquerExecution({
    interventionId: params.interventionId,
    siteId: params.siteId,
    statut: "en_cours",
  });

  // Appelle le plugin WordPress
  const resultat = await appliquerRemediation({
    parametresPublics: acces.parametresPublics as AccesParametresPublics,
    credentiels: creds as AccesCredentiels,
    code: intervention.findingCode,
  });

  await marquerExecution({
    interventionId: params.interventionId,
    siteId: params.siteId,
    statut: resultat.succes ? "terminee" : "echec",
    resultat: resultat as unknown as Record<string, unknown>,
    erreur: resultat.succes ? null : resultat.journal,
  });

  return { ok: resultat.succes, journal: resultat.journal };
}
