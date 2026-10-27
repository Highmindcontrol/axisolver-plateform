import type { FindingAds, RecommandationAds } from "./types";

/**
 * Catalogue des recommandations Ads. Doctrine « 1 code 2 produits » :
 * les actions lourdes (déploiement GA4/GTM, configuration Consent Mode,
 * création des audiences dynamiques, gestion active des campagnes) sont
 * taguées « pris en charge AXI » pour alimenter l'upsell vers AXI Ads
 * (pack AxiHub).
 */

type Catalogue = Record<
  string,
  Omit<RecommandationAds, "pilier"> & { pilier: FindingAds["pilier"] }
>;

const CATALOGUE: Catalogue = {
  // ─── Pilier trackers ──────────────────────────────────────────
  analytics_absent: {
    pilier: "trackers",
    titre: "Déployer un outil d'analyse (GA4 recommandé)",
    description:
      "Sans mesure du trafic, aucune décision marketing n'est fondée sur de la donnée. Déployer GA4 via GTM, configurer les événements de base (page_view, scroll, click sortant).",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI Ads",
      cout_sans_axi: "400-1200 € HT par agence setup",
      cout_avec_axi: "déploiement GA4 + GTM + events standards inclus",
    },
  },
  ua_sans_ga4: {
    pilier: "trackers",
    titre: "Migrer URGEMMENT d'Universal Analytics vers GA4",
    description:
      "Universal Analytics ne collecte plus depuis juillet 2023. Vous perdez toute donnée depuis cette date. Migration GA4 à faire sous 48h — chaque jour de retard = données marketing perdues définitivement.",
    priorite: "critique",
    effort: "moyen",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI Ads",
      cout_sans_axi: "600-2000 € HT par agence",
      cout_avec_axi: "migration + re-mapping events + validation",
    },
  },
  gtm_absent: {
    pilier: "trackers",
    titre: "Déployer Google Tag Manager",
    description:
      "GTM centralise tous vos tags (GA4, Meta, LinkedIn, Google Ads...) sans toucher au code à chaque modification. Gain de temps massif pour l'équipe marketing.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
  },
  publicite_remarketing_absents: {
    pilier: "trackers",
    titre: "Installer les pixels publicitaires de vos canaux cibles",
    description:
      "Déployer Meta Pixel (B2C) + Google Ads tag + LinkedIn Insight (B2B). Sans pixel, impossible de retargeter vos visiteurs ni de mesurer les campagnes.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI Ads",
      cout_sans_axi: "300-600 € HT par agence par pixel",
      cout_avec_axi: "installation + configuration events + QA",
    },
  },

  // ─── Pilier consentement ──────────────────────────────────────
  bandeau_cookies_absent: {
    pilier: "consentement",
    titre: "Déployer en urgence une plateforme de consentement (CMP)",
    description:
      "Risque juridique majeur : amende CNIL jusqu'à 20 M€ ou 4 % du CA. Déployer Axeptio (FR), Didomi (FR), ou Cookiebot. Configurer en mode « opt-in strict » conformément à la CNIL.",
    priorite: "critique",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI Ads",
      cout_sans_axi: "500-2000 € HT setup + 40-200 €/mois CMP",
      cout_avec_axi: "déploiement + conformité CNIL + remédiation offerts",
    },
  },
  cmp_absent: {
    pilier: "consentement",
    titre: "Installer une CMP conforme CNIL",
    description:
      "Même recommandation que ci-dessus. Axeptio ou Didomi sont les deux acteurs français recommandés pour la conformité RGPD + CNIL.",
    priorite: "critique",
    effort: "faible",
    impact: "fort",
  },
  consent_mode_v2_absent: {
    pilier: "consentement",
    titre: "Activer Google Consent Mode v2",
    description:
      "Depuis mars 2024, Google exige Consent Mode v2 pour les sites EEA. Sans ce signal, perte de 30-50 % des données de conversion et impossibilité de remarketing. Déployer via GTM ou directement dans le gtag.",
    priorite: "haute",
    effort: "moyen",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI Ads",
      cout_sans_axi: "400-1200 € HT par consultant martech",
      cout_avec_axi: "déploiement + validation + modélisation récupérée",
    },
  },
  pre_cochage_detecte: {
    pilier: "consentement",
    titre: "Supprimer le pré-cochage des cases de consentement",
    description:
      "Interdit par la CNIL (délibération 2020-091). Toute case liée au consentement cookies doit être décochée par défaut.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
  },

  // ─── Pilier visibilité SERP ──────────────────────────────────
  marche_sature_ads: {
    pilier: "visibilite",
    titre: "Lancer des campagnes Google Ads sur vos mots-clés métier",
    description:
      "Vos concurrents sont actifs en Ads sur vos mots-clés et vous n'y êtes pas. Chaque jour sans campagne = clics perdus et parts de voix cédées. Démarrer avec une campagne Search prioritaire.",
    priorite: "haute",
    effort: "moyen",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI Ads",
      cout_sans_axi: "800-2500 € HT setup + 15-20 % du budget en gestion",
      cout_avec_axi: "gestion active 7j/7 + optimisation IA + reporting",
    },
  },
  concurrents_ads: {
    pilier: "visibilite",
    titre: "Analyser les concurrents actifs en Ads",
    description:
      "Décortiquer les annonces concurrentes (angles, offres, landing pages) pour construire une proposition différenciante avant de lancer vos propres campagnes.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "moyen",
  },
  pas_de_pub_sur_requete: {
    pilier: "visibilite",
    titre: "Capitaliser sur un marché peu concurrentiel",
    description:
      "Opportunité : coût au clic probablement bas. Tester une campagne Search avec budget maîtrisé pour prendre position avant que les concurrents n'arrivent.",
    priorite: "basse",
    effort: "moyen",
    impact: "moyen",
  },

  // ─── Pilier remarketing ───────────────────────────────────────
  aucun_canal_remarketing: {
    pilier: "remarketing",
    titre: "Déployer au moins un pixel remarketing",
    description:
      "95 % des visiteurs quittent sans convertir. Sans pixel, ils sont définitivement perdus. Priorité : Meta Pixel (B2C) ou LinkedIn Insight (B2B).",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI Ads",
      cout_sans_axi: "250-600 € HT par pixel",
      cout_avec_axi: "pixels + audiences + créas inclus",
    },
  },
  canal_remarketing_unique: {
    pilier: "remarketing",
    titre: "Diversifier les canaux remarketing",
    description:
      "Croiser Meta + Google Ads + LinkedIn (B2B) ou TikTok (jeune public). Chaque canal reaccroche une partie différente de l'audience.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "fort",
  },
  meta_events_insuffisants: {
    pilier: "remarketing",
    titre: "Configurer les événements Meta Pixel standards",
    description:
      "Déclarer au minimum : ViewContent, AddToCart (si e-commerce), Lead, Purchase/CompleteRegistration. Sans events, les audiences dynamiques Meta ne peuvent pas se construire.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "fort",
  },
  google_ads_sans_conversion: {
    pilier: "remarketing",
    titre: "Déclarer les conversions Google Ads",
    description:
      "Sans balise de conversion active, Smart Bidding est aveugle et le ROI incalculable. Déclarer les conversions critiques (achat, lead, inscription).",
    priorite: "moyenne",
    effort: "faible",
    impact: "fort",
  },
  datalayer_ecom_absent: {
    pilier: "remarketing",
    titre: "Mettre en place un dataLayer e-commerce",
    description:
      "Déclarer view_item, add_to_cart, begin_checkout, purchase dans le dataLayer selon GA4 Enhanced Ecommerce. Permet audiences remarketing dynamiques + Performance Max optimal.",
    priorite: "moyenne",
    effort: "eleve",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI Ads",
      cout_sans_axi: "1200-3500 € HT par consultant",
      cout_avec_axi: "spec + implémentation + QA via GTM",
    },
  },
};

export function construireRecommandations(
  findings: FindingAds[],
): RecommandationAds[] {
  const vus = new Set<string>();
  const recos: RecommandationAds[] = [];

  for (const f of findings) {
    if (vus.has(f.code)) continue;
    vus.add(f.code);
    const r = CATALOGUE[f.code];
    if (!r) continue;
    recos.push({ ...r });
  }

  const poidsPriorite: Record<RecommandationAds["priorite"], number> = {
    critique: 4,
    haute: 3,
    moyenne: 2,
    basse: 1,
  };
  const poidsImpact: Record<RecommandationAds["impact"], number> = {
    fort: 3,
    moyen: 2,
    faible: 1,
  };

  recos.sort((a, b) => {
    const pr = poidsPriorite[b.priorite] - poidsPriorite[a.priorite];
    if (pr !== 0) return pr;
    return poidsImpact[b.impact] - poidsImpact[a.impact];
  });

  return recos;
}
