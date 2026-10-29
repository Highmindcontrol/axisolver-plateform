import "server-only";
import type {
  AccesCredentiels,
  AccesParametresPublics,
} from "../acces/types";
import { ecrireFichier, lireFichier } from "./client";
import {
  appliquerForceHttps,
  appliquerHeaders,
  headersPourCode,
  parserVercelJson,
  retirerHeaders,
  serialiser,
} from "./modifier-vercel-json";

export type ResultatRemediationGithub = {
  succes: boolean;
  code: string;
  journal: string;
  commitSha?: string;
};

/**
 * Applique une remédiation sur un site Next.js hébergé via GitHub+Vercel.
 * Patch vercel.json pour les en-têtes HTTP, redirections et robots.txt.
 */
export async function appliquerRemediationGithub(params: {
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
  code: string;
  options?: Record<string, unknown>;
}): Promise<ResultatRemediationGithub> {
  if (
    params.parametresPublics.type !== "github_repo" ||
    params.credentiels.type !== "github_repo"
  ) {
    return {
      succes: false,
      code: params.code,
      journal: "Type d'accès incohérent (attendu : github_repo).",
    };
  }

  const { proprietaire, repo, branche } = params.parametresPublics;
  const token = params.credentiels.personalAccessToken;

  // ─── Cas particulier : robots.txt ───────────────────────────────
  if (params.code === "robots_txt_absent") {
    return await deposerRobotsTxt({
      token,
      proprietaire,
      repo,
      branche,
    });
  }

  // ─── Cas particulier : security.txt ─────────────────────────────
  if (params.code === "security_txt_absent") {
    return await deposerSecurityTxt({
      token,
      proprietaire,
      repo,
      branche,
      options: params.options ?? {},
    });
  }

  // ─── Headers HTTP via vercel.json ────────────────────────────────
  const patchs = headersPourCode(params.code, params.options ?? {});
  const estForceHttps =
    params.code === "https_non_force" ||
    params.code === "redirect_http_vers_http" ||
    params.code === "http_sert_contenu";

  if (patchs.length === 0 && !estForceHttps) {
    return {
      succes: false,
      code: params.code,
      journal: `Remédiation « ${params.code} » pas (encore) implémentée côté Next.js/GitHub.`,
    };
  }

  try {
    const fichier = await lireFichier({
      token,
      proprietaire,
      repo,
      branche,
      chemin: "vercel.json",
    });

    let config = parserVercelJson(fichier.contenu);
    if (patchs.length > 0) config = appliquerHeaders(config, patchs);
    if (estForceHttps) config = appliquerForceHttps(config);

    const nouveauContenu = serialiser(config);
    const ecriture = await ecrireFichier({
      token,
      proprietaire,
      repo,
      branche,
      chemin: "vercel.json",
      contenu: nouveauContenu,
      shaExistant: fichier.sha,
      messageCommit: `chore(security): AXI Shield applique ${params.code}`,
    });

    if (!ecriture.ok) {
      return {
        succes: false,
        code: params.code,
        journal: `Commit refusé par GitHub : ${ecriture.raison}`,
      };
    }

    return {
      succes: true,
      code: params.code,
      journal: `vercel.json mis à jour (commit ${ecriture.sha.slice(0, 7)}). Vercel va redéployer automatiquement dans ~1 min.`,
      commitSha: ecriture.sha,
    };
  } catch (e) {
    return {
      succes: false,
      code: params.code,
      journal: `Erreur : ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

async function deposerRobotsTxt(params: {
  token: string;
  proprietaire: string;
  repo: string;
  branche: string;
}): Promise<ResultatRemediationGithub> {
  const chemin = "public/robots.txt";
  const existant = await lireFichier({ ...params, chemin });
  if (existant.existe) {
    return {
      succes: false,
      code: "robots_txt_absent",
      journal:
        "Un fichier public/robots.txt existe déjà dans le repo. Rien à ajouter.",
    };
  }
  const contenu = `User-agent: *\nAllow: /\n\nSitemap: https://${params.repo}.vercel.app/sitemap.xml\n`;
  const ecriture = await ecrireFichier({
    ...params,
    chemin,
    contenu,
    shaExistant: null,
    messageCommit: "chore(security): AXI Shield ajoute public/robots.txt",
  });
  if (!ecriture.ok) {
    return {
      succes: false,
      code: "robots_txt_absent",
      journal: `Commit refusé : ${ecriture.raison}`,
    };
  }
  return {
    succes: true,
    code: "robots_txt_absent",
    journal: `public/robots.txt créé (commit ${ecriture.sha.slice(0, 7)}).`,
    commitSha: ecriture.sha,
  };
}

async function deposerSecurityTxt(params: {
  token: string;
  proprietaire: string;
  repo: string;
  branche: string;
  options: Record<string, unknown>;
}): Promise<ResultatRemediationGithub> {
  const chemin = "public/.well-known/security.txt";
  const existant = await lireFichier({ ...params, chemin });
  if (existant.existe) {
    return {
      succes: false,
      code: "security_txt_absent",
      journal: "Un fichier security.txt existe déjà. Rien à ajouter.",
    };
  }
  const contact = String(params.options.contact ?? "security@axisolver.app");
  const expires =
    String(params.options.expires ?? "") ||
    new Date(Date.now() + 365 * 24 * 3600 * 1000)
      .toISOString()
      .replace(/\.\d+Z$/, "Z");

  const contenu = [
    `Contact: mailto:${contact}`,
    `Expires: ${expires}`,
    "Preferred-Languages: fr, en",
    "",
  ].join("\n");

  const ecriture = await ecrireFichier({
    ...params,
    chemin,
    contenu,
    shaExistant: null,
    messageCommit:
      "chore(security): AXI Shield ajoute public/.well-known/security.txt",
  });
  if (!ecriture.ok) {
    return {
      succes: false,
      code: "security_txt_absent",
      journal: `Commit refusé : ${ecriture.raison}`,
    };
  }
  return {
    succes: true,
    code: "security_txt_absent",
    journal: `public/.well-known/security.txt créé (commit ${ecriture.sha.slice(0, 7)}).`,
    commitSha: ecriture.sha,
  };
}
