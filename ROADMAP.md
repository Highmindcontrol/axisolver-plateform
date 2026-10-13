# AxiSolver — Roadmap de construction

> *AxiSolver parle avec vos visiteurs. Veille sur votre site. Travaille à côté de vous. Et sait aussi s'amuser. Un seul produit. Zéro concurrent au monde.*
>
> Doctrine complète figée dans [`docs/adr/001-vision-produit-complete.md`](docs/adr/001-vision-produit-complete.md).

---

## Les quatre missions d'AxiSolver (ADR 001)

Un seul produit, quatre missions, un seul tarif :

1. **Accueil visiteur** 24/7, voix et écrit, dans toutes les langues
2. **Veille SEO** — audit initial + monitoring hebdomadaire + rapport mensuel
3. **Veille sécurité** — audit initial + alertes régressions + CVE monitoring
4. **Veille métriques** — connexion analytics + rapport mensuel narratif

**Pas de version Lite.** Pas de pack « Essentiel » / « Vigilance » / « 360 ».
Les entreprises qui ne veulent pas AxiSolver complet achètent sur AxiHub
des **packs AXI séparés** (SEO, Sécurité, Métriques) — mais le prix cumulé
dépasse celui d'AxiSolver complet, d'où l'upsell automatique.

---

## Les 4 features signature (uniques au monde)

Ce qui place AxiSolver hors catégorie face aux chatbots :

| # | Feature | Impact |
|---|---|---|
| 🪞 | **Interface vivante split-view** | Chat à gauche, panneau de travail à droite — le visiteur voit AXI prendre ses notes en live |
| 📋 | **Rapport triple-voie** | Chaque faille détectée vient avec 3 solutions (agence / soi-même / méthode pas-à-pas) |
| 🧐 | **Quatre missions, un tarif** | Accueil + SEO + Sécurité + Métriques dans un seul produit |
| 🎯 | **La touche morpion** | À la fin de la conversation résolue, AXI propose un morpion → rupture mémorable |

---

## Lots de travail — par ordre d'attaque

### Lot 0 — Fondations (fait ou en cours)
- [x] Squelette Next.js 16.4.0 + Tailwind v4 déployé sur axisolver.app
- [x] Landing marketing V1 (hero + comparatif + capacités + CTA AxiHub)
- [x] Widget chat live avec streaming SSE sur `/api/chat`
- [x] System prompt punchy auto-vendeur (ADR 001 intégré)
- [x] Doctrine `docs/doctrine-capacites.md` + ADR 001 figés
- [ ] Pose `ANTHROPIC_API_KEY` dans Vercel (côté François)

### Lot A — Interface vivante split-view (PRIORITÉ — différenciant visuel)
**Objectif** : le widget passe de 1 colonne (chat) à 2 colonnes (chat + panneau de travail).

- [ ] Refonte UI du widget en split-view (desktop) + bottom sheet (mobile)
- [ ] Système de **Tool Calling Claude** côté API (`/api/chat` renvoie tool_use chunks en plus du texte)
- [ ] Composant `FicheVisiteur` : prénom, email, téléphone, demande, chaleur — remplissage live
- [ ] Composant `ChampEmailValide` : input email + regex + confirmation
- [ ] Composant `ChampTelephoneValide` : input tel + formatage auto
- [ ] Composant `BoutonsChoix` : 2-4 boutons cliquables
- [ ] Composant `LienTelechargement`
- [ ] Composant `PageWebEmbarquee` : iframe léger
- [ ] Composant `ReferenceAxiXXXX` : encadré de clôture
- [ ] Design responsive mobile (bottom sheet animé)
- [ ] Mise à jour system prompt pour piloter les tools proprement

### Lot B — Audit SEO/Sécurité/Métriques initial + rapport PDF
**Objectif** : à l'installation, AxiSolver scanne le site hôte et produit un rapport.

#### B.1 — Audit SEO
- [ ] Fetch HTML public + parsing (cheerio ou linkedom)
- [ ] Checks : title, meta description, H1-H6, OG, canonicals, hreflang, alt text, sitemap.xml, robots.txt
- [ ] Audit performance : appel Google PageSpeed Insights API (gratuite)
- [ ] Audit structured data (JSON-LD Schema.org)

#### B.2 — Audit sécurité
- [ ] Headers HTTP : HSTS, CSP, X-Frame-Options, Permissions-Policy, Referrer-Policy
- [ ] Certificat SSL + chaîne complète
- [ ] Fichiers sensibles exposés (`.env`, `.git/`, `wp-config.php~`, backups)
- [ ] Bibliothèques JS obsolètes avec CVE (via retire.js dataset)
- [ ] DNS sécurité : DNSSEC, SPF/DKIM/DMARC, CAA
- [ ] Blacklist check (Google Safe Browsing API gratuite)
- [ ] Si WordPress détecté : version, plugins, thème, xmlrpc.php, user enumeration, backups accessibles → API wpscan.com

#### B.3 — Audit métriques (si Analytics connecté)
- [ ] OAuth Google Analytics 4 (ou clé Plausible/Matomo)
- [ ] Lecture métriques du mois : visiteurs, bounce, pages de fuite, parcours
- [ ] Analyse narrative par Claude Opus

