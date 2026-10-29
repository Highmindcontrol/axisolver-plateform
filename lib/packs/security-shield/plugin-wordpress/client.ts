import "server-only";
import type {
  AccesCredentiels,
  AccesParametresPublics,
} from "../acces/types";

/**
 * Client HTTP du plugin WordPress AXI Security Shield.
 * Appelle les endpoints /wp-json/axi-shield/v1/* avec authentification
 * Application Password Basic Auth.
 */

export type StatutPlugin = {
  installe: boolean;
  version: string | null;
  wpVersion: string | null;
  isSsl: boolean | null;
  homeUrl: string | null;
};

export type ResultatRemediation = {
  succes: boolean;
  code: string;
  journal: string;
  http?: number;
};

function buildAuth(params: {
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
}): { url: string; headers: Record<string, string> } {
  if (
    params.parametresPublics.type !== "wordpress_rest" ||
    params.credentiels.type !== "wordpress_rest"
  ) {
    throw new Error("Accès non WordPress REST.");
  }
  const base = params.parametresPublics.urlSite.replace(/\/$/, "");
  const auth =
    "Basic " +
    Buffer.from(
      `${params.parametresPublics.user}:${params.credentiels.applicationPassword}`,
    ).toString("base64");
  return {
    url: base,
    headers: {
      Authorization: auth,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "AxiSolver-Security-Shield/1.0",
    },
  };
}

export async function verifierPluginInstalle(params: {
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
}): Promise<StatutPlugin> {
  const { url, headers } = buildAuth(params);
  try {
    const res = await fetch(`${url}/wp-json/axi-shield/v1/status`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) {
      return {
        installe: false,
        version: null,
        wpVersion: null,
        isSsl: null,
        homeUrl: null,
      };
    }
    if (!res.ok) {
      return {
        installe: false,
        version: null,
        wpVersion: null,
        isSsl: null,
        homeUrl: null,
      };
    }
    const data = (await res.json()) as {
      installed?: boolean;
      version?: string;
      wp_version?: string;
      is_ssl?: boolean;
      home_url?: string;
    };
    return {
      installe: data.installed === true,
      version: data.version ?? null,
      wpVersion: data.wp_version ?? null,
      isSsl: data.is_ssl ?? null,
      homeUrl: data.home_url ?? null,
    };
  } catch {
    return {
      installe: false,
      version: null,
      wpVersion: null,
      isSsl: null,
      homeUrl: null,
    };
  }
}

export async function appliquerRemediation(params: {
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
  code: string;
  options?: Record<string, unknown>;
}): Promise<ResultatRemediation> {
  const { url, headers } = buildAuth(params);
  try {
    const res = await fetch(
      `${url}/wp-json/axi-shield/v1/apply/${encodeURIComponent(params.code)}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(params.options ?? {}),
        signal: AbortSignal.timeout(15000),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      applique?: boolean;
      journal?: string;
      message?: string;
    };
    if (!res.ok) {
      return {
        succes: false,
        code: params.code,
        journal:
          data.message ??
          `Le plugin a répondu HTTP ${res.status} ${res.statusText}.`,
        http: res.status,
      };
    }
    return {
      succes: data.applique === true,
      code: params.code,
      journal:
        data.journal ??
        (data.applique
          ? "Remédiation appliquée."
          : "Remédiation non appliquée."),
      http: res.status,
    };
  } catch (e) {
    return {
      succes: false,
      code: params.code,
      journal: `Erreur réseau : ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

export async function revoquerRemediation(params: {
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
  code: string;
}): Promise<ResultatRemediation> {
  const { url, headers } = buildAuth(params);
  try {
    const res = await fetch(
      `${url}/wp-json/axi-shield/v1/revoke/${encodeURIComponent(params.code)}`,
      {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(15000),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      revoque?: boolean;
      journal?: string;
    };
    return {
      succes: data.revoque === true,
      code: params.code,
      journal: data.journal ?? "",
      http: res.status,
    };
  } catch (e) {
    return {
      succes: false,
      code: params.code,
      journal: `Erreur réseau : ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
