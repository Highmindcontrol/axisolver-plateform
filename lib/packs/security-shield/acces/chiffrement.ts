import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Chiffrement AES-256-GCM pour les credentiels d'accès au site.
 * La clé maîtresse est lue depuis SECURITY_SHIELD_ENCRYPTION_KEY
 * (32 bytes en base64, générée une fois pour toute l'infra).
 *
 * À chaque chiffrement, un IV aléatoire 12 bytes est généré ; il est
 * stocké en clair avec le tag d'authentification 16 bytes dans la
 * colonne credentiels_meta JSONB. Seul le ciphertext est stocké en
 * bytea.
 */

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // bytes — recommandé GCM
const TAG_LENGTH = 16; // bytes

export type Chiffre = {
  ciphertext: Buffer;
  iv: string; // base64
  tag: string; // base64
};

function cleMaitresse(): Buffer {
  const brut = process.env.SECURITY_SHIELD_ENCRYPTION_KEY;
  if (!brut) {
    throw new Error(
      "SECURITY_SHIELD_ENCRYPTION_KEY manquante dans les variables d'env.",
    );
  }
  const cle = Buffer.from(brut, "base64");
  if (cle.length !== 32) {
    throw new Error(
      `SECURITY_SHIELD_ENCRYPTION_KEY doit faire 32 bytes (256 bits) en base64, reçu ${cle.length}.`,
    );
  }
  return cle;
}

export function chiffrer(donnees: string): Chiffre {
  const cle = cleMaitresse();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, cle, iv, {
    authTagLength: TAG_LENGTH,
  });
  const ciphertext = Buffer.concat([
    cipher.update(donnees, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function dechiffrer(
  ciphertext: Buffer,
  iv: string,
  tag: string,
): string {
  const cle = cleMaitresse();
  const decipher = createDecipheriv(
    ALGO,
    cle,
    Buffer.from(iv, "base64"),
    { authTagLength: TAG_LENGTH },
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const clair = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return clair.toString("utf8");
}

/** Utilitaire pour générer une clé maîtresse (à exécuter 1x). */
export function genererCleMaitresseBase64(): string {
  return randomBytes(32).toString("base64");
}
