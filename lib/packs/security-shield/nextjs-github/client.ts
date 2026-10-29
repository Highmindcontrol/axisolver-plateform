import "server-only";

/**
 * Client minimaliste de l'API GitHub pour AXI Security Shield.
 * Utilise un Personal Access Token (fine-grained) fourni par
 * l'utilisateur.
 *
 * Pattern d'usage :
 * 1. lireFichier() pour récupérer le contenu actuel + le SHA
 * 2. ecrireFichier() avec le nouveau contenu + le SHA de référence
 *    → commit automatique sur la branche cible
 */

const API = "https://api.github.com";

function entetes(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "AxiSolver-Security-Shield/1.0",
  };
}

export type FichierGithub = {
  existe: boolean;
  contenu: string;
  sha: string | null;
};

export async function lireFichier(params: {
  token: string;
  proprietaire: string;
  repo: string;
  branche: string;
  chemin: string;
}): Promise<FichierGithub> {
  const url = `${API}/repos/${params.proprietaire}/${params.repo}/contents/${encodeURIComponent(
    params.chemin,
  )}?ref=${encodeURIComponent(params.branche)}`;
  const res = await fetch(url, {
    headers: entetes(params.token),
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 404) {
    return { existe: false, contenu: "", sha: null };
  }
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} ${res.statusText} lors de la lecture de ${params.chemin}`);
  }
  const data = (await res.json()) as {
    content?: string;
    encoding?: string;
    sha?: string;
  };
  if (!data.content) {
    return { existe: false, contenu: "", sha: data.sha ?? null };
  }
  const contenu =
    data.encoding === "base64"
      ? Buffer.from(data.content, "base64").toString("utf8")
      : data.content;
  return { existe: true, contenu, sha: data.sha ?? null };
}

export async function ecrireFichier(params: {
  token: string;
  proprietaire: string;
  repo: string;
  branche: string;
  chemin: string;
  contenu: string;
  shaExistant: string | null;
  messageCommit: string;
}): Promise<{ ok: true; sha: string } | { ok: false; raison: string }> {
  const url = `${API}/repos/${params.proprietaire}/${params.repo}/contents/${encodeURIComponent(
    params.chemin,
  )}`;
  const body: Record<string, unknown> = {
    message: params.messageCommit,
    content: Buffer.from(params.contenu, "utf8").toString("base64"),
    branch: params.branche,
  };
  if (params.shaExistant) body.sha = params.shaExistant;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...entetes(params.token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  const data = (await res.json().catch(() => ({}))) as {
    content?: { sha?: string };
    message?: string;
  };
  if (!res.ok) {
    return {
      ok: false,
      raison: data.message ?? `GitHub ${res.status} ${res.statusText}`,
    };
  }
  return { ok: true, sha: data.content?.sha ?? "" };
}

/** Vérifie l'identité et les permissions du token sur le repo cible. */
export async function verifierToken(params: {
  token: string;
  proprietaire: string;
  repo: string;
}): Promise<{
  ok: boolean;
  message: string;
  utilisateur?: string;
  droitsEcriture?: boolean;
}> {
  try {
    const res = await fetch(
      `${API}/repos/${params.proprietaire}/${params.repo}`,
      {
        headers: entetes(params.token),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (res.status === 401) {
      return {
        ok: false,
        message:
          "Token invalide (401). Vérifier que tu l'as copié intégralement et qu'il n'est pas expiré.",
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        message:
          "Repo introuvable (404). Vérifier le propriétaire et le nom du repo, et que le token a accès à ce repo.",
      };
    }
    if (!res.ok) {
      return { ok: false, message: `GitHub ${res.status} ${res.statusText}` };
    }
    const data = (await res.json()) as {
      permissions?: { push?: boolean };
      owner?: { login?: string };
    };
    return {
      ok: true,
      message: data.permissions?.push
        ? "Token OK avec droits d'écriture."
        : "Token OK mais sans droits d'écriture — AXI pourra lire mais pas pousser de commits.",
      utilisateur: data.owner?.login,
      droitsEcriture: data.permissions?.push ?? false,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Erreur réseau : ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
