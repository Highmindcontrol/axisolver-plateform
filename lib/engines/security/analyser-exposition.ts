import type { FindingSecurity } from "./types";

/**
 * Vérifie si des chemins sensibles sont exposés publiquement.
 * Scope minimum : fichiers critiques (.env, .git/config, .DS_Store),
 * répertoires d'admin standards (/wp-admin, /administrator) et fichiers
 * d'inventaire SEO (/robots.txt, /sitemap.xml, /.well-known/security.txt).
 *
 * On fait des HEAD requests parallélisés avec timeout court. Un 200 OK
 * sur .env ou .git/config = finding critique immédiat.
 */
export async function analyserExposition(params: {
  baseUrl: string;
}): Promise<FindingSecurity[]> {
  const { baseUrl } = params;
  const findings: FindingSecurity[] = [];

  const base = baseUrl.replace(/\/$/, "");

  // ─── Fichiers critiques (fuite de secrets) ───────────────────────
  const fichiersCritiques: Array<{ chemin: string; nom: string }> = [
    { chemin: "/.env", nom: ".env" },
    { chemin: "/.env.local", nom: ".env.local" },
    { chemin: "/.env.production", nom: ".env.production" },
    { chemin: "/.git/config", nom: ".git/config" },
    { chemin: "/.git/HEAD", nom: ".git/HEAD" },
    { chemin: "/.DS_Store", nom: ".DS_Store" },
    { chemin: "/wp-config.php.bak", nom: "wp-config.php.bak" },
    { chemin: "/config.php.bak", nom: "config.php.bak" },
    { chemin: "/backup.sql", nom: "backup.sql" },
    { chemin: "/database.sql", nom: "database.sql" },
  ];

  const resultatsCritiques = await Promise.all(
    fichiersCritiques.map(async (f) => {
      const expose = await tester(base + f.chemin);
      return { ...f, expose };
    }),
  );

  for (const r of resultatsCritiques) {
    if (r.expose) {
      findings.push({
        pilier: "exposition",
        code: `fichier_critique_${r.nom.replace(/[^a-z0-9]/gi, "_")}`,
        severite: "critique",
        message: `Fichier sensible publiquement accessible : ${r.chemin}. Peut contenir des secrets (clés API, mots de passe, config). À bloquer IMMÉDIATEMENT.`,
        details: { chemin: r.chemin },
      });
    }
  }

  // ─── Admin standards (information disclosure) ────────────────────
  const admins = [
    "/wp-admin/",
    "/wp-login.php",
    "/administrator/",
    "/admin/",
    "/phpmyadmin/",
    "/pma/",
  ];
  const resultatsAdmin = await Promise.all(
    admins.map(async (a) => ({ chemin: a, expose: await tester(base + a) })),
  );
  const adminsExposes = resultatsAdmin.filter((r) => r.expose);
  if (adminsExposes.length > 0) {
    findings.push({
      pilier: "exposition",
      code: "interfaces_admin_exposees",
      severite: "moyenne",
      message: `Interface(s) d'administration accessible(s) publiquement : ${adminsExposes
        .map((a) => a.chemin)
        .join(", ")}. Restreindre par IP, VPN ou authentification à deux facteurs.`,
      details: { chemins: adminsExposes.map((a) => a.chemin) },
    });
  }

  // ─── Fichiers SEO/standards (info seulement) ────────────────────
  const robots = await tester(base + "/robots.txt");
  if (!robots) {
    findings.push({
      pilier: "exposition",
      code: "robots_txt_absent",
      severite: "info",
      message:
        "Fichier robots.txt absent. Peu critique en sécurité, mais recommandé pour contrôler le crawl des bots.",
    });
  }

  const securityTxt = await tester(base + "/.well-known/security.txt");
  if (!securityTxt) {
    findings.push({
      pilier: "exposition",
      code: "security_txt_absent",
      severite: "basse",
      message:
        "Fichier /.well-known/security.txt absent. Recommandé par RFC 9116 pour permettre aux chercheurs en sécurité de vous contacter.",
    });
  }

  return findings;
}

async function tester(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": "AxiSolver-Security-Bot/1.0 (+https://axisolver.app)",
      },
      signal: AbortSignal.timeout(4000),
    });
    // 200 OK ou 403 Forbidden avec corps = chemin existant.
    // 404/301/302 = pas exposé publiquement.
    if (res.status === 200) return true;
    if (res.status === 403) {
      // Certains serveurs renvoient 403 pour les fichiers existants.
      // On compte comme exposé car un attaquant sait que la ressource existe.
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
