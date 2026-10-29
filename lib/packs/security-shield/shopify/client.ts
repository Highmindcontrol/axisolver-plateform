import "server-only";

/**
 * Client minimaliste de l'API Shopify Admin REST.
 * Authentification : custom app Admin API access token (créé depuis
 * l'admin Shopify par le client, scope read_themes + write_themes).
 */

export type ShopifyFetchParams = {
  domaineBoutique: string; // "ma-boutique.myshopify.com"
  versionApi: string; // "2024-10"
  token: string;
};

function headers(token: string): HeadersInit {
  return {
    "X-Shopify-Access-Token": token,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "AxiSolver-Security-Shield/1.0",
  };
}

export async function verifierBoutique(params: ShopifyFetchParams): Promise<{
  ok: boolean;
  message: string;
  nomBoutique?: string;
  domaine?: string;
}> {
  const url = `https://${params.domaineBoutique}/admin/api/${params.versionApi}/shop.json`;
  try {
    const res = await fetch(url, {
      headers: headers(params.token),
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message:
          "Token refusé (" +
          res.status +
          "). Vérifier que l'Admin API access token est correct et que l'app a les scopes read_themes + write_themes + read_content + write_content.",
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        message:
          "Boutique introuvable. Vérifier le domaine (format .myshopify.com) et la version d'API.",
      };
    }
    if (!res.ok) {
      return { ok: false, message: `Shopify ${res.status} ${res.statusText}` };
    }
    const data = (await res.json()) as { shop?: { name?: string; domain?: string } };
    return {
      ok: true,
      message: `Connecté à la boutique « ${data.shop?.name} » (${data.shop?.domain}).`,
      nomBoutique: data.shop?.name,
      domaine: data.shop?.domain,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Erreur réseau : ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/** Récupère l'ID du thème publié (actif). */
export async function recupererThemePublie(
  params: ShopifyFetchParams,
): Promise<{ id: number; nom: string } | null> {
  const url = `https://${params.domaineBoutique}/admin/api/${params.versionApi}/themes.json`;
  try {
    const res = await fetch(url, {
      headers: headers(params.token),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      themes?: Array<{ id: number; name: string; role: string }>;
    };
    const main = data.themes?.find((t) => t.role === "main");
    return main ? { id: main.id, nom: main.name } : null;
  } catch {
    return null;
  }
}

/** Lit un asset (fichier) d'un thème Shopify. */
export async function lireAsset(
  params: ShopifyFetchParams & { themeId: number; cheminAsset: string },
): Promise<{ existe: boolean; valeur: string }> {
  const url = `https://${params.domaineBoutique}/admin/api/${params.versionApi}/themes/${params.themeId}/assets.json?asset[key]=${encodeURIComponent(params.cheminAsset)}`;
  const res = await fetch(url, {
    headers: headers(params.token),
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 404) return { existe: false, valeur: "" };
  if (!res.ok) throw new Error(`Shopify ${res.status} sur ${params.cheminAsset}`);
  const data = (await res.json()) as { asset?: { value?: string } };
  return { existe: true, valeur: data.asset?.value ?? "" };
}

/** Crée ou modifie un asset dans un thème Shopify. */
export async function ecrireAsset(
  params: ShopifyFetchParams & {
    themeId: number;
    cheminAsset: string;
    contenu: string;
  },
): Promise<{ ok: true } | { ok: false; raison: string }> {
  const url = `https://${params.domaineBoutique}/admin/api/${params.versionApi}/themes/${params.themeId}/assets.json`;
  const res = await fetch(url, {
    method: "PUT",
    headers: headers(params.token),
    body: JSON.stringify({
      asset: {
        key: params.cheminAsset,
        value: params.contenu,
      },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return {
      ok: false,
      raison: `Shopify ${res.status} ${res.statusText} : ${detail.slice(0, 200)}`,
    };
  }
  return { ok: true };
}
