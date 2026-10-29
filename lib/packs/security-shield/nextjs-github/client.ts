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
  // Nettoie le token des espaces/invisibles collés par erreur
  const token = params.token.trim();
  const proprietaire = params.proprietaire.trim();
  const repo = params.repo.trim();

  if (!token || !proprietaire || !repo) {
    return {
      ok: false,
      message: `Paramètre manquant : token=${token ? "OK" : "VIDE"} propriétaire="${proprietaire}" repo="${repo}"`,
    };
  }

  // Pré-check 1 : le token lui-même (y a-t-il un user derrière ?)
  // Un fine-grained PAT a besoin d'accéder à /user ou à une route spécifique.
  // On teste d'abord /repos/{owner}/{repo} et on remonte le vrai message
  // d'erreur de GitHub.
  const url = `${API}/repos/${proprietaire}/${repo}`;
  try {
    const res = await fetch(url, {
      headers: entetes(token),
      signal: AbortSignal.timeout(8000),
    });

    const bodyBrut = await res.text().catch(() => "");
    let messageGithub = "";
    try {
      const parsed = JSON.parse(bodyBrut) as { message?: string };
      messageGithub = parsed.message ?? "";
    } catch {
      messageGithub = bodyBrut.slice(0, 200);
    }

    if (res.status === 401) {
      return {
        ok: false,
        message: `Token invalide (401). GitHub dit : "${messageGithub}". Vérifier que tu l'as copié intégralement et qu'il n'est pas expiré/révoqué.`,
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        message: `GitHub renvoie 404 sur ${url.replace(API, "api.github.com")}. Message GitHub : "${messageGithub}". Causes possibles : (1) propriétaire/repo mal orthographiés (sensibles à la casse), (2) le fine-grained token n'a pas ce repo dans "Only select repositories", (3) la permission "Contents" du token est sur "No access" au lieu de "Read and write".`,
      };
    }
    if (res.status === 403) {
      return {
        ok: false,
        message: `Interdit (403). Message GitHub : "${messageGithub}". Probablement un problème de permissions du token (Contents doit être sur Read and write).`,
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        message: `GitHub ${res.status} ${res.statusText}. Message : "${messageGithub}"`,
      };
    }
    const data = JSON.parse(bodyBrut) as {
      permissions?: { push?: boolean };
      owner?: { login?: string };
    };
    return {
      ok: true,
      message: data.permissions?.push
        ? `Token OK avec droits d'écriture sur ${proprietaire}/${repo}.`
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
