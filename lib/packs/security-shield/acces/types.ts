/**
 * Types des accès au site utilisables par AXI Security Shield pour
 * exécuter concrètement les remédiations. Discriminated union par
 * champ `type`. Les creds sensibles sont chiffrés en base.
 */

export type AccesTypeId =
  | "ssh"
  | "ftp"
  | "sftp"
  | "wordpress_rest"
  | "cloudflare_api"
  | "cpanel_api"
  | "plesk_api"
  | "github_repo"
  | "shopify_admin"
  | "wix_api"
  | "webflow_api";

/** Paramètres publics (non secrets) — stockés en JSONB clair. */
export type AccesParametresPublics =
  | { type: "ssh"; host: string; port: number; user: string; auth: "cle" | "mot_de_passe" }
  | { type: "ftp"; host: string; port: number; user: string }
  | { type: "sftp"; host: string; port: number; user: string; auth: "cle" | "mot_de_passe" }
  | { type: "wordpress_rest"; urlSite: string; user: string }
  | { type: "cloudflare_api"; zoneId: string; email?: string }
  | { type: "cpanel_api"; host: string; port: number; user: string }
  | { type: "plesk_api"; host: string; port: number; user: string }
  | {
      type: "github_repo";
      proprietaire: string; // ex. "Highmindcontrol"
      repo: string; // ex. "ataraxis-group"
      branche: string; // ex. "main"
      modeCommit: "push_direct" | "pull_request";
    }
  | {
      type: "shopify_admin";
      domaineBoutique: string; // ex. "ma-boutique.myshopify.com"
      versionApi: string; // ex. "2024-10"
    }
  | {
      type: "wix_api";
      siteId: string; // Wix site ID (UUID)
    }
  | {
      type: "webflow_api";
      siteId: string; // Webflow site ID
    };

/** Credentiels sensibles — chiffrés avant stockage. */
export type AccesCredentiels =
  | { type: "ssh"; motDePasse?: string; clePrivee?: string; passphrase?: string }
  | { type: "ftp"; motDePasse: string }
  | { type: "sftp"; motDePasse?: string; clePrivee?: string; passphrase?: string }
  | { type: "wordpress_rest"; applicationPassword: string }
  | { type: "cloudflare_api"; apiToken: string }
  | { type: "cpanel_api"; motDePasse?: string; apiToken?: string }
  | { type: "plesk_api"; motDePasse?: string; apiKey?: string }
  | { type: "github_repo"; personalAccessToken: string }
  | { type: "shopify_admin"; adminApiAccessToken: string }
  | { type: "wix_api"; apiKey: string }
  | { type: "webflow_api"; apiToken: string };

/** Résumé public d'un accès (sans secrets, OK pour UI). */
export type AccesResume = {
  id: string;
  siteId: string;
  type: AccesTypeId;
  libelle: string;
  parametresPublics: AccesParametresPublics;
  actif: boolean;
  derniereConnexionLe: Date | null;
  derniereConnexionOk: boolean | null;
  derniereConnexionErreur: string | null;
  creeLe: Date;
};
