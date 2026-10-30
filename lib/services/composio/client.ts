import "server-only";

/**
 * Wrapper Composio V1 — fetch direct vers l'API REST publique.
 *
 * Pas de SDK pour éviter le poids d'une dépendance supplémentaire —
 * l'API Composio est stable et REST-friendly. Si le SDK officiel
 * devient incontournable (streaming, cache local), on migre dans
 * un lot 2.
 *
 * Doctrine : zéro token stocké chez nous. Composio garde les tokens
 * OAuth des outils tiers. On garde seulement l'ID de connexion
 * Composio (`composio_connection_id`) et on l'utilise pour tous nos
 * appels. Si l'utilisateur révoque, c'est côté Composio qui gère.
 *
 * Variable d'environnement requise :
 *   - COMPOSIO_API_KEY : clé API Composio (plan Pro)
 *   - COMPOSIO_BASE_URL (optionnel, défaut https://backend.composio.dev)
 */

const BASE_URL =
  process.env.COMPOSIO_BASE_URL ?? "https://backend.composio.dev";

function cleApiOrThrow(): string {
  const cle = process.env.COMPOSIO_API_KEY;
  if (!cle) {
    throw new Error(
      "[composio] COMPOSIO_API_KEY manquante dans l'environnement serveur.",
    );
  }
  return cle;
}

async function appelerApi<T>(
  chemin: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${chemin}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      "x-api-key": cleApiOrThrow(),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(
      `[composio] ${resp.status} ${resp.statusText} : ${detail.slice(0, 300)}`,
    );
  }
  return (await resp.json()) as T;
}

/* ─── 1. Lister les apps disponibles (debug / admin) ─────────── */

export type AppComposio = {
  key: string;
  name: string;
  description: string;
  logo: string;
  categories: string[];
};

export async function listerApps(): Promise<AppComposio[]> {
  const data = await appelerApi<{ items?: AppComposio[] }>("/api/v1/apps");
  return data.items ?? [];
}

/* ─── 2. Démarrer un flow OAuth pour un utilisateur ──────────── */

export type ConnexionInitiee = {
  connectionId: string;
  redirectUrl: string;
};

/**
 * Initie une connexion OAuth pour un connecteur donné. Retourne
 * l'URL de redirection vers laquelle envoyer l'utilisateur. Après
 * autorisation, Composio redirige vers notre `redirectUri`.
 */
export async function initierConnexion(params: {
  appSlug: string;
  entityId: string;
  redirectUri: string;
}): Promise<ConnexionInitiee> {
  const data = await appelerApi<{
    connectedAccountId: string;
    redirectUrl: string;
  }>("/api/v1/connectedAccounts", {
    method: "POST",
    body: JSON.stringify({
      appName: params.appSlug,
      entityId: params.entityId,
      redirectUri: params.redirectUri,
    }),
  });
  return {
    connectionId: data.connectedAccountId,
    redirectUrl: data.redirectUrl,
  };
}

/* ─── 3. Vérifier l'état d'une connexion ─────────────────────── */

export type EtatConnexion = {
  connectionId: string;
  status: "pending" | "active" | "revoked" | "expired" | "erreur";
  appSlug: string;
  scopes: string[];
  connecteLe?: string;
  expireLe?: string;
};

export async function lireEtatConnexion(
  connectionId: string,
): Promise<EtatConnexion> {
  const data = await appelerApi<{
    id: string;
    status: EtatConnexion["status"];
    appName: string;
    scopes?: string[];
    createdAt?: string;
    expiresAt?: string;
  }>(`/api/v1/connectedAccounts/${encodeURIComponent(connectionId)}`);
  return {
    connectionId: data.id,
    status: data.status,
    appSlug: data.appName,
    scopes: data.scopes ?? [],
    connecteLe: data.createdAt,
    expireLe: data.expiresAt,
  };
}

/* ─── 4. Révoquer une connexion ──────────────────────────────── */

export async function revoquerConnexion(connectionId: string): Promise<void> {
  await appelerApi<void>(
    `/api/v1/connectedAccounts/${encodeURIComponent(connectionId)}`,
    { method: "DELETE" },
  );
}

/* ─── 5. Appeler un tool (le cœur) ───────────────────────────── */

/**
 * Appelle une action Composio au nom de l'utilisateur connecté.
 * Ex: `executerTool({ action: "HUBSPOT_CREATE_CONTACT", connectionId,
 * params: { email: "x@y.z", firstname: "..." } })`.
 *
 * NB : la liste des actions disponibles pour chaque connecteur est
 * dans la doc Composio. On ne la hardcode pas ici — chaque pack
 * métier déclare ses actions dans son propre module.
 */
export async function executerTool(params: {
  action: string;
  connectionId: string;
  params: Record<string, unknown>;
}): Promise<{
  successful: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  const data = await appelerApi<{
    successful: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }>(`/api/v2/actions/${encodeURIComponent(params.action)}/execute`, {
    method: "POST",
    body: JSON.stringify({
      connectedAccountId: params.connectionId,
      input: params.params,
    }),
  });
  return data;
}

/* ─── 6. Lister les connexions actives d'un utilisateur ──────── */

export async function listerConnexionsUtilisateur(
  entityId: string,
): Promise<EtatConnexion[]> {
  const data = await appelerApi<{
    items?: Array<{
      id: string;
      status: EtatConnexion["status"];
      appName: string;
      scopes?: string[];
      createdAt?: string;
      expiresAt?: string;
    }>;
  }>(
    `/api/v1/connectedAccounts?entityId=${encodeURIComponent(entityId)}`,
  );
  return (data.items ?? []).map((r) => ({
    connectionId: r.id,
    status: r.status,
    appSlug: r.appName,
    scopes: r.scopes ?? [],
    connecteLe: r.createdAt,
    expireLe: r.expiresAt,
  }));
}
