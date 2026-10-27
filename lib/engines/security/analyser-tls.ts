import * as tls from "node:tls";
import type { FindingSecurity } from "./types";

export type ResultatTls = {
  findings: FindingSecurity[];
  expireeLe: Date | null;
  emetteur: string | null;
};

/**
 * Inspecte le certificat TLS d'un domaine via une connexion directe
 * (port 443). On n'utilise pas fetch car on a besoin des infos du
 * certificat (expiration, émetteur, chaîne).
 *
 * Timeout court (5 s) pour ne pas bloquer l'audit si le serveur
 * refuse la connexion.
 */
export async function analyserTls(hostname: string): Promise<ResultatTls> {
  const findings: FindingSecurity[] = [];

  const cert = await recupererCertificat(hostname);
  if (!cert) {
    findings.push({
      pilier: "tls",
      code: "tls_connexion_impossible",
      severite: "critique",
      message:
        "Impossible d'établir une connexion TLS sur le port 443. Site inaccessible en HTTPS ou pare-feu bloquant.",
    });
    return { findings, expireeLe: null, emetteur: null };
  }

  const expireeLe = cert.valid_to ? new Date(cert.valid_to) : null;
  const emetteurBrut = cert.issuer?.O ?? cert.issuer?.CN ?? null;
  const emetteur = Array.isArray(emetteurBrut)
    ? (emetteurBrut[0] ?? null)
    : emetteurBrut;

  if (expireeLe) {
    const joursRestants = Math.round(
      (expireeLe.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (joursRestants < 0) {
      findings.push({
        pilier: "tls",
        code: "cert_expire",
        severite: "critique",
        message: `Certificat TLS expiré depuis ${Math.abs(joursRestants)} jour(s). Les navigateurs bloqueront l'accès.`,
        details: { expire_le: expireeLe.toISOString(), jours: joursRestants },
      });
    } else if (joursRestants < 7) {
      findings.push({
        pilier: "tls",
        code: "cert_expiration_imminente",
        severite: "critique",
        message: `Certificat TLS expire dans ${joursRestants} jour(s). Action immédiate requise.`,
        details: { expire_le: expireeLe.toISOString(), jours: joursRestants },
      });
    } else if (joursRestants < 30) {
      findings.push({
        pilier: "tls",
        code: "cert_expiration_proche",
        severite: "haute",
        message: `Certificat TLS expire dans ${joursRestants} jours. Renouveler avant expiration.`,
        details: { expire_le: expireeLe.toISOString(), jours: joursRestants },
      });
    }
  }

  if (!cert.subjectaltname) {
    findings.push({
      pilier: "tls",
      code: "san_absent",
      severite: "moyenne",
      message:
        "Certificat sans Subject Alternative Name (SAN). Les navigateurs modernes exigent le SAN pour valider le domaine.",
    });
  }

  const protocole = cert.protocol?.toLowerCase() ?? "";
  if (protocole && !/tlsv1\.[23]/.test(protocole)) {
    findings.push({
      pilier: "tls",
      code: "protocole_tls_obsolete",
      severite: "haute",
      message: `Protocole TLS obsolète (${protocole}). TLS 1.2 ou 1.3 requis — SSLv3, TLS 1.0 et 1.1 sont dépréciés depuis 2020.`,
      details: { protocole },
    });
  }

  return { findings, expireeLe, emetteur };
}

async function recupererCertificat(
  hostname: string,
): Promise<(tls.PeerCertificate & { protocol?: string }) | null> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        {
          host: hostname,
          port: 443,
          servername: hostname,
          rejectUnauthorized: false,
          timeout: 5000,
        },
        () => {
          const cert = socket.getPeerCertificate(true);
          const protocol = socket.getProtocol() ?? undefined;
          socket.end();
          if (!cert || Object.keys(cert).length === 0) {
            resolve(null);
          } else {
            resolve({ ...cert, protocol });
          }
        },
      );
      socket.on("error", () => resolve(null));
      socket.on("timeout", () => {
        socket.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}
