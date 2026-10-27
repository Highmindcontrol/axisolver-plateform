import type { FindingSeo, RecommandationSeo } from "./types";

/**
 * Transforme chaque code de finding en recommandation actionnable
 * priorisée, avec effort/impact et renvoi vers le pack AXI pertinent.
 *
 * Doctrine « 1 code 2 produits » (mémoire fondateur) : chaque reco
 * mentionne quand c'est pris en charge par le pack AXI SEO pour servir
 * de levier d'upsell vers AxiHub depuis AxiSolver.
 */

type Catalogue = Record<
  string,
  Omit<RecommandationSeo, "pilier"> & { pilier: FindingSeo["pilier"] }
>;

const CATALOGUE: Catalogue = {
  // ─── Pilier technique ─────────────────────────────────────────
  title_absent: {
    pilier: "technique",
    titre: "Ajouter une balise <title> à chaque page",
    description:
      "Rédiger un titre unique de 50 à 60 caractères par page, contenant un mot-clé principal. C'est le premier élément lu par Google et par l'utilisateur dans les résultats de recherche.",
    priorite: "critique",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI SEO",
      cout_sans_axi: "80-150 € HT par agence (par page)",
      cout_avec_axi: "inclus dans l'audit mensuel",
    },
  },
  title_court: {
    pilier: "technique",
    titre: "Allonger la balise <title>",
    description:
      "Enrichir le titre actuel pour atteindre 50-60 caractères, en y intégrant un mot-clé principal et une proposition de valeur courte.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
  },
  title_long: {
    pilier: "technique",
    titre: "Raccourcir la balise <title>",
    description:
      "Google tronque les titres au-delà de ~60 caractères. Reformuler pour garder l'essentiel dans la limite visible.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
  },
  meta_description_absente: {
    pilier: "technique",
    titre: "Ajouter une meta description",
    description:
      "Rédiger un résumé engageant de 140-160 caractères par page. C'est ce qui s'affiche sous le titre dans les résultats Google et influence le taux de clic.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI SEO",
      cout_sans_axi: "40-80 € HT par agence (par page)",
      cout_avec_axi: "inclus dans l'audit mensuel",
    },
  },
  meta_description_courte: {
    pilier: "technique",
    titre: "Enrichir la meta description",
    description:
      "Compléter le résumé actuel pour atteindre 140-160 caractères, avec un appel à l'action clair.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
  },
  meta_description_longue: {
    pilier: "technique",
    titre: "Raccourcir la meta description",
    description: "Reformuler pour tenir dans la limite affichée par Google (160 caractères).",
    priorite: "basse",
    effort: "faible",
    impact: "faible",
  },
  canonical_absent: {
    pilier: "technique",
    titre: "Déclarer une balise canonical",
    description:
      "Ajouter <link rel=\"canonical\" href=\"URL\"> dans le <head> de chaque page pour indiquer à Google la version de référence et éviter le contenu dupliqué.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "moyen",
  },
  noindex_detecte: {
    pilier: "technique",
    titre: "Vérifier la directive noindex",
    description:
      "La page est actuellement marquée noindex et sera invisible dans Google. Confirmer si c'est voulu (page admin, remerciement, etc.) ou retirer la directive.",
    priorite: "critique",
    effort: "faible",
    impact: "fort",
  },
  lang_absent: {
    pilier: "technique",
    titre: "Préciser la langue du document",
    description: "Ajouter l'attribut lang=\"fr\" (ou autre) sur la balise <html> pour aider Google et les lecteurs d'écran.",
    priorite: "basse",
    effort: "faible",
    impact: "faible",
  },
  open_graph_incomplet: {
    pilier: "technique",
    titre: "Compléter les balises Open Graph",
    description:
      "Ajouter og:title, og:description et og:image. Elles contrôlent l'apparence du site quand il est partagé sur LinkedIn, Facebook, WhatsApp, etc.",
    priorite: "basse",
    effort: "faible",
    impact: "moyen",
  },

  // ─── Pilier contenu ───────────────────────────────────────────
  h1_absent: {
    pilier: "contenu",
    titre: "Ajouter une balise <h1> éditoriale",
    description:
      "Chaque page doit avoir UN titre H1 qui annonce le sujet, idéalement avec un mot-clé principal. C'est le second signal fort pour Google après le <title>.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
  },
  h1_multiple: {
    pilier: "contenu",
    titre: "Ne garder qu'une seule balise <h1>",
    description:
      "Rétrograder les H1 supplémentaires en H2 pour établir une hiérarchie claire.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
  },
  sous_titres_absents: {
    pilier: "contenu",
    titre: "Structurer la page avec des sous-titres",
    description:
      "Ajouter des H2 (sections) et H3 (sous-sections). Google utilise ces balises pour extraire les featured snippets et comprendre la structure.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "moyen",
  },
  contenu_mince: {
    pilier: "contenu",
    titre: "Enrichir le contenu éditorial",
    description:
      "Développer la page à au moins 300-500 mots de contenu utile et unique. Les pages minces sont dévaluées par Google (Panda, Helpful Content Update).",
    priorite: "haute",
    effort: "eleve",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI SEO",
      cout_sans_axi: "150-400 € HT par rédacteur (par page)",
      cout_avec_axi: "génération automatique + validation humaine",
    },
  },
  images_sans_alt: {
    pilier: "contenu",
    titre: "Ajouter des attributs alt aux images",
    description:
      "Chaque image doit décrire son contenu en 5-15 mots. Essentiel pour l'accessibilité, le SEO image (Google Images) et le ranking général.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "moyen",
  },
  liens_internes_rares: {
    pilier: "contenu",
    titre: "Renforcer le maillage interne",
    description:
      "Ajouter des liens contextuels vers d'autres pages du site. Chaque lien partage de l'autorité et aide Google à explorer plus profondément.",
    priorite: "basse",
    effort: "moyen",
    impact: "moyen",
  },

  // ─── Pilier mobile ────────────────────────────────────────────
  viewport_absent: {
    pilier: "mobile",
    titre: "Déclarer la balise meta viewport",
    description:
      "Ajouter <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> dans le <head>. Sans cela, Google considère le site comme non adapté mobile — pénalité directe.",
    priorite: "critique",
    effort: "faible",
    impact: "fort",
  },
  viewport_mal_configure: {
    pilier: "mobile",
    titre: "Corriger la configuration viewport",
    description:
      "La balise doit contenir width=device-width. Sans ça, le site s'affiche en version desktop zoomée sur mobile.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
  },

  // ─── Pilier performance ───────────────────────────────────────
  ttfb_eleve: {
    pilier: "performance",
    titre: "Réduire le temps de réponse serveur (TTFB)",
    description:
      "Le serveur met plus de 3 secondes à répondre. Investiguer : hébergement sous-dimensionné, requêtes DB lentes, absence de cache. Google pénalise au-delà de 2 s.",
    priorite: "haute",
    effort: "eleve",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI SEO + AXI Performance",
      cout_sans_axi: "500-2000 € HT par devops",
      cout_avec_axi: "audit + plan d'optimisation inclus",
    },
  },
  ttfb_moyen: {
    pilier: "performance",
    titre: "Optimiser le temps de réponse serveur",
    description:
      "Mettre en place du cache HTTP (Varnish, Cloudflare), optimiser les requêtes base de données, ou passer à un hébergement plus performant.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "moyen",
  },
  page_lourde: {
    pilier: "performance",
    titre: "Alléger la page",
    description:
      "Réduire la taille du HTML : supprimer le code mort, minifier, retirer les scripts inutiles. Objectif < 500 Ko.",
    priorite: "haute",
    effort: "moyen",
    impact: "fort",
  },
  page_moyennement_lourde: {
    pilier: "performance",
    titre: "Compresser et minifier le HTML",
    description:
      "Activer Brotli/gzip côté serveur, minifier le HTML inline, retirer les commentaires et espaces inutiles.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
  },
  trop_de_scripts: {
    pilier: "performance",
    titre: "Réduire le nombre de scripts externes",
    description:
      "Combiner, différer (defer/async) ou retirer les scripts inutiles. Chaque script externe est une requête HTTP qui bloque le rendu.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "moyen",
  },

  // ─── Pilier mots-clés ─────────────────────────────────────────
  non_classe: {
    pilier: "mots_cles",
    titre: "Travailler le positionnement sur une requête absente du top 20",
    description:
      "Produire du contenu éditorial ciblé sur cette requête : page dédiée, FAQ, article de blog. Puis renforcer par maillage interne et liens externes.",
    priorite: "haute",
    effort: "eleve",
    impact: "fort",
    pris_en_charge_axi: {
      pack: "AXI SEO",
      cout_sans_axi: "300-800 € HT par article (agence)",
      cout_avec_axi: "ciblage + rédaction + optimisation inclus",
    },
  },
  en_page_2: {
    pilier: "mots_cles",
    titre: "Pousser la page de la page 2 vers la page 1",
    description:
      "Enrichir le contenu, améliorer les balises title/H1, obtenir 2-3 backlinks de qualité. Un passage page 2 → page 1 multiplie le trafic par 10 en moyenne.",
    priorite: "haute",
    effort: "moyen",
    impact: "fort",
  },
  page_1_mais_perfectible: {
    pilier: "mots_cles",
    titre: "Grimper dans le top 3",
    description:
      "La page est en première page mais hors top 3. Analyser les 3 premiers résultats, enrichir le contenu, améliorer le CTR (title + meta description).",
    priorite: "moyenne",
    effort: "moyen",
    impact: "fort",
  },
};

export function construireRecommandations(
  findings: FindingSeo[],
): RecommandationSeo[] {
  const vus = new Set<string>();
  const recos: RecommandationSeo[] = [];

  for (const f of findings) {
    if (vus.has(f.code)) continue;
    vus.add(f.code);
    const r = CATALOGUE[f.code];
    if (!r) continue;
    recos.push({ ...r });
  }

  // Tri par priorité décroissante puis impact.
  const poidsPriorite: Record<RecommandationSeo["priorite"], number> = {
    critique: 4,
    haute: 3,
    moyenne: 2,
    basse: 1,
  };
  const poidsImpact: Record<RecommandationSeo["impact"], number> = {
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
