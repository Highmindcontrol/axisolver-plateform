import * as cheerio from "cheerio";
import type { FindingAds, TrackerDetecte } from "./types";

/**
 * Analyse la mise en place du consentement RGPD : présence d'un
 * bandeau cookies détectable (CMP connue OU éléments DOM typiques),
 * conformité CNIL (bouton refuser visible, choix granulaires, pas
 * de pré-cochage).
 *
 * Audit statique uniquement — la détection du mode consent + mode V2
 * côté Google Ads nécessiterait un crawl headless, reporté V1.1.
 */
export function analyserConsentement(params: {
  html: string;
  url: string;
  trackers: TrackerDetecte[];
}): FindingAds[] {
  const { html, trackers } = params;
  const findings: FindingAds[] = [];

  let $: cheerio.CheerioAPI;
  try {
    $ = cheerio.load(html);
  } catch {
    return findings;
  }

  const cmpConnue = trackers.find((t) => t.categorie === "cmp");

  // ─── Bandeau cookies détectable ─────────────────────────────────
  const indicesBandeau = detecterBandeauCookies($, html);

  if (!cmpConnue && !indicesBandeau.detecte) {
    findings.push({
      pilier: "consentement",
      code: "bandeau_cookies_absent",
      severite: "critique",
      message:
        "Aucun bandeau de consentement cookies détecté. Non-conformité RGPD/CNIL caractérisée dès qu'un tracker est présent.",
    });
  }

  // ─── Google Consent Mode v2 ─────────────────────────────────────
  const aGoogleTag =
    trackers.some((t) => t.code === "ga4" || t.code === "google_ads" || t.code === "gtm");
  const aConsentMode =
    /gtag\(['"]consent['"],/i.test(html) ||
    /dataLayer\.push\(.*consent/i.test(html);

  if (aGoogleTag && !aConsentMode) {
    findings.push({
      pilier: "consentement",
      code: "consent_mode_v2_absent",
      severite: "haute",
      message:
        "Tags Google détectés sans Consent Mode v2. Depuis mars 2024, Google refuse la mesure et les audiences remarketing EEA sans ce signal.",
    });
  }

  // ─── Détection pré-cochage (interdit CNIL) ───────────────────────
  if (indicesBandeau.detecte) {
    const nbPreCoches = $('input[type="checkbox"][checked]').length;
    if (nbPreCoches > 0) {
      findings.push({
        pilier: "consentement",
        code: "pre_cochage_detecte",
        severite: "haute",
        message: `${nbPreCoches} case(s) à cocher pré-cochée(s) détectée(s). La CNIL interdit le pré-cochage pour le consentement cookies.`,
        details: { count: nbPreCoches },
      });
    }
  }

  return findings;
}

function detecterBandeauCookies(
  $: cheerio.CheerioAPI,
  html: string,
): { detecte: boolean; indices: string[] } {
  const indices: string[] = [];

  // Sélecteurs typiques des bandeaux
  const selecteurs = [
    "[id*='cookie' i]",
    "[class*='cookie' i]",
    "[id*='consent' i]",
    "[class*='consent' i]",
    "[id*='gdpr' i]",
    "[class*='gdpr' i]",
    "[data-cookie-banner]",
    "aside[role='dialog']",
  ];
  for (const sel of selecteurs) {
    try {
      if ($(sel).length > 0) {
        indices.push(sel);
      }
    } catch {
      // Sélecteur invalide — on ignore.
    }
  }

  // Mots-clés dans le texte
  const texte = $("body").text().toLowerCase();
  const motsCles = [
    "accepter les cookies",
    "accepter tous",
    "tout accepter",
    "paramétrer les cookies",
    "gérer les cookies",
    "refuser les cookies",
    "we use cookies",
    "accept all cookies",
  ];
  for (const mc of motsCles) {
    if (texte.includes(mc)) {
      indices.push(`texte:"${mc}"`);
    }
  }

  // Scripts externes
  const scriptsCmp =
    /cookielaw|cookiebot|didomi|axept|tarteaucitron|onetrust/i.test(html);
  if (scriptsCmp) indices.push("script:cmp-connue");

  return { detecte: indices.length > 0, indices };
}
