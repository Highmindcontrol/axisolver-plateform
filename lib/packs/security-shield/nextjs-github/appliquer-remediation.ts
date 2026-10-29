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

  // ─── Codes inapplicables à Next.js (WordPress / PHP uniquement) ──
  const inapplicableNextjs: Record<string, string> = {
    interfaces_admin_exposees:
      "Cette correction concerne les sites WordPress / PHP (restreindre /wp-admin, /phpmyadmin). Un site Next.js n'expose pas ces chemins — l'audit a probablement remonté un faux positif. Rien à faire côté GitHub.",
    cms_version_exposee:
      "Cette correction concerne WordPress (balise meta generator). Next.js n'ajoute pas de meta generator par défaut, c'est un faux positif de l'audit.",
    csp_report_only:
      "La CSP est actuellement en mode report-only (observation). Pour la basculer en enforce il faut d'abord analyser les violations collectées pendant quelques jours et ajuster la policy. Chantier futur AXI : collecte des rapports via /csp-report + ajustement auto + bascule en enforce.",
    cookie_sans_secure:
      "Cette correction concerne la couche applicative (code qui pose les cookies de session). Pas automatisable via vercel.json. Si tu utilises next-auth, les cookies sont déjà Secure par défaut en production.",
    cookie_sans_httponly:
      "Idem cookies_sans_secure : couche applicative. next-auth et la plupart des libs modernes posent HttpOnly par défaut.",
    cookie_sans_samesite:
      "Idem : couche applicative. next-auth pose SameSite=Lax par défaut.",
    cookie_samesite_none_sans_secure:
      "Couche applicative — à corriger dans le code qui pose le cookie.",
    csp_unsafe_inline:
      "Nécessite un refactor du code (externaliser scripts inline, utiliser des nonces). Pas automatisable via vercel.json — AXI peut t'aider à faire ça dans un PR séparé.",
    csp_unsafe_eval:
      "Nécessite un refactor du code (retirer les eval). Pas automatisable via vercel.json.",
    form_action_http:
      "Correction côté HTML/templates. AXI peut analyser le code source et proposer un PR correctif (chantier futur).",
    target_blank_sans_noopener:
      "Correction côté HTML/MDX. AXI peut analyser les sources et poser un PR (chantier futur).",
    iframes_tiers_sans_sandbox:
      "Correction côté HTML/JSX. AXI peut analyser les composants qui embarquent des iframes (chantier futur).",
    mixed_content:
      "Il faut scanner le code source pour trouver les ressources http://. AXI peut faire ce scan + PR correctif (chantier futur).",
    tls_connexion_impossible:
      "Problème d'infrastructure réseau (DNS, pare-feu, config Vercel). Pas corrigeable automatiquement — vérifier la config du domaine custom dans Vercel.",
    cert_expire:
      "Les certificats SSL sur Vercel sont gérés automatiquement par Let's Encrypt. Si expiration, vérifier le statut du domaine dans Vercel Dashboard.",
    cert_expiration_imminente:
      "Idem : SSL Vercel auto-renouvelé. Vérifier Vercel Dashboard si vraiment urgent.",
    cert_expiration_proche:
      "SSL Vercel auto-renouvelé — rien à faire.",
    san_absent:
      "SSL Vercel gère ça automatiquement.",
    protocole_tls_obsolete:
      "Vercel sert TLS 1.2+1.3 par défaut, pas de config nécessaire.",
    x_powered_by_expose:
      "Next.js masque X-Powered-By par défaut. Si le header est présent, c'est injecté par Vercel — pas de contrôle utilisateur.",
    server_version_exposee:
      "Vercel masque la version serveur. Rien à corriger côté config.",
  };

  if (inapplicableNextjs[params.code]) {
    return {
      succes: false,
      code: params.code,
      journal: inapplicableNextjs[params.code],
    };
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
      journal: `Remédiation « ${params.code} » pas prise en charge pour un site Next.js via GitHub. Vérifie le catalogue de capacités dans la page Sécurité.`,
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
