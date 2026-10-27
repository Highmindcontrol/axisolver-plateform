=== AxiSolver — Assistant IA pour votre site ===
Contributors: ataraxis
Tags: ai, chatbot, assistant, chat, customer-support, lead-generation
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AxiSolver est l'assistant IA d'Ataraxis qui accueille vos visiteurs 24h/24, qualifie leurs demandes et répond en citant les sources de votre site.

== Description ==

AxiSolver remplace les chatbots classiques (Intercom, Crisp, Drift…) par un vrai assistant IA qui **résout** au lieu de **discuter**.

Pour qui ?
Pour toute entreprise avec un site web qui veut :

* Accueillir ses visiteurs 24h/24 sans mobiliser son équipe
* Qualifier les prospects avant qu'ils ne demandent une démo
* Répondre précisément sur ses propres contenus (crawl automatique de votre site + upload PDF)
* Détecter les leads chauds et les router vers le bon commercial
* Résoudre les demandes support basiques sans ticket

Comment ça marche ?

1. Créez un compte gratuit sur [axisolver.app](https://axisolver.app)
2. Enregistrez votre site, choisissez votre secteur
3. Copiez votre `site_id`, collez-le dans les réglages du plugin
4. Le widget apparaît en bas à droite de toutes vos pages publiques

Toutes les options avancées (branding, options d'accueil, base de connaissances, tickets, analytiques) se configurent depuis votre dashboard AxiSolver.

**Confidentialité des données** : AxiSolver est un produit français de l'écosystème Ataraxis. Serveurs en Union européenne (Vercel + Supabase eu-west). RGPD-compliant.

**Souveraineté IA** : AxiSolver utilise plusieurs modèles IA (Claude, GPT) mais garde la propriété de ses propres prompts et flux de conversation. Pas de SaaS tiers interposé.

== Installation ==

1. Dans l'admin WordPress → Extensions → Ajouter → cherchez « AxiSolver »
2. Cliquez sur « Installer » puis « Activer »
3. Allez dans Réglages → AxiSolver
4. Collez votre `site_id` récupéré depuis [axisolver.app/dashboard](https://axisolver.app/dashboard)
5. Enregistrez — c'est en ligne

Ouvrez votre site dans un onglet privé pour voir le cercle rayonnant AxiSolver apparaître en bas à droite.

== Frequently Asked Questions ==

= Est-ce que c'est gratuit ? =

Le plugin WordPress est gratuit et open-source (GPL). AxiSolver lui-même est un service payant à partir d'un abonnement mensuel. Un essai gratuit est proposé sur [axisolver.app](https://axisolver.app).

= Où trouver mon site_id ? =

Dans votre dashboard AxiSolver, sur la page du site concerné. Format : lettres minuscules, chiffres, tirets (ex. `cabinet-dupont`).

= Le widget apparaît sur toutes les pages ? =

Oui, le script loader est injecté dans le footer de toutes les pages publiques (pas dans l'admin). Vous pouvez temporairement le masquer en décochant « Afficher le widget » dans les réglages, sans désinstaller le plugin.

= Est-ce que ça ralentit mon site ? =

Non. Le script loader fait moins de 5 KB, est chargé en `async` (ne bloque pas le rendu), et l'iframe du chat ne se charge qu'au premier clic du visiteur.

= Puis-je personnaliser l'apparence ? =

Oui, toute la personnalisation (couleurs, nom de l'assistant, options d'accueil, langues…) se fait depuis votre dashboard AxiSolver. Les changements s'appliquent instantanément sans redéployer.

= Mon site est multilingue, est-ce supporté ? =

Oui, AxiSolver détecte la langue du visiteur et répond dans celle-ci parmi les langues activées sur votre site. 8 langues supportées en V1 (FR, EN, ES, DE, IT, PT, NL, AR).

= Comment ça gère la base de connaissances ? =

Depuis votre dashboard, vous pouvez ingérer : votre URL de page d'accueil, votre sitemap complet, des PDF uploadés (tarifs, documentation…). AxiSolver chunke tout, génère des embeddings, et cite la source quand il répond.

= Et les demandes de support classiques ? =

AxiSolver qualifie, répond quand il peut, et crée un ticket référencé AXI-XXXX quand il doit router vers un humain. Vous consultez les tickets depuis votre dashboard.

== Screenshots ==

1. Le widget AxiSolver sur un site, cercle rayonnant en bas à droite
2. L'iframe de chat ouverte, avec les options d'accueil cliquables
3. Le dashboard AxiSolver — gestion de vos sites
4. La configuration : branding, nom de l'assistant, voix, langues
5. La page de réglages du plugin WordPress : un seul champ à remplir

== Changelog ==

= 1.0.0 =
* Première version
* Injection du loader AxiSolver dans le footer
* Page de réglages sous Settings → AxiSolver avec champ `site_id`
* Toggle activer/désactiver le widget
* Sanitize strict des entrées
* Lien direct « Réglages » depuis la liste des plugins

== Upgrade Notice ==

= 1.0.0 =
Première version du plugin AxiSolver pour WordPress.
