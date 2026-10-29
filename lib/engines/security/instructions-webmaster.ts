/**
 * Instructions techniques détaillées destinées au webmaster / dev du
 * client, pour chaque code de recommandation sécurité. Permet de
 * générer un rapport imprimable "voilà comment traiter chaque point"
 * avec des snippets Nginx / Apache / WordPress / Express.
 */

export type InstructionWebmaster = {
  intro?: string;
  etapes: Array<{
    titre: string;
    corps: string; // texte simple
    snippet?: { langage: string; code: string }; // bloc code
  }>;
  verification?: string;
  references?: Array<{ nom: string; url: string }>;
};

const DOCS_MDN = "https://developer.mozilla.org/fr/docs/Web/HTTP/Headers";

export const INSTRUCTIONS_WEBMASTER: Record<string, InstructionWebmaster> = {
  // ═══════════════════════════════════════════════════════════════
  // PILIER HEADERS
  // ═══════════════════════════════════════════════════════════════

  hsts_absent: {
    intro:
      "HSTS force le navigateur à utiliser HTTPS pour toutes les visites futures, même si l'utilisateur tape http:// ou clique sur un lien HTTP. Protège contre le downgrade et les attaques man-in-the-middle sur wifi public.",
    etapes: [
      {
        titre: "Ajouter l'en-tête côté serveur",
        corps:
          "Configurer le header HTTP sur toutes les réponses du serveur. Choisir la stratégie selon ton infrastructure.",
      },
      {
        titre: "Nginx",
        corps: "Ajouter dans le bloc server HTTPS :",
        snippet: {
          langage: "nginx",
          code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
        },
      },
      {
        titre: "Apache",
        corps: "Ajouter dans la configuration VirtualHost (SSL) ou .htaccess :",
        snippet: {
          langage: "apache",
          code: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"`,
        },
      },
      {
        titre: "WordPress sans accès serveur",
        corps:
          'Via le fichier wp-config.php ou un plugin de sécurité (Really Simple SSL, Wordfence). Alternative : plugin "HTTP Headers".',
      },
      {
        titre: "Node.js / Express",
        corps: "Utiliser le package Helmet :",
        snippet: {
          langage: "javascript",
          code: `import helmet from "helmet";
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));`,
        },
      },
    ],
    verification:
      "Après déploiement, tester avec curl -I https://domaine.tld et vérifier la présence du header Strict-Transport-Security dans la réponse.",
    references: [{ nom: "MDN HSTS", url: `${DOCS_MDN}/Strict-Transport-Security` }],
  },

  hsts_max_age_court: {
    etapes: [
      {
        titre: "Augmenter max-age",
        corps:
          "Passer la valeur max-age à au moins 15552000 (6 mois), idéalement 31536000 (1 an). Reprendre les snippets de hsts_absent avec la nouvelle valeur.",
      },
    ],
  },

  hsts_sans_subdomains: {
    etapes: [
      {
        titre: "Ajouter includeSubDomains",
        corps:
          "Modifier le header HSTS pour inclure la directive includeSubDomains. Attention : tous les sous-domaines (api., admin., staging.) devront OBLIGATOIREMENT être servis en HTTPS. Vérifier que c'est bien le cas avant d'activer.",
        snippet: {
          langage: "nginx",
          code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`,
        },
      },
    ],
  },

  csp_absent: {
    intro:
      "La CSP (Content-Security-Policy) limite d'où le navigateur peut charger scripts/images/styles. C'est la première ligne de défense contre les attaques XSS. Démarrer en mode report-only pour mesurer, puis basculer en enforce.",
    etapes: [
      {
        titre: "Phase 1 : audit en mode report-only",
        corps:
          "Déployer d'abord en mode observateur pour recenser toutes les ressources chargées sans rien bloquer. Récupérer les rapports via l'URL /csp-report (à construire côté backend).",
        snippet: {
          langage: "nginx",
          code: `add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' 'unsafe-inline'; report-uri /csp-report" always;`,
        },
      },
      {
        titre: "Phase 2 : analyser les rapports pendant 1-2 semaines",
        corps:
          "Collecter les violations, identifier les domaines légitimes (Google Fonts, CDN, Analytics...). Construire une allowlist.",
      },
      {
        titre: "Phase 3 : passer en mode enforce",
        corps:
          "Remplacer Content-Security-Policy-Report-Only par Content-Security-Policy avec la politique ajustée. Exemple de base pour un site WordPress :",
        snippet: {
          langage: "nginx",
          code: `add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'self'; form-action 'self';" always;`,
        },
      },
      {
        titre: "Objectif à moyen terme",
        corps:
          "Retirer 'unsafe-inline' en migrant vers des scripts externes ou en utilisant des nonces. Ajouter 'strict-dynamic' pour une CSP moderne.",
      },
    ],
    references: [
      { nom: "MDN CSP", url: `${DOCS_MDN}/Content-Security-Policy` },
      { nom: "Générateur CSP", url: "https://report-uri.com/home/generate" },
    ],
  },

  csp_report_only: {
    etapes: [
      {
        titre: "Basculer en mode enforce",
        corps:
          "Après analyse des rapports CSP, remplacer le header Content-Security-Policy-Report-Only par Content-Security-Policy. Garder report-uri pour monitorer les violations résiduelles.",
      },
    ],
  },

  csp_unsafe_inline: {
    etapes: [
      {
        titre: "Externaliser les scripts/styles inline",
        corps:
          "Déplacer tout le JavaScript inline (<script>...</script>) et le CSS inline (style=\"...\") dans des fichiers externes. Pour les scripts/styles inline incontournables, utiliser des nonces :",
        snippet: {
          langage: "html",
          code: `<!-- Le serveur génère un nonce aléatoire par requête -->
<script nonce="r4nd0m-nonce-123">...</script>

<!-- Puis dans le header CSP : -->
Content-Security-Policy: script-src 'self' 'nonce-r4nd0m-nonce-123'`,
        },
      },
    ],
  },

  csp_unsafe_eval: {
    etapes: [
      {
        titre: "Identifier et remplacer les appels eval()",
        corps:
          'Rechercher dans le code et les libs tierces : eval(), new Function(), setTimeout("string"), setInterval("string"), WebAssembly.compile. Souvent lié à des libs legacy. Alternatives modernes : JSON.parse(), fonctions nommées, structuredClone().',
      },
      {
        titre: "Retirer 'unsafe-eval' de la CSP",
        corps: "Une fois le code nettoyé, retirer 'unsafe-eval' de script-src.",
      },
    ],
  },

  x_frame_options_absent: {
    intro:
      "Le clickjacking consiste à embarquer ton site dans un iframe transparent sur un site malveillant pour piéger l'utilisateur. X-Frame-Options bloque cette embarquement.",
    etapes: [
      {
        titre: "Nginx",
        snippet: {
          langage: "nginx",
          code: `add_header X-Frame-Options "DENY" always;`,
        },
        corps:
          "Utiliser DENY si aucune page du site n'a vocation à être embarquée. Utiliser SAMEORIGIN si certaines pages sont embarquées dans d'autres pages du même domaine.",
      },
      {
        titre: "Apache",
        snippet: {
          langage: "apache",
          code: `Header always set X-Frame-Options "DENY"`,
        },
        corps: "",
      },
      {
        titre: "WordPress",
        corps:
          "Via plugin HTTP Headers, ou dans functions.php :",
        snippet: {
          langage: "php",
          code: `add_action('send_headers', function() {
  header('X-Frame-Options: DENY');
});`,
        },
      },
    ],
  },

  x_frame_options_mal_configure: {
    etapes: [
      {
        titre: "Corriger la valeur",
        corps:
          "La valeur ALLOW-FROM n'est plus supportée par les navigateurs modernes. Utiliser DENY ou SAMEORIGIN, ou passer par CSP frame-ancestors (plus flexible).",
        snippet: {
          langage: "nginx",
          code: `# Au lieu de X-Frame-Options avec ALLOW-FROM, utiliser CSP :
add_header Content-Security-Policy "frame-ancestors https://partenaire.com" always;`,
        },
      },
    ],
  },

  x_content_type_options_absent: {
    etapes: [
      {
        titre: "Ajouter l'en-tête nosniff",
        snippet: {
          langage: "nginx",
          code: `add_header X-Content-Type-Options "nosniff" always;`,
        },
        corps:
          "Un header universel sans effet de bord. Empêche le navigateur de deviner le type MIME d'un fichier (ex. un .txt interprété comme JS).",
      },
      {
        titre: "Apache",
        snippet: {
          langage: "apache",
          code: `Header always set X-Content-Type-Options "nosniff"`,
        },
        corps: "",
      },
    ],
  },

  referrer_policy_absent: {
    etapes: [
      {
        titre: "Définir une politique restrictive",
        snippet: {
          langage: "nginx",
          code: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
        },
        corps:
          "strict-origin-when-cross-origin est le compromis optimal : envoie l'URL complète en same-origin, uniquement l'origine en cross-origin HTTPS→HTTPS, rien en HTTPS→HTTP.",
      },
    ],
  },

  referrer_policy_faible: {
    etapes: [
      {
        titre: "Renforcer la politique",
        corps:
          "Remplacer la valeur actuelle par strict-origin-when-cross-origin ou same-origin (plus strict si tu n'as pas besoin de l'origin cross-site).",
      },
    ],
  },

  permissions_policy_absent: {
    etapes: [
      {
        titre: "Déclarer explicitement les APIs autorisées",
        snippet: {
          langage: "nginx",
          code: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self), payment=()" always;`,
        },
        corps:
          "Lister chaque capacité et son origine autorisée. () = aucune. (self) = seulement ce domaine. Pour autoriser un iframe tiers : (self \"https://partenaire.com\").",
      },
    ],
    references: [
      {
        nom: "Permissions-Policy generator",
        url: "https://www.permissionspolicy.com/",
      },
    ],
  },

  server_version_exposee: {
    etapes: [
      {
        titre: "Nginx",
        snippet: {
          langage: "nginx",
          code: `# Dans nginx.conf, bloc http :
server_tokens off;`,
        },
        corps:
          "Masque la version Nginx dans les headers Server et les pages d'erreur.",
      },
      {
        titre: "Apache",
        snippet: {
          langage: "apache",
          code: `# Dans httpd.conf ou apache2.conf :
ServerTokens Prod
ServerSignature Off`,
        },
        corps:
          "ServerTokens Prod réduit le header à 'Apache'. ServerSignature Off retire la signature des pages d'erreur.",
      },
    ],
  },

  x_powered_by_expose: {
    etapes: [
      {
        titre: "PHP",
        snippet: {
          langage: "php",
          code: `# Dans php.ini :
expose_php = Off`,
        },
        corps: "",
      },
      {
        titre: "Express (Node.js)",
        snippet: {
          langage: "javascript",
          code: `app.disable('x-powered-by');`,
        },
        corps: "",
      },
      {
        titre: "Nginx (proxy)",
        snippet: {
          langage: "nginx",
          code: `proxy_hide_header X-Powered-By;`,
        },
        corps: "",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER TLS
  // ═══════════════════════════════════════════════════════════════

  tls_connexion_impossible: {
    etapes: [
      {
        titre: "Diagnostic réseau",
        corps:
          "Vérifier que le port 443 est bien ouvert : telnet domaine.tld 443. Vérifier la config du pare-feu, du load balancer, et que le serveur écoute bien sur 443.",
      },
      {
        titre: "Vérifier le serveur web",
        corps:
          "Nginx : nginx -t puis systemctl status nginx. Apache : apachectl configtest puis systemctl status apache2. S'assurer que la configuration SSL est chargée.",
      },
    ],
  },

  cert_expire: {
    etapes: [
      {
        titre: "Action immédiate — renouveler le certificat",
        corps:
          "Les navigateurs affichent une page rouge bloquante. Chaque minute compte. Si Let's Encrypt : relancer certbot renew. Sinon : contacter l'autorité de certification.",
        snippet: {
          langage: "bash",
          code: `# Let's Encrypt / certbot
sudo certbot renew --force-renewal
sudo systemctl reload nginx`,
        },
      },
      {
        titre: "Après renouvellement",
        corps:
          "Vérifier la nouvelle date d'expiration : echo | openssl s_client -connect domaine.tld:443 2>/dev/null | openssl x509 -noout -dates",
      },
    ],
  },

  cert_expiration_imminente: {
    etapes: [
      {
        titre: "Lancer le renouvellement maintenant",
        corps:
          "Expiration dans moins de 7 jours. Procéder immédiatement au renouvellement pour laisser le temps à la propagation.",
        snippet: {
          langage: "bash",
          code: `sudo certbot renew
sudo systemctl reload nginx`,
        },
      },
    ],
  },

  cert_expiration_proche: {
    etapes: [
      {
        titre: "Vérifier le renouvellement automatique",
        corps:
          "Si Let's Encrypt / certbot : vérifier que le cron de renouvellement est actif. Normalement certbot renew tourne 2 fois par jour via systemd timer ou crontab.",
        snippet: {
          langage: "bash",
          code: `# Vérifier le timer certbot
systemctl list-timers certbot
# Test à blanc du renouvellement
sudo certbot renew --dry-run`,
        },
      },
    ],
  },

  san_absent: {
    etapes: [
      {
        titre: "Régénérer avec SAN",
        corps:
          "Les certificats modernes doivent avoir au moins un SAN (Subject Alternative Name). Lors de la génération, inclure tous les domaines concernés :",
        snippet: {
          langage: "bash",
          code: `sudo certbot --nginx -d domaine.tld -d www.domaine.tld`,
        },
      },
    ],
  },

  protocole_tls_obsolete: {
    etapes: [
      {
        titre: "Nginx — Désactiver les anciens protocoles",
        snippet: {
          langage: "nginx",
          code: `# Dans le bloc server HTTPS :
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers "EECDH+AESGCM:EDH+AESGCM";`,
        },
        corps: "",
      },
      {
        titre: "Apache",
        snippet: {
          langage: "apache",
          code: `SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
SSLCipherSuite HIGH:!aNULL:!MD5`,
        },
        corps: "",
      },
    ],
    references: [
      {
        nom: "Mozilla SSL Configuration Generator",
        url: "https://ssl-config.mozilla.org/",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER EXPOSITION
  // ═══════════════════════════════════════════════════════════════

  interfaces_admin_exposees: {
    etapes: [
      {
        titre: "Option 1 — Restriction par IP (Nginx)",
        snippet: {
          langage: "nginx",
          code: `location /wp-admin {
  allow 203.0.113.42; # Ton IP de bureau
  allow 198.51.100.0/24; # Ton VPN
  deny all;
}`,
        },
        corps:
          "Autoriser uniquement les IPs connues. Attention : à combiner avec un VPN si tu travailles depuis des réseaux variables.",
      },
      {
        titre: "Option 2 — Authentification à deux facteurs",
        corps:
          "Sur WordPress : installer Wordfence, miniOrange 2FA, ou Two Factor Authentication (plugin officiel). Impose un code TOTP (Google Authenticator) à chaque connexion admin.",
      },
      {
        titre: "Option 3 — Renommer le chemin d'admin",
        corps:
          "Pour WordPress : plugin WPS Hide Login change /wp-admin en /mon-chemin-secret. Ne protège pas d'une attaque ciblée mais stoppe 95% des bots scanners.",
      },
    ],
  },

  robots_txt_absent: {
    etapes: [
      {
        titre: "Créer le fichier robots.txt",
        corps:
          "Déposer un fichier texte à la racine du site, accessible à https://domaine.tld/robots.txt",
        snippet: {
          langage: "text",
          code: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: https://domaine.tld/sitemap.xml`,
        },
      },
    ],
  },

  security_txt_absent: {
    etapes: [
      {
        titre: "Créer /.well-known/security.txt",
        corps:
          "Déposer le fichier à l'URL /.well-known/security.txt (RFC 9116). Permet aux chercheurs en sécurité de te contacter en cas de vulnérabilité découverte.",
        snippet: {
          langage: "text",
          code: `Contact: mailto:security@domaine.tld
Expires: 2026-12-31T23:59:59Z
Preferred-Languages: fr, en
Canonical: https://domaine.tld/.well-known/security.txt`,
        },
      },
    ],
    references: [
      { nom: "Générateur securitytxt.org", url: "https://securitytxt.org/" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER COOKIES
  // ═══════════════════════════════════════════════════════════════

  cookie_sans_secure: {
    etapes: [
      {
        titre: "Marquer les cookies Secure côté application",
        corps:
          "PHP : ini_set('session.cookie_secure', 1) ou dans php.ini. Express : app.use(session({ cookie: { secure: true } })). WordPress : define('FORCE_SSL_ADMIN', true) dans wp-config.php.",
      },
    ],
  },

  cookie_sans_httponly: {
    etapes: [
      {
        titre: "Marquer les cookies HttpOnly",
        corps:
          "PHP : ini_set('session.cookie_httponly', 1). Express/connect : { httpOnly: true } dans les options cookie. Node brut : response.setHeader('Set-Cookie', 'session=xxx; HttpOnly; Secure; SameSite=Lax').",
      },
    ],
  },

  cookie_sans_samesite: {
    etapes: [
      {
        titre: "Ajouter SameSite",
        corps:
          "PHP ≥ 7.3 : ini_set('session.cookie_samesite', 'Lax'). Express : { sameSite: 'lax' }. Pour un cookie défini manuellement : Set-Cookie: name=value; SameSite=Lax; Secure.",
      },
    ],
  },

  cookie_samesite_none_sans_secure: {
    etapes: [
      {
        titre: "Deux options",
        corps:
          "1) Activer Secure sur ce cookie si tu as besoin du cross-origin (iframe tiers, SSO). 2) Passer en SameSite=Lax si le cross-origin n'est pas nécessaire. Les navigateurs rejettent SameSite=None sans Secure depuis 2020.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER CONTENU
  // ═══════════════════════════════════════════════════════════════

  mixed_content: {
    etapes: [
      {
        titre: "Remplacer http:// par https:// partout",
        corps:
          "Chercher dans le HTML, le CSS, le JS, les templates et la base de données toutes les occurrences de http:// pointant vers des ressources (images, scripts, iframes, CSS, fonts).",
      },
      {
        titre: "WordPress",
        corps:
          "Utiliser le plugin Better Search Replace pour remplacer http://ton-domaine.tld par https://ton-domaine.tld en base. Attention à sauvegarder avant.",
      },
      {
        titre: "Autoriser le navigateur à upgrader automatiquement",
        corps:
          "En complément, ajouter à la CSP : upgrade-insecure-requests. Transforme automatiquement les requêtes http:// en https:// pour les ressources mixtes.",
        snippet: {
          langage: "nginx",
          code: `add_header Content-Security-Policy "upgrade-insecure-requests" always;`,
        },
      },
    ],
  },

  iframes_tiers_sans_sandbox: {
    etapes: [
      {
        titre: "Ajouter l'attribut sandbox",
        corps:
          "Isoler le contenu embarqué de la page parente. L'attribut sandbox sans valeur bloque TOUT (scripts, formulaires, popups, same-origin). Ajouter les permissions nécessaires :",
        snippet: {
          langage: "html",
          code: `<!-- Minimal (bloque tout) -->
<iframe src="https://widget-tiers.com" sandbox></iframe>

<!-- Permissif (scripts + même origine) -->
<iframe src="https://widget-tiers.com" sandbox="allow-scripts allow-same-origin"></iframe>`,
        },
      },
    ],
  },

  form_action_http: {
    etapes: [
      {
        titre: "Corriger immédiatement les action HTTP",
        corps:
          "Chaque formulaire avec action=\"http://...\" transmet les données saisies en clair. À remplacer d'urgence par https:// (ou une URL relative /chemin).",
        snippet: {
          langage: "html",
          code: `<!-- Avant (DANGEREUX) -->
<form action="http://domaine.tld/login">

<!-- Après -->
<form action="https://domaine.tld/login">
<!-- Encore mieux : URL relative -->
<form action="/login">`,
        },
      },
    ],
  },

  cms_version_exposee: {
    etapes: [
      {
        titre: "WordPress — Retirer la balise generator",
        snippet: {
          langage: "php",
          code: `// Dans functions.php ou mu-plugin
remove_action('wp_head', 'wp_generator');`,
        },
        corps: "",
      },
      {
        titre: "Supprimer les autres indices",
        corps:
          "Masquer /readme.html, /license.txt, /wp-includes/version.php, et retirer la version dans les URLs d'assets (?ver=X.X.X).",
      },
    ],
  },

  target_blank_sans_noopener: {
    etapes: [
      {
        titre: "Ajouter rel=\"noopener noreferrer\" systématiquement",
        snippet: {
          langage: "html",
          code: `<a href="https://externe.com" target="_blank" rel="noopener noreferrer">
  Lien externe
</a>`,
        },
        corps:
          "Depuis les navigateurs récents (Chrome 88+, Firefox 79+) ce comportement est le défaut implicite, mais l'ajout explicite garantit la protection sur tous les navigateurs.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER RÉPUTATION
  // ═══════════════════════════════════════════════════════════════

  https_non_force: {
    etapes: [
      {
        titre: "Nginx — Redirection 301",
        snippet: {
          langage: "nginx",
          code: `# Bloc server HTTP (port 80)
server {
  listen 80;
  server_name domaine.tld www.domaine.tld;
  return 301 https://$host$request_uri;
}`,
        },
        corps: "",
      },
      {
        titre: "Apache — Redirection via .htaccess",
        snippet: {
          langage: "apache",
          code: `RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`,
        },
        corps: "",
      },
      {
        titre: "WordPress",
        corps:
          "Dans wp-config.php : define('FORCE_SSL_ADMIN', true). Plugin Really Simple SSL gère la redirection complète automatiquement.",
      },
    ],
  },

  redirect_http_vers_http: {
    etapes: [
      {
        titre: "Corriger la cible de la redirection",
        corps:
          "La règle de redirection existe mais pointe vers HTTP au lieu de HTTPS. Reprendre les snippets de https_non_force en vérifiant bien le préfixe https:// dans la cible.",
      },
    ],
  },

  http_sert_contenu: {
    etapes: [
      {
        titre: "Deux options",
        corps:
          "1) Fermer le port 80 au niveau du pare-feu (brutal mais efficace). 2) Configurer le serveur pour rediriger systématiquement vers HTTPS (recommandé — reprendre les snippets https_non_force).",
      },
    ],
  },
};
