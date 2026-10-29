import "server-only";

/**
 * Génère ou patche un vercel.json pour appliquer les en-têtes HTTP de
 * sécurité AXI Security Shield. On privilégie vercel.json (JSON strict)
 * plutôt que next.config.ts (TS parsing complexe) parce que :
 * - vercel.json est 100% déclaratif
 * - Si présent, il override les headers de next.config.ts
 * - Modif = patch JSON simple sans AST
 *
 * Chaque en-tête ajouté par AXI est marqué par la clé 'source' = '/(.*)'
 * et par un commentaire logique via le header "X-Axi-Shield" injecté
 * pour permettre la révocation future.
 */

export type VercelConfig = {
  headers?: Array<{
    source: string;
    headers: Array<{ key: string; value: string }>;
  }>;
  redirects?: Array<{
    source: string;
    destination: string;
    permanent?: boolean;
  }>;
  [key: string]: unknown;
};

export type HeaderPatch = {
  key: string;
  value: string;
};

/** Parse un vercel.json existant (ou retourne un objet vide). */
export function parserVercelJson(contenu: string): VercelConfig {
  const trimmed = contenu.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as VercelConfig;
  } catch {
    return {};
  }
}

/**
 * Applique un ensemble de patchs d'en-têtes AXI dans un vercel.json.
 * Ajoute/met à jour l'entrée headers[source='/(.*)'] en fusionnant les
 * headers déjà présents (en remplaçant ceux de même clé).
 */
export function appliquerHeaders(
  config: VercelConfig,
  patchs: HeaderPatch[],
): VercelConfig {
  const copie: VercelConfig = JSON.parse(JSON.stringify(config));
  if (!Array.isArray(copie.headers)) copie.headers = [];

  const source = "/(.*)";
  let regle = copie.headers.find((h) => h.source === source);
  if (!regle) {
    regle = { source, headers: [] };
    copie.headers.push(regle);
  }

  // Fusion : remplace les headers de même clé, conserve les autres
  const cles = new Set(patchs.map((p) => p.key.toLowerCase()));
  regle.headers = regle.headers.filter(
    (h) => !cles.has(h.key.toLowerCase()),
  );
  for (const p of patchs) {
    regle.headers.push({ key: p.key, value: p.value });
  }

  // Marqueur AXI pour qu'on sache plus tard ce qu'on a mis
  const marqueurPresent = regle.headers.some(
    (h) => h.key.toLowerCase() === "x-axi-shield",
  );
  if (!marqueurPresent) {
    regle.headers.push({ key: "X-Axi-Shield", value: "v1" });
  }

  return copie;
}

/** Retire des en-têtes AXI d'un vercel.json (révocation). */
export function retirerHeaders(
  config: VercelConfig,
  cles: string[],
): VercelConfig {
  const copie: VercelConfig = JSON.parse(JSON.stringify(config));
  if (!Array.isArray(copie.headers)) return copie;
  const clesLower = new Set(cles.map((c) => c.toLowerCase()));
  for (const regle of copie.headers) {
    regle.headers = regle.headers.filter(
      (h) => !clesLower.has(h.key.toLowerCase()),
    );
  }
  // Nettoie les règles vides
  copie.headers = copie.headers.filter((h) => h.headers.length > 0);
  return copie;
}

/** Ajoute une règle de redirection HTTP → HTTPS. */
export function appliquerForceHttps(config: VercelConfig): VercelConfig {
  // Vercel force déjà HTTPS par défaut sur ses domaines, mais on peut
  // ajouter une redirection explicite au cas où le site passe par un
  // reverse-proxy ou un domaine custom mal configuré.
  const copie: VercelConfig = JSON.parse(JSON.stringify(config));
  if (!Array.isArray(copie.redirects)) copie.redirects = [];
  const existe = copie.redirects.some(
    (r) => r.source === "/(.*)" && r.destination?.startsWith("https://"),
  );
  if (!existe) {
    copie.redirects.push({
      source: "/(.*)",
      destination: "https://$1",
      permanent: true,
    });
  }
  return copie;
}

/** Sérialise un vercel.json avec indentation 2 spaces + newline final. */
export function serialiser(config: VercelConfig): string {
  return JSON.stringify(config, null, 2) + "\n";
}

/**
 * Mapping finding_code → en-têtes à ajouter dans vercel.json.
 */
export function headersPourCode(
  code: string,
  options: Record<string, unknown> = {},
): HeaderPatch[] {
  switch (code) {
    case "hsts_absent":
    case "hsts_max_age_court":
    case "hsts_sans_subdomains":
      return [
        {
          key: "Strict-Transport-Security",
          value: `max-age=${options.maxAge ?? 31536000}; includeSubDomains; preload`,
        },
      ];

    case "x_frame_options_absent":
    case "x_frame_options_mal_configure":
      return [
        {
          key: "X-Frame-Options",
          value: String(options.valeur ?? "SAMEORIGIN"),
        },
      ];

    case "x_content_type_options_absent":
      return [{ key: "X-Content-Type-Options", value: "nosniff" }];

    case "referrer_policy_absent":
    case "referrer_policy_faible":
      return [
        {
          key: "Referrer-Policy",
          value: String(
            options.valeur ?? "strict-origin-when-cross-origin",
          ),
        },
      ];

    case "permissions_policy_absent":
      return [
        {
          key: "Permissions-Policy",
          value: String(
            options.valeur ??
              "camera=(), microphone=(), geolocation=(self), payment=()",
          ),
        },
      ];

    case "csp_absent":
      return [
        {
          key: "Content-Security-Policy-Report-Only",
          value: String(
            options.valeur ??
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          ),
        },
      ];

    default:
      return [];
  }
}
