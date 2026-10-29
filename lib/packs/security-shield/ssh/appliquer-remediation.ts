import "server-only";
import type {
  AccesCredentiels,
  AccesParametresPublics,
} from "../acces/types";
import { detecterServeurWeb, executerCommande } from "./client";

export type ResultatRemediationSsh = {
  succes: boolean;
  code: string;
  journal: string;
};

/**
 * Applique une remédiation via SSH sur un serveur distant (VPS/dédié).
 *
 * V1 : dépôt de fichiers simples (robots.txt, security.txt) dans
 * /var/www/html/. Les modifications de config serveur (Nginx/Apache
 * pour les headers HTTP) sont retournées en "nécessite sudo + reload"
 * car risquées à faire automatiquement sans accès root confirmé.
 */
export async function appliquerRemediationSsh(params: {
  parametresPublics: AccesParametresPublics;
  credentiels: AccesCredentiels;
  code: string;
  options?: Record<string, unknown>;
}): Promise<ResultatRemediationSsh> {
  if (
    (params.parametresPublics.type !== "ssh" &&
      params.parametresPublics.type !== "sftp") ||
    (params.credentiels.type !== "ssh" && params.credentiels.type !== "sftp")
  ) {
    return {
      succes: false,
      code: params.code,
      journal: "Type d'accès incohérent (attendu : ssh ou sftp).",
    };
  }

  const connexion = {
    host: params.parametresPublics.host,
    port: params.parametresPublics.port,
    user: params.parametresPublics.user,
    motDePasse:
      "motDePasse" in params.credentiels
        ? params.credentiels.motDePasse
        : undefined,
    clePrivee:
      "clePrivee" in params.credentiels
        ? params.credentiels.clePrivee
        : undefined,
    passphrase:
      "passphrase" in params.credentiels
        ? params.credentiels.passphrase
        : undefined,
  };

  // ─── Remédiations fichiers simples ──────────────────────────────
  if (params.code === "robots_txt_absent") {
    const detect = await detecterServeurWeb(connexion);
    if (!detect.webroot) {
      return {
        succes: false,
        code: params.code,
        journal:
          "Impossible de localiser le webroot (/var/www/html introuvable). Modifie manuellement ou indique le chemin via options.webroot.",
      };
    }
    const contenu = `# AXI Security Shield\nUser-agent: *\nAllow: /\nSitemap: https://${params.parametresPublics.host}/sitemap.xml\n`;
    const cmd = `cat > ${detect.webroot}/robots.txt << 'AXI_EOF'\n${contenu}AXI_EOF`;
    const res = await executerCommande({ ...connexion, commande: cmd });
    if (!res.ok) {
      return {
        succes: false,
        code: params.code,
        journal: `Impossible de déposer robots.txt : ${res.stderr}`,
      };
    }
    return {
      succes: true,
      code: params.code,
      journal: `robots.txt déposé dans ${detect.webroot}/robots.txt (serveur ${detect.serveur}).`,
    };
  }

  if (params.code === "security_txt_absent") {
    const detect = await detecterServeurWeb(connexion);
    if (!detect.webroot) {
      return {
        succes: false,
        code: params.code,
        journal: "Impossible de localiser le webroot.",
      };
    }
    const contact = String(
      params.options?.contact ?? "security@axisolver.app",
    );
    const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000)
      .toISOString()
      .replace(/\.\d+Z$/, "Z");
    const contenu = `Contact: mailto:${contact}\nExpires: ${expires}\nPreferred-Languages: fr, en\n`;
    const cmd = `mkdir -p ${detect.webroot}/.well-known && cat > ${detect.webroot}/.well-known/security.txt << 'AXI_EOF'\n${contenu}AXI_EOF`;
    const res = await executerCommande({ ...connexion, commande: cmd });
    if (!res.ok) {
      return {
        succes: false,
        code: params.code,
        journal: `Impossible de déposer security.txt : ${res.stderr}`,
      };
    }
    return {
      succes: true,
      code: params.code,
      journal: `security.txt déposé dans ${detect.webroot}/.well-known/`,
    };
  }

  // ─── Codes nécessitant modif config serveur (sudo) ──────────────
  const configServeurCodes = [
    "hsts_absent",
    "hsts_max_age_court",
    "hsts_sans_subdomains",
    "x_frame_options_absent",
    "x_frame_options_mal_configure",
    "x_content_type_options_absent",
    "referrer_policy_absent",
    "referrer_policy_faible",
    "permissions_policy_absent",
    "csp_absent",
    "server_version_exposee",
    "x_powered_by_expose",
    "protocole_tls_obsolete",
    "https_non_force",
    "redirect_http_vers_http",
    "http_sert_contenu",
  ];
  if (configServeurCodes.includes(params.code)) {
    return {
      succes: false,
      code: params.code,
      journal:
        "Cette remédiation nécessite une modification de la config Nginx/Apache + reload du serveur, action à faire via sudo. AXI ne l'automatise pas en V1 pour éviter un downtime accidentel. Utilise le rapport pour webmaster pour les snippets exacts.",
    };
  }

  // ─── Codes gérés par Let's Encrypt / infra ──────────────────────
  if (
    params.code === "cert_expire" ||
    params.code === "cert_expiration_imminente" ||
    params.code === "cert_expiration_proche"
  ) {
    const res = await executerCommande({
      ...connexion,
      commande: "command -v certbot && echo __AXI_CERTBOT__",
    });
    if (res.stdout.includes("__AXI_CERTBOT__")) {
      return {
        succes: false,
        code: params.code,
        journal:
          "certbot est installé. Pour renouveler : `sudo certbot renew && sudo systemctl reload nginx` (ou apache2). AXI ne lance pas sudo auto en V1.",
      };
    }
    return {
      succes: false,
      code: params.code,
      journal:
        "certbot pas détecté. Renouvellement SSL à faire manuellement selon le fournisseur de certificat.",
    };
  }

  return {
    succes: false,
    code: params.code,
    journal: `Remédiation « ${params.code} » pas prise en charge en V1 pour SSH générique.`,
  };
}
