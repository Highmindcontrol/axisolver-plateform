import "server-only";
import { Client } from "ssh2";

/**
 * Client SSH minimal pour AXI Security Shield. Permet de se connecter
 * à un serveur distant (VPS/dédié), exécuter des commandes, et uploader
 * des fichiers dans un webroot.
 */

export type SshConnexionParams = {
  host: string;
  port: number;
  user: string;
  motDePasse?: string;
  clePrivee?: string; // contenu PEM de la clé privée
  passphrase?: string; // passphrase si clé privée protégée
  timeoutMs?: number;
};

export type ResultatCommandeSsh = {
  ok: boolean;
  stdout: string;
  stderr: string;
  codeSortie: number | null;
};

/**
 * Exécute une commande shell distante et retourne stdout/stderr.
 */
export function executerCommande(
  params: SshConnexionParams & { commande: string },
): Promise<ResultatCommandeSsh> {
  const timeout = params.timeoutMs ?? 15000;
  return new Promise((resolve) => {
    const conn = new Client();
    let stdout = "";
    let stderr = "";
    let timeoutId: NodeJS.Timeout | undefined;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        conn.end();
      } catch {
        /* ignore */
      }
    };

    timeoutId = setTimeout(() => {
      cleanup();
      resolve({
        ok: false,
        stdout,
        stderr: `Timeout après ${timeout}ms`,
        codeSortie: null,
      });
    }, timeout);

    conn.on("ready", () => {
      conn.exec(params.commande, (err, stream) => {
        if (err) {
          cleanup();
          resolve({
            ok: false,
            stdout,
            stderr: err.message,
            codeSortie: null,
          });
          return;
        }
        stream.on("close", (code: number | null) => {
          cleanup();
          resolve({
            ok: code === 0,
            stdout,
            stderr,
            codeSortie: code,
          });
        });
        stream.on("data", (data: Buffer) => {
          stdout += data.toString("utf8");
        });
        stream.stderr.on("data", (data: Buffer) => {
          stderr += data.toString("utf8");
        });
      });
    });

    conn.on("error", (err) => {
      cleanup();
      resolve({
        ok: false,
        stdout,
        stderr: `Connexion SSH échouée : ${err.message}`,
        codeSortie: null,
      });
    });

    const connectOpts: Record<string, unknown> = {
      host: params.host,
      port: params.port,
      username: params.user,
      readyTimeout: timeout,
    };
    if (params.clePrivee) {
      connectOpts.privateKey = params.clePrivee;
      if (params.passphrase) connectOpts.passphrase = params.passphrase;
    } else if (params.motDePasse) {
      connectOpts.password = params.motDePasse;
    }

    try {
      conn.connect(connectOpts);
    } catch (e) {
      cleanup();
      resolve({
        ok: false,
        stdout,
        stderr: `Erreur connexion : ${e instanceof Error ? e.message : String(e)}`,
        codeSortie: null,
      });
    }
  });
}

/**
 * Vérifie la connectivité SSH basique en exécutant `uname -a`.
 */
export async function verifierConnexion(
  params: SshConnexionParams,
): Promise<{ ok: boolean; message: string; systeme?: string }> {
  const res = await executerCommande({ ...params, commande: "uname -a" });
  if (!res.ok) {
    return { ok: false, message: res.stderr || "Connexion SSH impossible" };
  }
  return {
    ok: true,
    message: `SSH OK sur ${params.host}`,
    systeme: res.stdout.trim(),
  };
}

/**
 * Détecte le serveur web présent (Nginx ou Apache) et retourne son
 * nom + le chemin webroot standard associé.
 */
export async function detecterServeurWeb(
  params: SshConnexionParams,
): Promise<{
  serveur: "nginx" | "apache" | "aucun";
  webroot: string | null;
}> {
  const res = await executerCommande({
    ...params,
    commande:
      "command -v nginx && echo __AXI_NGINX__; command -v apache2 && echo __AXI_APACHE__; command -v httpd && echo __AXI_APACHE__; ls -d /var/www/html 2>/dev/null && echo __AXI_WWW__",
  });
  const serveur: "nginx" | "apache" | "aucun" = res.stdout.includes(
    "__AXI_NGINX__",
  )
    ? "nginx"
    : res.stdout.includes("__AXI_APACHE__")
      ? "apache"
      : "aucun";
  const webroot = res.stdout.includes("__AXI_WWW__") ? "/var/www/html" : null;
  return { serveur, webroot };
}
