import "server-only";

import { randomBytes } from "node:crypto";
import { promises as dns } from "node:dns";

/**
 * Vérification de propriété d'un domaine, modèle Google Search
 * Console. Deux méthodes mutuellement acceptables :
 *
 *   1. Fichier texte à déposer à la racine du site :
 *      https://domaine.com/axisolver-verification-{token}.txt
 *      Doit contenir uniquement le token (pas de ligne, pas d'espaces).
 *
 *   2. Enregistrement DNS TXT sur le domaine :
 *      TXT @ axisolver-verify={token}
 *
 * La vérification tente les 2 méthodes en parallèle. Dès qu'une des
 * deux réussit, la propriété est validée. Si les 2 échouent, on
 * remonte un message d'erreur combiné pour que l'utilisateur sache
 * ce qui ne va pas.
 *
 * Prérequis absolu avant toute action destructive côté systèmes
 * externes du client (OAuth Google Ads, lecture logs Cloudflare,
 * règles de blocage WAF) — doctrine missions 5 et 6 d'AxiSolver.
 */

export type ResultatVerification = {
  verifie: boolean;
  methode?: "fichier" | "dns";
  erreurs: string[];
};

export function genererToken(): string {
  return randomBytes(24).toString("base64url");
}

const USER_AGENT =
  "AxiSolver-Verification/1.0 (+https://axisolver.app/propriete)";
const TIMEOUT_MS = 10_000;

export async function verifierProprieteDomaine(params: {
  domaine: string;
  tokenFichier: string;
  tokenDns: string;
}): Promise<ResultatVerification> {
  const { domaine, tokenFichier, tokenDns } = params;

  const [resFichier, resDns] = await Promise.allSettled([
    verifierParFichier(domaine, tokenFichier),
    verifierParDns(domaine, tokenDns),
  ]);

  const erreurs: string[] = [];

  if (resFichier.status === "fulfilled" && resFichier.value.ok) {
    return { verifie: true, methode: "fichier", erreurs: [] };
  }
  if (resFichier.status === "fulfilled") erreurs.push(`fichier : ${resFichier.value.raison}`);
  if (resFichier.status === "rejected") erreurs.push(`fichier : ${String(resFichier.reason)}`);

  if (resDns.status === "fulfilled" && resDns.value.ok) {
    return { verifie: true, methode: "dns", erreurs: [] };
  }
  if (resDns.status === "fulfilled") erreurs.push(`DNS : ${resDns.value.raison}`);
  if (resDns.status === "rejected") erreurs.push(`DNS : ${String(resDns.reason)}`);

  return { verifie: false, erreurs };
}

async function verifierParFichier(
  domaine: string,
  token: string,
): Promise<{ ok: boolean; raison?: string }> {
  const nomFichier = `axisolver-verification-${token}.txt`;
  const url = `https://${domaine}/${nomFichier}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/plain",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        raison: `HTTP ${res.status} sur ${url}`,
      };
    }
    const texte = (await res.text()).trim();
    if (texte === token) {
      return { ok: true };
    }
    return {
      ok: false,
      raison: `contenu différent du token attendu (fichier trouvé mais contenu ne correspond pas)`,
    };
  } catch (e) {
    return {
      ok: false,
      raison: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function verifierParDns(
  domaine: string,
  token: string,
): Promise<{ ok: boolean; raison?: string }> {
  const valeurAttendue = `axisolver-verify=${token}`;
  try {
    const records = await dns.resolveTxt(domaine);
    // records est un tableau de tableaux (chaque record TXT peut être
    // scindé en plusieurs chaînes qu'il faut concaténer)
    const flattened = records.map((r) => r.join(""));
    if (flattened.includes(valeurAttendue)) {
      return { ok: true };
    }
    return {
      ok: false,
      raison: `aucun enregistrement TXT = "${valeurAttendue}" trouvé sur ${domaine} (TXT présents : ${flattened.length})`,
    };
  } catch (e) {
    return {
      ok: false,
      raison: e instanceof Error ? e.message : String(e),
    };
  }
}
