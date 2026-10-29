import type { FindingSecurity, RecommandationSecurity } from "./types";

/**
 * Catalogue des recommandations security. Chaque code de finding est
 * mappé à une action concrète priorisée. Doctrine « 1 code 2 produits » :
 * les actions sont taguées « pris en charge AXI Security Shield » quand
 * AXI peut les exécuter concrètement avec accès code (90-95 % des cas).
 *
 * Pack d'intelligence unique = AXI Security Shield (fusion AXI Shield +
 * AXI Security). Inclus par défaut dans AxiSolver.
 */

const PACK = "AXI Security Shield";

/** Helper pour taguer une reco comme prise en charge par le pack. */
const parAxi = (action: string) => ({
  pack: PACK,
  cout_sans_axi: "",
  cout_avec_axi: action,
});

export type Catalogue = Record<
  string,
  Omit<RecommandationSecurity, "pilier"> & {
    pilier: FindingSecurity["pilier"];
  }
>;

export const CATALOGUE: Catalogue = {
  // ─── Pilier headers ───────────────────────────────────────────
  hsts_absent: {
    pilier: "headers",
    titre: "Activer HSTS (Strict-Transport-Security)",
    description:
      "Ajouter le header `Strict-Transport-Security: max-age=15552000; includeSubDomains; preload` côté serveur. Empêche le downgrade HTTPS→HTTP et le vol de session via wifi public.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Déploie l'en-tête HSTS côté serveur + vérifie en continu",
    ),
  },
  hsts_max_age_court: {
    pilier: "headers",
    titre: "Allonger la durée HSTS",
    description:
      "Passer max-age à 15 552 000 secondes (6 mois) minimum, idéalement 31 536 000 (1 an) pour éligibilité à la liste preload des navigateurs.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Ajuste max-age à 1 an + demande d'inscription preload si éligible",
    ),
  },
  hsts_sans_subdomains: {
    pilier: "headers",
    titre: "Étendre HSTS aux sous-domaines",
    description:
      "Ajouter includeSubDomains pour protéger tous les sous-domaines (api., admin., www., etc.).",
    priorite: "basse",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Vérifie que tous les sous-domaines sont en HTTPS puis active includeSubDomains",
    ),
  },
  csp_absent: {
    pilier: "headers",
    titre: "Déployer une Content-Security-Policy",
    description:
      "Définir une CSP stricte qui limite les sources de scripts/styles/images aux domaines de confiance. Première ligne de défense contre les XSS.",
    priorite: "haute",
    effort: "moyen",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Génère une CSP adaptée au site + déploie en mode report-only + analyse les rapports + bascule en enforce",
    ),
  },
  csp_report_only: {
    pilier: "headers",
    titre: "Passer CSP en mode enforce",
    description:
      "La politique est actuellement observée mais non appliquée. Analyser les violations loguées, ajuster la politique, puis basculer sur Content-Security-Policy en production.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Analyse les rapports CSP collectés + ajuste la policy + bascule en enforce",
    ),
  },
  csp_unsafe_inline: {
    pilier: "headers",
    titre: "Retirer 'unsafe-inline' de la CSP",
    description:
      "Déplacer les scripts/styles inline dans des fichiers externes et utiliser nonces ou hashes pour les scripts inline indispensables.",
    priorite: "moyenne",
    effort: "eleve",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Externalise les scripts/styles inline + met en place un système de nonces côté serveur",
    ),
  },
  csp_unsafe_eval: {
    pilier: "headers",
    titre: "Retirer 'unsafe-eval' de la CSP",
    description:
      "Supprimer les appels à eval(), new Function(), setTimeout(string). Souvent lié à des libs legacy — préférer des alternatives modernes.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Audit du code pour localiser les eval() + propose des alternatives modernes + retire 'unsafe-eval'",
    ),
  },
  x_frame_options_absent: {
    pilier: "headers",
    titre: "Bloquer le clickjacking (X-Frame-Options)",
    description:
      "Ajouter `X-Frame-Options: DENY` (ou SAMEORIGIN si vous embarquez vos propres iframes) côté serveur.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Déploie X-Frame-Options côté serveur (DENY ou SAMEORIGIN selon usage iframe)",
    ),
  },
  x_frame_options_mal_configure: {
    pilier: "headers",
    titre: "Corriger X-Frame-Options",
    description:
      "Remplacer la valeur actuelle par DENY ou SAMEORIGIN. Les valeurs ALLOW-FROM ne sont plus supportées — utiliser CSP frame-ancestors.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Corrige la valeur côté serveur ou bascule sur CSP frame-ancestors",
    ),
  },
  x_content_type_options_absent: {
    pilier: "headers",
    titre: "Ajouter X-Content-Type-Options: nosniff",
    description:
      "Empêche le navigateur de deviner le type MIME d'un fichier. Protège contre le MIME confusion : un .txt interprété comme JS exécutable.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi("Déploie l'en-tête nosniff côté serveur"),
  },
  referrer_policy_absent: {
    pilier: "headers",
    titre: "Définir une Referrer-Policy restrictive",
    description:
      "Ajouter `Referrer-Policy: strict-origin-when-cross-origin`. Évite de fuir les URLs internes aux domaines tiers (Google Analytics, pubs...).",
    priorite: "basse",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Déploie Referrer-Policy strict-origin-when-cross-origin",
    ),
  },
  referrer_policy_faible: {
    pilier: "headers",
    titre: "Renforcer la Referrer-Policy",
    description:
      "Passer à strict-origin-when-cross-origin ou plus restrictif. Évite de transmettre les URLs internes aux domaines tiers.",
    priorite: "basse",
    effort: "faible",
    impact: "faible",
    pris_en_charge_axi: parAxi("Remplace la valeur par une policy plus restrictive"),
  },
  permissions_policy_absent: {
    pilier: "headers",
    titre: "Déclarer une Permissions-Policy",
    description:
      "Lister explicitement les capacités API autorisées (geolocation, camera, microphone, etc.). Par défaut, tout est autorisé pour tous les scripts.",
    priorite: "basse",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Génère une Permissions-Policy adaptée à l'usage du site + déploie",
    ),
  },
  server_version_exposee: {
    pilier: "headers",
    titre: "Masquer la version serveur",
    description:
      "Désactiver ServerTokens / ServerSignature côté Apache, server_tokens off côté Nginx. Ne jamais révéler la version précise aux attaquants.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Masque la version serveur dans la config Nginx/Apache",
    ),
  },
  x_powered_by_expose: {
    pilier: "headers",
    titre: "Supprimer le header X-Powered-By",
    description:
      "Retirer le header côté serveur (expose_php off / app.disable('x-powered-by') en Express). Révélation inutile côté client.",
    priorite: "moyenne",
    effort: "faible",
    impact: "faible",
    pris_en_charge_axi: parAxi(
      "Retire X-Powered-By côté PHP/Express/Nginx proxy",
    ),
  },

  // ─── Pilier TLS ───────────────────────────────────────────────
  tls_connexion_impossible: {
    pilier: "tls",
    titre: "Rétablir la connectivité HTTPS",
    description:
      "Le port 443 est inaccessible. Vérifier le pare-feu, le load balancer et la configuration du serveur TLS. Site actuellement inutilisable en HTTPS.",
    priorite: "critique",
    effort: "moyen",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Diagnostic réseau + plan de remédiation + relance config SSL",
    ),
  },
  cert_expire: {
    pilier: "tls",
    titre: "Renouveler IMMÉDIATEMENT le certificat TLS",
    description:
      "Le certificat est expiré. Les navigateurs affichent une alerte rouge et bloquent l'accès. Renouveler via Let's Encrypt (gratuit) ou votre fournisseur TLS actuel.",
    priorite: "critique",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Lance certbot renew en urgence + reload serveur + alertes pré-expiration pour le futur",
    ),
  },
  cert_expiration_imminente: {
    pilier: "tls",
    titre: "Renouveler le certificat sous 7 jours",
    description:
      "Expiration imminente. Lancer la procédure de renouvellement maintenant pour laisser le temps de propager et tester.",
    priorite: "critique",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Déclenche certbot renew + vérifie la propagation + reload serveur",
    ),
  },
  cert_expiration_proche: {
    pilier: "tls",
    titre: "Planifier le renouvellement TLS",
    description:
      "Programmer le renouvellement avant J-14. Si Let's Encrypt automatique, vérifier que le cron de renouvellement fonctionne.",
    priorite: "haute",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Vérifie le timer certbot + teste le renouvellement à blanc",
    ),
  },
  san_absent: {
    pilier: "tls",
    titre: "Régénérer un certificat avec SAN",
    description:
      "Le certificat n'a pas de Subject Alternative Name — les navigateurs modernes exigent le SAN pour valider le domaine. Régénérer le certificat.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Régénère le certificat avec les SAN appropriés via certbot",
    ),
  },
  protocole_tls_obsolete: {
    pilier: "tls",
    titre: "Désactiver les protocoles TLS obsolètes",
    description:
      "Désactiver SSLv3, TLS 1.0 et TLS 1.1 au niveau du serveur. Garder uniquement TLS 1.2 et TLS 1.3.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Configure Nginx/Apache pour n'accepter que TLS 1.2 et 1.3",
    ),
  },

  // ─── Pilier exposition ────────────────────────────────────────
  interfaces_admin_exposees: {
    pilier: "exposition",
    titre: "Masquer les interfaces d'administration",
    description:
      "Restreindre l'accès à /wp-admin, /administrator, /phpmyadmin par liste blanche d'IP, VPN ou authentification à deux facteurs. Les bots scannent ces chemins en permanence.",
    priorite: "moyenne",
    effort: "moyen",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Déploie restriction IP ou 2FA sur les interfaces admin + surveillance tentatives + blocage auto",
    ),
  },
  robots_txt_absent: {
    pilier: "exposition",
    titre: "Créer un fichier robots.txt",
    description:
      "Déclarer les règles de crawl pour les bots (User-agent, Allow, Disallow). Minimum : User-agent: * Allow: / + lien vers sitemap.xml.",
    priorite: "basse",
    effort: "faible",
    impact: "faible",
    pris_en_charge_axi: parAxi(
      "Dépose un robots.txt adapté au site avec Sitemap",
    ),
  },
  security_txt_absent: {
    pilier: "exposition",
    titre: "Publier /.well-known/security.txt",
    description:
      "RFC 9116 : fichier texte à l'adresse /.well-known/security.txt indiquant comment contacter l'équipe sécurité en cas de vulnérabilité découverte.",
    priorite: "basse",
    effort: "faible",
    impact: "faible",
    pris_en_charge_axi: parAxi(
      "Dépose /.well-known/security.txt conforme RFC 9116",
    ),
  },

  // ─── Pilier cookies ──────────────────────────────────────────
  cookie_sans_secure: {
    pilier: "cookies",
    titre: "Ajouter l'attribut Secure aux cookies",
    description:
      "Marquer tous les cookies Secure côté serveur. Un cookie Secure n'est jamais transmis sur HTTP, uniquement HTTPS.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Modifie la config PHP/Express/WordPress pour marquer les cookies Secure",
    ),
  },
  cookie_sans_httponly: {
    pilier: "cookies",
    titre: "Protéger les cookies avec HttpOnly",
    description:
      "Marquer les cookies de session/auth HttpOnly. Les rend invisibles à JavaScript — protection contre le vol via XSS.",
    priorite: "moyenne",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Applique HttpOnly aux cookies de session côté code applicatif",
    ),
  },
  cookie_sans_samesite: {
    pilier: "cookies",
    titre: "Ajouter SameSite aux cookies",
    description:
      "Définir SameSite=Lax ou Strict pour les cookies sensibles. Bloque les attaques CSRF cross-origin.",
    priorite: "moyenne",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Définit SameSite=Lax (ou Strict si applicable) côté code applicatif",
    ),
  },
  cookie_samesite_none_sans_secure: {
    pilier: "cookies",
    titre: "Corriger SameSite=None sans Secure",
    description:
      "Les navigateurs rejettent SameSite=None sans Secure. Soit activer Secure, soit basculer en SameSite=Lax si cross-origin pas nécessaire.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Évalue si cross-origin nécessaire puis active Secure ou bascule en Lax",
    ),
  },

  // ─── Pilier contenu ───────────────────────────────────────────
  mixed_content: {
    pilier: "contenu",
    titre: "Éliminer le mixed content",
    description:
      "Remplacer toutes les URLs http:// par https:// dans le HTML (scripts, images, CSS, iframes). Les navigateurs bloquent les ressources mixed content actives et dégradent les passives.",
    priorite: "haute",
    effort: "moyen",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Scan complet + remplacement http→https dans HTML/CSS/JS/base + ajout upgrade-insecure-requests",
    ),
  },
  iframes_tiers_sans_sandbox: {
    pilier: "contenu",
    titre: "Isoler les iframes tiers avec sandbox",
    description:
      "Ajouter l'attribut sandbox aux iframes tiers (ex. `sandbox=\"allow-scripts allow-same-origin\"`). Limite les capacités du contenu embarqué.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Ajoute sandbox avec permissions minimales adaptées sur chaque iframe tiers",
    ),
  },
  form_action_http: {
    pilier: "contenu",
    titre: "Chiffrer les formulaires (action HTTPS)",
    description:
      "Corriger IMMÉDIATEMENT les attributs action des formulaires pour pointer sur HTTPS. Les données saisies (identifiants, cartes bancaires) transitent actuellement en clair.",
    priorite: "critique",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Corrige en urgence tous les form action HTTP → HTTPS ou URL relative",
    ),
  },
  cms_version_exposee: {
    pilier: "contenu",
    titre: "Masquer la version CMS",
    description:
      "Retirer la balise `<meta name=\"generator\">` du HTML. Côté WordPress : filtres `the_generator` ou plugin de masquage. Évite le ciblage par CVE connu.",
    priorite: "moyenne",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Retire la balise generator + masque /readme.html et versions dans URLs d'assets",
    ),
  },
  target_blank_sans_noopener: {
    pilier: "contenu",
    titre: "Ajouter rel=\"noopener noreferrer\" aux liens target=\"_blank\"",
    description:
      "Protège contre le tabnabbing : sans noopener, la page ouverte peut manipuler window.opener (ex. redirection phishing).",
    priorite: "basse",
    effort: "faible",
    impact: "moyen",
    pris_en_charge_axi: parAxi(
      "Scan + ajout systématique de rel=\"noopener noreferrer\" sur tous les liens target=_blank",
    ),
  },

  // ─── Pilier réputation ────────────────────────────────────────
  https_non_force: {
    pilier: "reputation",
    titre: "Forcer HTTPS sur toutes les connexions",
    description:
      "Rediriger systématiquement HTTP → HTTPS via le serveur web (301). Combiner avec HSTS pour verrouiller le changement côté navigateur.",
    priorite: "critique",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Déploie la redirection 301 HTTP→HTTPS + active HSTS + vérifie le certificat",
    ),
  },
  redirect_http_vers_http: {
    pilier: "reputation",
    titre: "Corriger la redirection HTTP",
    description:
      "La version HTTP redirige, mais pas vers HTTPS. Modifier la règle pour cibler explicitement https://domaine.tld$1.",
    priorite: "haute",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Corrige la cible de redirection pour pointer explicitement sur https://",
    ),
  },
  http_sert_contenu: {
    pilier: "reputation",
    titre: "Désactiver le port 80 ou rediriger",
    description:
      "Le site sert actuellement du contenu en HTTP sans redirection. Soit fermer le port 80, soit rediriger systématiquement vers HTTPS 301.",
    priorite: "critique",
    effort: "faible",
    impact: "fort",
    pris_en_charge_axi: parAxi(
      "Déploie une redirection 301 systématique du port 80 vers HTTPS",
    ),
  },
};

export function construireRecommandations(
  findings: FindingSecurity[],
): RecommandationSecurity[] {
  const vus = new Set<string>();
  const recos: RecommandationSecurity[] = [];

  for (const f of findings) {
    if (vus.has(f.code)) continue;
    vus.add(f.code);
    const r = CATALOGUE[f.code];
    if (!r) continue;
    recos.push({ ...r });
  }

  const poidsPriorite: Record<RecommandationSecurity["priorite"], number> = {
    critique: 4,
    haute: 3,
    moyenne: 2,
    basse: 1,
  };
  const poidsImpact: Record<RecommandationSecurity["impact"], number> = {
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
