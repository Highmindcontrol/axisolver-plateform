import "server-only";
import type { AccesCredentiels, AccesParametresPublics } from "./types";

/**
 * Tests de connexion par type d'accès. Objectif : vérifier qu'AXI peut
 * effectivement se connecter avant d'enregistrer l'accès ou d'exécuter
 * une remédiation. Chaque test retourne { ok, message, latenceMs }.
 *
 * V1 : WordPress REST (le plus simple) et HTTPS basique.
 * V1.1 : SSH, FTP, Cloudflare, cPanel, Plesk.
 */

export type ResultatConnexion = {
  ok: boolean;
  message: string;
  latenceMs: number;
};

export async function testerConnexion(params: {
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
}): Promise<ResultatConnexion> {
  const debut = Date.now();
  const { parametresPublics, credentiels } = params;

  try {
    switch (parametresPublics.type) {
      case "wordpress_rest":
        return await testerWordpressRest(parametresPublics, credentiels);
      default:
        return {
          ok: false,
          message: `Test de connexion non encore implémenté pour le type « ${parametresPublics.type} ». L'accès est enregistré, le test réel viendra avec le moteur de remédiation.`,
          latenceMs: Date.now() - debut,
        };
    }
  } catch (e) {
    return {
      ok: false,
      message: `Erreur inattendue : ${e instanceof Error ? e.message : String(e)}`,
      latenceMs: Date.now() - debut,
    };
  }
}

async function testerWordpressRest(
  params: AccesParametresPublics,
  creds: AccesCredentiels,
): Promise<ResultatConnexion> {
  const debut = Date.now();
  if (params.type !== "wordpress_rest" || creds.type !== "wordpress_rest") {
    return {
      ok: false,
      message: "Type incohérent entre paramètres et credentiels.",
      latenceMs: Date.now() - debut,
    };
  }

  const url = params.urlSite.replace(/\/$/, "") + "/wp-json/wp/v2/users/me";
  const authHeader =
    "Basic " +
    Buffer.from(`${params.user}:${creds.applicationPassword}`).toString(
      "base64",
    );

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "User-Agent": "AxiSolver-Security-Shield/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 401) {
      return {
        ok: false,
        message:
          "Identifiants rejetés (401). Vérifier le nom d'utilisateur et le mot de passe applicatif. Les mots de passe applicatifs se créent dans Utilisateurs → Profil → Mots de passe d'application.",
        latenceMs: Date.now() - debut,
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        message:
          "L'API REST WordPress ne répond pas (404). Vérifier que /wp-json est accessible, qu'un plugin ne la désactive pas.",
        latenceMs: Date.now() - debut,
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        message: `WordPress a répondu HTTP ${res.status} ${res.statusText}.`,
        latenceMs: Date.now() - debut,
      };
    }

    const data = (await res.json()) as { capabilities?: Record<string, boolean> };
    const estAdmin =
      data.capabilities?.manage_options === true ||
      data.capabilities?.administrator === true;

    return {
      ok: true,
      message: estAdmin
        ? "Connexion WordPress OK, droits administrateur confirmés."
        : "Connexion WordPress OK, mais l'utilisateur n'a pas les droits d'administration. AXI ne pourra appliquer qu'une partie des remédiations.",
      latenceMs: Date.now() - debut,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Impossible de joindre le site : ${e instanceof Error ? e.message : String(e)}`,
      latenceMs: Date.now() - debut,
    };
  }
}
