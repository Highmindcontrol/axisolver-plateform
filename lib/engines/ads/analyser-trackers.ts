import type { FindingAds, TrackerDetecte } from "./types";

/**
 * Détecte la présence de trackers analytics, publicitaires et de
 * remarketing dans le HTML d'une page. Base la détection sur les
 * fingerprints classiques (scripts src, globales JS, IDs de compte
 * visibles dans le source).
 *
 * Retourne la liste des trackers trouvés + les findings sur ce qui
 * manque (ex. pas de GA4 détecté = finding haute sévérité).
 */

type Fingerprint = {
  code: string;
  nom: string;
  categorie: TrackerDetecte["categorie"];
  patterns: RegExp[];
  /** Regex capturant l'ID de compte s'il est présent (ex. G-XXX, GTM-XXX, UA-XXX, pixel ID). */
  idPattern?: RegExp;
};

const FINGERPRINTS: Fingerprint[] = [
  // ─── Analytics ────────────────────────────────────────────────
  {
    code: "ga4",
    nom: "Google Analytics 4",
    categorie: "analytics",
    patterns: [
      /googletagmanager\.com\/gtag\/js\?id=G-/,
      /gtag\(['"]config['"],\s*['"]G-/,
      /\bG-[A-Z0-9]{10}\b/,
    ],
    idPattern: /\bG-[A-Z0-9]{10}\b/,
  },
  {
    code: "ua",
    nom: "Universal Analytics (déprécié)",
    categorie: "analytics",
    patterns: [
      /www\.google-analytics\.com\/analytics\.js/,
      /\bUA-\d{4,10}-\d+\b/,
    ],
    idPattern: /\bUA-\d{4,10}-\d+\b/,
  },
  {
    code: "gtm",
    nom: "Google Tag Manager",
    categorie: "analytics",
    patterns: [
      /googletagmanager\.com\/gtm\.js\?id=GTM-/,
      /\bGTM-[A-Z0-9]{6,8}\b/,
    ],
    idPattern: /\bGTM-[A-Z0-9]{6,8}\b/,
  },
  {
    code: "matomo",
    nom: "Matomo",
    categorie: "analytics",
    patterns: [/matomo\.(js|php)/i, /_paq\.push/],
  },
  {
    code: "plausible",
    nom: "Plausible",
    categorie: "analytics",
    patterns: [/plausible\.io\/js/, /data-domain=/i],
  },

  // ─── Publicité / Remarketing ──────────────────────────────────
  {
    code: "google_ads",
    nom: "Google Ads / AdWords",
    categorie: "publicite",
    patterns: [
      /googletagmanager\.com\/gtag\/js\?id=AW-/,
      /\bAW-\d{9,11}\b/,
      /googleadservices\.com\/pagead\/conversion/,
    ],
    idPattern: /\bAW-\d{9,11}\b/,
  },
  {
    code: "meta_pixel",
    nom: "Meta Pixel (Facebook / Instagram)",
    categorie: "remarketing",
    patterns: [
      /connect\.facebook\.net\/.*\/fbevents\.js/,
      /fbq\(['"]init['"],\s*['"]/,
      /facebook\.com\/tr\?id=/,
    ],
    idPattern: /fbq\(['"]init['"],\s*['"](\d{15,16})['"]/,
  },
  {
    code: "linkedin_insight",
    nom: "LinkedIn Insight Tag",
    categorie: "remarketing",
    patterns: [
      /snap\.licdn\.com\/li\.lms-analytics\/insight\.min\.js/,
      /_linkedin_partner_id/,
    ],
    idPattern: /_linkedin_partner_id\s*=\s*["'](\d+)["']/,
  },
  {
    code: "tiktok_pixel",
    nom: "TikTok Pixel",
    categorie: "remarketing",
    patterns: [/analytics\.tiktok\.com\/i18n\/pixel/, /ttq\.load\(/],
    idPattern: /ttq\.load\(['"]([A-Z0-9]+)['"]/,
  },
  {
    code: "pinterest_tag",
    nom: "Pinterest Tag",
    categorie: "remarketing",
    patterns: [/s\.pinimg\.com\/ct\/core\.js/, /pintrk\(/],
    idPattern: /pintrk\(['"]load['"],\s*['"](\d+)['"]/,
  },
  {
    code: "microsoft_uet",
    nom: "Microsoft Advertising UET",
    categorie: "publicite",
    patterns: [/bat\.bing\.com\/bat\.js/, /\bUET\b/],
  },
  {
    code: "twitter_pixel",
    nom: "X / Twitter Pixel",
    categorie: "remarketing",
    patterns: [/static\.ads-twitter\.com\/uwt\.js/, /twq\(/],
  },
  {
    code: "snapchat_pixel",
    nom: "Snapchat Pixel",
    categorie: "remarketing",
    patterns: [/sc-static\.net\/scevent\.min\.js/, /snaptr\(/],
  },

  // ─── Attribution ──────────────────────────────────────────────
  {
    code: "hotjar",
    nom: "Hotjar",
    categorie: "attribution",
    patterns: [/static\.hotjar\.com\/c\/hotjar-/],
  },
  {
    code: "clarity",
    nom: "Microsoft Clarity",
    categorie: "attribution",
    patterns: [/clarity\.ms\/tag/],
  },

  // ─── Consent Management Platforms ─────────────────────────────
  {
    code: "cookiebot",
    nom: "Cookiebot",
    categorie: "cmp",
    patterns: [/consent\.cookiebot\.com/, /CookiebotCallback/],
  },
  {
    code: "didomi",
    nom: "Didomi",
    categorie: "cmp",
    patterns: [/sdk\.privacy-center\.org/, /Didomi\.notice/],
  },
  {
    code: "axeptio",
    nom: "Axeptio",
    categorie: "cmp",
    patterns: [/static\.axept\.io/, /axeptioSettings/],
  },
  {
    code: "onetrust",
    nom: "OneTrust",
    categorie: "cmp",
    patterns: [/cdn\.cookielaw\.org/, /optanon/i],
  },
  {
    code: "tarte_au_citron",
    nom: "tarteaucitron.js",
    categorie: "cmp",
    patterns: [/tarteaucitron\.(js|init)/],
  },
];

export function analyserTrackers(params: {
  html: string;
}): { trackers: TrackerDetecte[]; findings: FindingAds[] } {
  const { html } = params;
  const trackers: TrackerDetecte[] = [];

  for (const fp of FINGERPRINTS) {
    const trouve = fp.patterns.some((p) => p.test(html));
    if (!trouve) continue;

    let id: string | undefined;
    if (fp.idPattern) {
      const match = html.match(fp.idPattern);
      if (match) id = match[1] ?? match[0];
    }

    trackers.push({
      code: fp.code,
      nom: fp.nom,
      categorie: fp.categorie,
      id,
    });
  }

  const findings: FindingAds[] = [];

  const aAnalytics = trackers.some((t) => t.categorie === "analytics");
  const aPublicite = trackers.some((t) => t.categorie === "publicite");
  const aRemarketing = trackers.some((t) => t.categorie === "remarketing");
  const aCmp = trackers.some((t) => t.categorie === "cmp");
  const aUa = trackers.some((t) => t.code === "ua");
  const aGa4 = trackers.some((t) => t.code === "ga4");
  const aGtm = trackers.some((t) => t.code === "gtm");

  if (!aAnalytics) {
    findings.push({
      pilier: "trackers",
      code: "analytics_absent",
      severite: "haute",
      message:
        "Aucun outil d'analyse détecté. Impossible de mesurer le trafic, les conversions ou le ROI des campagnes.",
    });
  }

  if (aUa && !aGa4) {
    findings.push({
      pilier: "trackers",
      code: "ua_sans_ga4",
      severite: "critique",
      message:
        "Universal Analytics détecté mais pas GA4. UA ne collecte plus de données depuis le 1er juillet 2023 — vous perdez votre mesure.",
    });
  }

  if (!aGtm && aAnalytics) {
    findings.push({
      pilier: "trackers",
      code: "gtm_absent",
      severite: "moyenne",
      message:
        "Pas de Google Tag Manager détecté. Sans GTM, chaque ajout/modification de tag nécessite un déploiement technique.",
    });
  }

  if (!aPublicite && !aRemarketing) {
    findings.push({
      pilier: "trackers",
      code: "publicite_remarketing_absents",
      severite: "haute",
      message:
        "Aucun tag publicitaire ni pixel de remarketing détecté. Vous ne pouvez ni retargeter vos visiteurs ni mesurer vos campagnes payantes.",
    });
  }

  if (!aCmp && (aAnalytics || aPublicite || aRemarketing)) {
    findings.push({
      pilier: "consentement",
      code: "cmp_absent",
      severite: "haute",
      message:
        "Trackers détectés sans plateforme de gestion du consentement (CMP). Risque de non-conformité RGPD/CNIL (amende jusqu'à 20 M€ ou 4 % CA).",
    });
  }

  return { trackers, findings };
}
