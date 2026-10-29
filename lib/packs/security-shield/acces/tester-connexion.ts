import "server-only";
import type { AccesCredentiels, AccesParametresPublics } from "./types";
import { verifierToken } from "../nextjs-github/client";
import { verifierBoutique } from "../shopify/client";
import { verifierTokenWix } from "../wix/appliquer-remediation";
import { verifierTokenWebflow } from "../webflow/appliquer-remediation";
import { verifierConnexion as verifierSsh } from "../ssh/client";

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
      case "github_repo":
        return await testerGithubRepo(parametresPublics, credentiels, debut);
      case "shopify_admin":
        return await testerShopify(parametresPublics, credentiels, debut);
      case "wix_api":
        return await testerWix(parametresPublics, credentiels, debut);
      case "webflow_api":
        return await testerWebflow(parametresPublics, credentiels, debut);
      case "ssh":
      case "sftp":
        return await testerSshSftp(parametresPublics, credentiels, debut);
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

async function testerGithubRepo(
  params: AccesParametresPublics,
  creds: AccesCredentiels,
  debut: number,
): Promise<ResultatConnexion> {
  if (params.type !== "github_repo" || creds.type !== "github_repo") {
    return {
      ok: false,
      message: "Type incohérent.",
      latenceMs: Date.now() - debut,
    };
  }
  const res = await verifierToken({
    token: creds.personalAccessToken,
    proprietaire: params.proprietaire,
    repo: params.repo,
  });
  return {
    ok: res.ok && res.droitsEcriture === true,
    message: res.message,
    latenceMs: Date.now() - debut,
  };
}

async function testerShopify(
  params: AccesParametresPublics,
  creds: AccesCredentiels,
  debut: number,
): Promise<ResultatConnexion> {
  if (params.type !== "shopify_admin" || creds.type !== "shopify_admin") {
    return {
      ok: false,
      message: "Type incohérent.",
      latenceMs: Date.now() - debut,
    };
  }
  const res = await verifierBoutique({
    domaineBoutique: params.domaineBoutique,
    versionApi: params.versionApi,
    token: creds.adminApiAccessToken,
  });
  return {
    ok: res.ok,
    message: res.message,
    latenceMs: Date.now() - debut,
  };
}

async function testerWix(
  params: AccesParametresPublics,
  creds: AccesCredentiels,
  debut: number,
): Promise<ResultatConnexion> {
  if (params.type !== "wix_api" || creds.type !== "wix_api") {
    return {
      ok: false,
      message: "Type incohérent.",
      latenceMs: Date.now() - debut,
    };
  }
  const res = await verifierTokenWix({
    siteId: params.siteId,
    apiKey: creds.apiKey,
  });
  return {
    ok: res.ok,
    message: res.message,
    latenceMs: Date.now() - debut,
  };
}

async function testerWebflow(
  params: AccesParametresPublics,
  creds: AccesCredentiels,
  debut: number,
): Promise<ResultatConnexion> {
  if (params.type !== "webflow_api" || creds.type !== "webflow_api") {
    return {
      ok: false,
      message: "Type incohérent.",
      latenceMs: Date.now() - debut,
    };
  }
  const res = await verifierTokenWebflow({
    siteId: params.siteId,
    apiToken: creds.apiToken,
  });
  return {
    ok: res.ok,
    message: res.message,
    latenceMs: Date.now() - debut,
  };
}

async function testerSshSftp(
  params: AccesParametresPublics,
  creds: AccesCredentiels,
  debut: number,
): Promise<ResultatConnexion> {
  if (
    (params.type !== "ssh" && params.type !== "sftp") ||
    (creds.type !== "ssh" && creds.type !== "sftp")
  ) {
    return {
      ok: false,
      message: "Type incohérent.",
      latenceMs: Date.now() - debut,
    };
  }
  const res = await verifierSsh({
    host: params.host,
    port: params.port,
    user: params.user,
    motDePasse: "motDePasse" in creds ? creds.motDePasse : undefined,
    clePrivee: "clePrivee" in creds ? creds.clePrivee : undefined,
    passphrase: "passphrase" in creds ? creds.passphrase : undefined,
    timeoutMs: 10000,
  });
  return {
    ok: res.ok,
    message: res.systeme
      ? `${res.message}. Système : ${res.systeme}`
      : res.message,
    latenceMs: Date.now() - debut,
  };
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
