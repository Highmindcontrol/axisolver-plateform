import type { FindingAds, TrackerDetecte } from "./types";

/**
 * Évalue l'infrastructure remarketing : présence des audiences
 * dynamiques (Meta, LinkedIn, Google), events de conversion custom,
 * capacité de retargeting cross-device.
 *
 * Déduction basée sur ce qui est détectable dans le HTML.
 */
export function analyserRemarketing(params: {
  html: string;
  trackers: TrackerDetecte[];
}): FindingAds[] {
  const { html, trackers } = params;
  const findings: FindingAds[] = [];

  const aMeta = trackers.some((t) => t.code === "meta_pixel");
  const aLinkedIn = trackers.some((t) => t.code === "linkedin_insight");
  const aGoogleAds = trackers.some((t) => t.code === "google_ads");
  const aTikTok = trackers.some((t) => t.code === "tiktok_pixel");

  // ─── Diversité des canaux remarketing ──────────────────────────
  const canauxActifs = [aMeta, aLinkedIn, aGoogleAds, aTikTok].filter(Boolean).length;

  if (canauxActifs === 0) {
    findings.push({
      pilier: "remarketing",
      code: "aucun_canal_remarketing",
      severite: "haute",
      message:
        "Aucun pixel de remarketing actif. Les 95 % de visiteurs qui ne convertissent pas sont perdus — pas de rattrapage possible.",
    });
  } else if (canauxActifs === 1) {
    findings.push({
      pilier: "remarketing",
      code: "canal_remarketing_unique",
      severite: "moyenne",
      message:
        "Un seul canal remarketing actif. Croiser 2-3 canaux (Meta + Google + LinkedIn B2B par exemple) démultiplie l'efficacité.",
    });
  }

  // ─── Événements de conversion standards (Meta Pixel) ────────────
  if (aMeta) {
    const eventsMetaStandards = [
      "PageView",
      "ViewContent",
      "AddToCart",
      "Purchase",
      "Lead",
      "CompleteRegistration",
      "Contact",
    ];
    const eventsDetectes = eventsMetaStandards.filter((ev) =>
      new RegExp(`fbq\\(['"]track['"],\\s*['"]${ev}['"]`).test(html),
    );
    if (eventsDetectes.length <= 1) {
      findings.push({
        pilier: "remarketing",
        code: "meta_events_insuffisants",
        severite: "moyenne",
        message: `Meta Pixel détecté mais seulement ${eventsDetectes.length} événement standard déclaré. Sans events (Lead, Purchase, ViewContent), les audiences dynamiques ne fonctionnent pas.`,
        details: { events_detectes: eventsDetectes },
      });
    }
  }

  // ─── Événements de conversion Google Ads ────────────────────────
  if (aGoogleAds) {
    const aEventSnippet = /\bevent_snippet|send_to:\s*['"]AW-/.test(html);
    if (!aEventSnippet) {
      findings.push({
        pilier: "remarketing",
        code: "google_ads_sans_conversion",
        severite: "moyenne",
        message:
          "Google Ads détecté mais pas de balise de conversion visible. Impossible d'optimiser les campagnes sur du vrai signal de vente/lead.",
      });
    }
  }

  // ─── Audiences dynamiques (dataLayer e-commerce) ────────────────
  const aDataLayerEcom =
    /dataLayer\.push\(\s*\{\s*['"]?event['"]?:\s*['"](?:view_item|add_to_cart|purchase|begin_checkout)['"]/.test(
      html,
    );
  if (!aDataLayerEcom && aGoogleAds) {
    findings.push({
      pilier: "remarketing",
      code: "datalayer_ecom_absent",
      severite: "basse",
      message:
        "Pas de dataLayer e-commerce détecté. Sans events view_item/add_to_cart/purchase, impossible de créer des audiences remarketing dynamiques pertinentes.",
    });
  }

  return findings;
}
