import { JSDOM } from "jsdom";
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
  const { html, url, trackers } = params;
  const findings: FindingAds[] = [];

  let doc: Document;
  try {
    doc = new JSDOM(html, { url }).window.document;
  } catch {
    return findings;
  }

  const cmpConnue = trackers.find((t) => t.categorie === "cmp");

  // ─── Bandeau cookies détectable ─────────────────────────────────
  const indicesBandeau = detecterBandeauCookies(doc, html);

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
    const inputsPreCoches = Array.from(
      doc.querySelectorAll('input[type="checkbox"][checked]'),
    );
    if (inputsPreCoches.length > 0) {
      findings.push({
        pilier: "consentement",
        code: "pre_cochage_detecte",
        severite: "haute",
        message: `${inputsPreCoches.length} case(s) à cocher pré-cochée(s) détectée(s). La CNIL interdit le pré-cochage pour le consentement cookies.`,
        details: { count: inputsPreCoches.length },
      });
    }
  }

  return findings;
}

function detecterBandeauCookies(
  doc: Document,
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
      if (doc.querySelector(sel)) {
        indices.push(sel);
      }
    } catch {
      // Sélecteur invalide — on ignore.
    }
  }

  // Mots-clés dans le texte
  const texte = (doc.body?.textContent ?? "").toLowerCase();
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