#### B.4 — Rapport PDF triple voie
- [ ] Génération via `@react-pdf/renderer` (déjà utilisé dans ataraxis-platform)
- [ ] Design : page de garde + sections SEO/Sécu/Métriques + plan d'action priorisé
- [ ] Pour chaque faille → 3 variantes de solution (agence / soi-même / méthode pas-à-pas) générées par Claude Opus
- [ ] Envoi email Brevo au tenant + archivage console admin

### Lot C — Infrastructure Supabase (nécessaire pour Lot B + D)
- [ ] Projet Supabase Frankfurt dédié AxiSolver
- [ ] Schema `axi_solver` :
  - `tenants` (entreprise cliente)
  - `tenant_members` (admins autorisés)
  - `conversations` + `messages`
  - `tickets` (AXI-XXXX, résumé, chaleur, statut)
  - `visitors` (reconnaissance return)
  - `audits_seo`, `audits_securite`, `audits_metriques` (historique mois après mois)
  - `briefings` (rapport PDF + brief matinal)
- [ ] RLS strict `tenant_id` partout

### Lot D — Monitoring continu + alertes régressions
- [ ] Cron hebdomadaire : re-run audit SEO + Sécu, diff vs semaine précédente
- [ ] Alertes email si régression détectée (CLS qui grimpe, nouveau header manquant, broken link, nouveau CVE actif)
- [ ] Rapport mensuel narratif automatique
- [ ] Console admin tenant pour historique + téléchargement archives

### Lot E — La cerise morpion + extensions ludiques
- [ ] Composant `GrilleMorpion` (3×3 React)
- [ ] IA minimax légère (gagne 50%, perd 25%, égalité 25%)
- [ ] Tool Claude `proposer_jeu_morpion` déclenché à la fin de conversation
- [ ] Garde-fous : jamais si urgent/litigieux/secteur sensible
- [ ] Config tenant : activer/désactiver le morpion dans AxiHub
- [ ] V2 : mini-leaderboard, code promo partenaire si bat AXI 3×

### Lot F — Protocole Duo (quand AXI maison présent via AxiHub)
- [ ] WebSocket AXI-to-AXI pour interrogation live
- [ ] Délégation d'action (RDV, mail, devis)
- [ ] Validation en 2 temps (prix personnalisé)
- [ ] Enrichissement contextuel via CRM
- [ ] Debriefing bidirectionnel
- [ ] Co-présence sur dossiers chauds

### Lot G — Onboarding automatique (via AxiHub)
- [ ] AXI d'onboarding sur AxiHub qui interroge le dirigeant (15-30 min)
- [ ] Crawl automatique du site public → éducation produit
- [ ] Lecture CGV, FAQ, politique → doctrine commerciale
- [ ] Génération system prompt custom pour ce tenant
- [ ] Snippet JS généré avec `data-tenant` pré-rempli

### Lot H — Soumission moteurs/annuaires (phase ultérieure)
- [ ] Soumission Google Search Console (OAuth client)
- [ ] Soumission IndexNow (Bing, Yandex, DuckDuckGo)
- [ ] Soumission annuaires sectoriels (API par vertical)
- [ ] Génération de meta descriptions optimisées pour pages à faible CTR

### Lot I — Pages marketing complémentaires
- [ ] Page `/mentions-legales`
- [ ] Page `/cgv`
- [ ] Page `/comment-ca-marche`
- [ ] Page `/cas-usage` (avocat, agence immo, cabinet comptable, boutique, restaurant…)
- [ ] Favicon + apple-touch-icon + manifest PWA
- [ ] Image OG dédiée AxiSolver (partage réseaux sociaux)
- [ ] Analytics opt-in (Plausible, pas Google)

---

## Stack technique

| Couche | Technologie | Raison |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR + routes API + edge-ready |
| TypeScript | ^5 strict | type safety end-to-end |
| Styling | Tailwind v4 | cohérence avec reste écosystème |
| DB | Supabase Postgres (Frankfurt) | RGPD + RLS natif |
| ORM | Drizzle | léger, édition schema propre |
| LLM | Anthropic SDK | Haiku 4.5 conversation, Sonnet 4.6 complexité, Opus 4.7 synthèses |
| Email | Brevo REST | SMTP éprouvé |
| PDF | @react-pdf/renderer | déjà en place dans ataraxis-platform |
| STT | OpenAI Whisper API | qualité + latence |
| TTS | ElevenLabs (fallback Web Speech) | voix naturelle |
| Deploy | Vercel | continuité écosystème |
| Analytics tenant | GA4 ou Plausible/Matomo | selon choix client |
| Audit SEO | cheerio + Google PageSpeed Insights API | gratuit |
| Audit sécu | retire.js + API wpscan.com + Google Safe Browsing | gratuit |

---

## Priorité absolue de la prochaine session

**Attaquer le Lot A — Interface vivante split-view.** C'est la feature qui :
- Transforme visuellement axisolver.app immédiatement
- Place AxiSolver dans une catégorie à part
- Est faisable en 5-7 jours concentrés
- Débloque mécaniquement les Lots D et E (ils dépendent du système de tools)

**Note** : les Lots B/C/D (audit + Supabase + monitoring) sont le plus gros chantier backend. On les attaquera après le Lot A pour qu'axisolver.app ait d'abord sa signature visuelle.

---

## Phrase de signature produit

> *« AxiSolver parle avec vos visiteurs. Veille sur votre site. Travaille à côté de vous. Et sait aussi s'amuser. Un seul produit. Zéro concurrent au monde. »*
