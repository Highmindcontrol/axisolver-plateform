# AxiSolver — Checklist des actions humaines à mener

Document exhaustif de tout ce que François doit faire **manuellement** pour que la V1 AxiSolver soit opérationnelle, soumise aux marketplaces, et prête au lancement commercial. Les tâches techniques (code, migrations, UI) sont déjà livrées côté repo.

**Dernière mise à jour** : 27 octobre 2026 (fin LOT K)

**Comment utiliser ce document** :
- Chaque section a une colonne « Statut » à cocher au fur et à mesure
- Les URLs sont cliquables (ouvrir dans un navigateur)
- Les commandes à exécuter sont en bloc de code
- Les délais estimés sont indicatifs

---

## 1. Comptes à créer / vérifier

| Service | URL | Statut | Notes |
|---|---|---|---|
| Supabase projet `axisolver` | https://supabase.com/dashboard | ✅ fait | eu-west-1 Irlande, projet `gkbetjexrpaqmmmkmpir` |
| Vercel projet `axisolver-platform` | https://vercel.com/highmindcontrols-projects/axisolver-platform | ✅ fait | 1 seul projet, propre (ancien doublon supprimé) |
| Brevo (compte Ataraxis existant) | https://app.brevo.com | ✅ fait | SMTP key « supabase SMTP » utilisée |
| OpenAI API | https://platform.openai.com | ✅ fait | Clé posée sur Vercel |
| Anthropic Console | https://console.anthropic.com | ✅ fait | Clé posée sur Vercel |
| Azure Speech Service | https://portal.azure.com | ✅ fait | Clé + région posées sur Vercel |
| Serper.dev | https://serper.dev | ✅ fait | Clé posée sur Vercel |
| **wordpress.org Developer** | https://login.wordpress.org/register | ⬜ à créer | Nom suggéré : `ataraxis`. Nécessaire pour publier le plugin |
| **Google account pour GTM Gallery** | https://accounts.google.com | ⬜ à vérifier | Doit avoir accès à Tag Manager + répertoire public GitHub |
| **Shopify Partners** (V1.1) | https://partners.shopify.com | ⬜ à créer plus tard | Pour app Shopify V1.1 |
| **Wix Developer** (V1.1) | https://dev.wix.com | ⬜ à créer plus tard | Pour app Wix V1.1 |
| **Webflow Developer** (V1.1) | https://developers.webflow.com | ⬜ à créer plus tard | Pour app Webflow V1.1 |
| **Stripe** (LOT K) | https://stripe.com | ⬜ à vérifier | Compte Ataraxis Holding Ltd existant ? |

---

## 2. Supabase — configuration (vérifier que tout est bien en place)

### Project Settings → Authentication → SMTP Settings

- [x] Enable Custom SMTP coché
- [x] Sender email : `noreply@axisolver.app`
- [x] Sender name : `AxiSolver`
- [x] Host : `smtp-relay.brevo.com`
- [x] Port : `587`
- [x] Username : `91ab12001@smtp-brevo.com` (ou ton login SMTP Brevo réel)
- [x] Password : clé SMTP Brevo « supabase SMTP »

### Project Settings → Authentication → URL Configuration

- [x] Site URL : `https://axisolver.app`
- [x] Redirect URLs : `https://axisolver.app/**`

### Project Settings → Authentication → Providers → Email

- [x] Enable Confirmations : coché (confirmation email obligatoire)

### Project Settings → Authentication → Providers (optionnel OAuth)

À faire si tu veux activer les boutons OAuth (Google, LinkedIn, Facebook, Apple) qui sont déjà présents dans l'UI :

- [ ] **Google** : créer un OAuth 2.0 Client sur Google Cloud Console → coller client_id + secret dans Supabase
- [ ] **LinkedIn (OIDC)** : créer app sur LinkedIn Developers → coller client_id + secret
- [ ] **Facebook** : app Meta Developers → coller
- [ ] **Apple** : Apple Developer Program → Sign in with Apple → coller

### Templates emails (optionnel mais recommandé)

Les 4 templates HTML AxiSolver sont dans `docs/email-templates/` du repo. À copier-coller dans **Supabase → Authentication → Email Templates** :

- [ ] Confirm signup ← `01-confirm-signup.html`
- [ ] Reset password ← `02-reset-password.html`
- [ ] Magic link ← `03-magic-link.html`
- [ ] Change email address ← `04-change-email.html`

---

## 3. Vercel — variables d'environnement (vérifier)

**Lien direct** : https://vercel.com/highmindcontrols-projects/axisolver-platform/settings/environment-variables

Toutes doivent être cochées en Production + Preview + Development :

| Variable | Statut | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Clé admin Supabase (bypass RLS) |
| `DATABASE_URL` | ✅ | Connection string pooler Postgres |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://axisolver.app` |
| `ANTHROPIC_API_KEY` | ✅ | Claude pour `/api/chat` |
| `OPENAI_API_KEY` | ✅ | Embeddings + transcription Whisper |
| `AZURE_SPEECH_KEY` | ✅ | TTS Azure |
| `AZURE_SPEECH_REGION` | ✅ | Ex. `francecentral` |
| `SERPER_API_KEY` | ✅ | Audit référencement SEO |
| `AXI_VOICE` | ✅ | Voix pré-configurée |
| `BREVO_API_KEY` (LOT G) | ⬜ | Clé API Brevo v3 (créer dans Brevo → SMTP & API → API keys) pour envoyer les rapports quotidiens |
| `CONTACT_FROM_EMAIL` (LOT G) | ⬜ | `noreply@axisolver.app` (expéditeur rapports) |
| `CONTACT_FROM_NAME` (LOT G) | ⬜ | `AxiSolver` |
| `CRON_SECRET` (LOT G) | ⬜ | Généré automatiquement par Vercel sur son plan Pro+ (header `Authorization: Bearer ${CRON_SECRET}` ajouté par Vercel sur appels cron). Si plan Hobby : générer soi-même et poser à la main. |
| `STRIPE_SECRET_KEY` (LOT K) | ⬜ | Facturation |
| `STRIPE_WEBHOOK_SECRET` (LOT K) | ⬜ | Webhooks Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (LOT K) | ⬜ | Clé publique Stripe |

---

## 4. Publication du plugin WordPress

### 4.1 — Préparation locale

- [ ] Vérifier que le dossier `wordpress-plugin/axisolver/` est à jour
- [ ] Zipper le dossier (depuis le repo) :
  ```bash
  cd wordpress-plugin
  zip -r axisolver.zip axisolver/ -x "*.DS_Store"
  ```

### 4.2 — Création des assets images

À créer avec Figma, Canva, Photoshop ou IA (Midjourney/DALL-E) et déposer dans `wordpress-plugin/axisolver/assets/` :

| Fichier | Dimensions | Format | Contenu suggéré |
|---|---|---|---|
| `icon-128x128.png` | 128×128 | PNG | Logo A gradient indigo/violet sur fond blanc |
| `icon-256x256.png` | 256×256 | PNG | Même logo en retina |
| `banner-772x250.png` | 772×250 | PNG | Bannière avec « AxiSolver » + sous-titre + visuel |
| `banner-1544x500.png` | 1544×500 | PNG | Bannière retina |
| `screenshot-1.png` | 1200×900 | PNG | Site exemple avec le cercle rayonnant en bas à droite |
| `screenshot-2.png` | 1200×900 | PNG | Chat ouvert avec options d'accueil cliquables |
| `screenshot-3.png` | 1200×900 | PNG | Dashboard AxiSolver (liste sites) |
| `screenshot-4.png` | 1200×900 | PNG | Page configuration (branding, voix, langues) |
| `screenshot-5.png` | 1200×900 | PNG | Page de réglages du plugin WordPress |

### 4.3 — Compte wordpress.org

- [ ] Créer compte sur https://login.wordpress.org/register si pas déjà fait
- [ ] Slug suggéré : `ataraxis` (unique pour tout l'écosystème)

### 4.4 — Soumission

- [ ] Aller sur https://wordpress.org/plugins/developers/add/
- [ ] Upload `axisolver.zip`
- [ ] Remplir le formulaire :
  - Nom : AxiSolver
  - Slug : axisolver
  - Description courte : reprendre du readme.txt
- [ ] Soumettre

### 4.5 — Review wordpress.org (2-4 semaines)

- [ ] Attendre email de l'équipe plugins.wordpress.org
- [ ] Répondre à leurs éventuelles questions sur :
  - La licence GPL
  - La sécurité (sanitize, escape)
  - L'absence de tracking caché
- [ ] Une fois approuvé, tu reçois les credentials SVN pour pousser les mises à jour

### 4.6 — Après publication

- [ ] Updater `app/dashboard/installation/guides.tsx` : remplacer `(bientôt publié)` par le vrai lien wordpress.org
- [ ] Mettre les 5 captures d'écran dans `wordpress-plugin/axisolver/assets/`
- [ ] Pousser une version sur le SVN wordpress.org :
  - `trunk/` : dernière version
  - `tags/1.0.0/` : snapshot V1.0.0
  - `assets/` : images du listing

---

## 5. Publication du template Google Tag Manager

### 5.1 — Repo GitHub public

Deux options :

- **Option A (plus propre)** : créer un repo GitHub public dédié `axisolver-gtm-template` et y mettre uniquement `gtm-template/template.tpl`
- **Option B (simple)** : garder le fichier dans `axisolver-platform/gtm-template/` et pointer le repo public principal

**Reco : Option A** pour isoler le template des releases AxiSolver platform.

- [ ] Créer repo `highmindcontrols/axisolver-gtm-template` sur GitHub (public)
- [ ] Copier `gtm-template/template.tpl` dedans
- [ ] Ajouter un README.md simple avec lien vers https://axisolver.app

### 5.2 — Soumission sur la Gallery

- [ ] Aller sur https://tagmanager.google.com (connecté avec ton compte Google Ataraxis)
- [ ] Dans Admin → Container → Templates → bouton « Add template » → charger `template.tpl`
- [ ] Tester le template dans un conteneur GTM test pour vérifier qu'il injecte bien le loader
- [ ] Soumettre via https://developers.google.com/tag-platform/tag-manager/templates/submission
  - Lien repo GitHub : `https://github.com/highmindcontrols/axisolver-gtm-template`
  - Catégorie : Chat ou Analytics
  - Email de contact : support@axisolver.app (ou ton email)

### 5.3 — Review Google (1-2 semaines)

- [ ] Attendre email de l'équipe Tag Manager
- [ ] Répondre aux questions éventuelles

### 5.4 — Après publication

- [ ] Updater `app/dashboard/installation/guides.tsx` : remplacer `(bientôt publié)` par le vrai lien de la Gallery

---

## 6. Domaine axisolver.app — vérifications

- [x] Domaine attaché au bon projet Vercel (`axisolver-platform` sans typo)
- [x] HTTPS/SSL actif
- [ ] Record DNS CAA (recommandé pour sécurité) :
  - Record type : CAA
  - Flag : 0
  - Tag : issue
  - Value : "letsencrypt.org"
  - À poser chez Squarespace (nameservers actuels)
- [ ] Record SPF (envoi mails Brevo) :
  - Doit déjà exister côté Brevo lors de l'auth du domaine
  - Vérifier avec `dig TXT axisolver.app +short`
- [ ] Record DKIM (idem via Brevo)

---

## 7. Images et branding AxiSolver

À créer et déposer dans le repo :

### Logos et icônes

- [ ] `public/logo-axisolver-signature.png` : logo horizontal pleine largeur (existe déjà apparemment)
- [ ] `public/logo-axisolver-carre.png` : logo carré 512×512 (pour favicon, apps mobiles futures)
- [ ] `public/favicon.ico` : 32×32 (le icon.png existe déjà, à vérifier)
- [ ] `public/apple-touch-icon.png` : 180×180

### Pour WordPress plugin

Déjà listées section 4.2.

### Pour template GTM

- [ ] Pas besoin d'images externes — l'icône est embarquée en base64 dans le template.tpl (déjà fait)

### Pour futures apps Shopify/Wix/Webflow (V1.1)

À prévoir quand ces chantiers démarreront :

- [ ] Logo Shopify App : 1024×1024 PNG
- [ ] Screenshots Shopify App : 1600×900 (3-5 captures)
- [ ] Wix App icons : 128×128 et 512×512
- [ ] Webflow App logo : 500×500 PNG

---

## 7bis. LOT G — Rapports quotidiens Brevo (livré)

Le cron Vercel envoie chaque matin à **6h UTC** (7h Paris en hiver, 8h en été) un rapport des 24 dernières heures à l'email de notification configuré sur chaque site (ou à l'email du compte owner par défaut).

### 7bis.1 — Clé API Brevo

- [ ] Dans Brevo → **SMTP & API** → **API keys** → bouton « Generate a new API key »
- [ ] Nom suggéré : `axisolver-rapports-prod`
- [ ] Copier la clé (visible une seule fois)
- [ ] La poser sur Vercel comme `BREVO_API_KEY` (prod + preview + dev)
- [ ] Poser aussi `CONTACT_FROM_EMAIL=noreply@axisolver.app` et `CONTACT_FROM_NAME=AxiSolver`

### 7bis.2 — Vercel Cron

Le fichier `vercel.json` configure le cron automatiquement au prochain déploiement :

```json
{ "crons": [{ "path": "/api/cron/rapports-quotidiens", "schedule": "0 6 * * *" }] }
```

- [ ] Vérifier dans Vercel → Project → **Crons** que le cron apparaît après le prochain deploy
- [ ] Sur plan **Pro ou Enterprise** : Vercel injecte automatiquement `CRON_SECRET` et l'ajoute dans le header `Authorization`
- [ ] Sur plan **Hobby** : les crons quotidiens sont supportés mais il faut poser `CRON_SECRET` à la main (générer avec `openssl rand -hex 32`)

### 7bis.3 — Test manuel

- [ ] Après deploy, aller sur https://axisolver.app/dashboard/sites/{slug}/rapports
- [ ] Cliquer « Envoyer maintenant » → vérifier réception de l'email
- [ ] Vérifier dans Brevo → **Transactional** → **Statistics** que l'email est bien parti

### 7bis.4 — Déclenchement manuel du cron (debug)

```bash
curl -X GET https://axisolver.app/api/cron/rapports-quotidiens \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Retourne un JSON `{ok, duree_ms, total, envoyes, echecs}`.

---

## 7ter. LOT H — Audits SEO + LOT I — Shield (livrés)

### Base de données

- [x] Exécuter dans Supabase SQL Editor : `drizzle/0009_seo_audits.sql`
- [x] Exécuter dans Supabase SQL Editor : `drizzle/0010_security_shield.sql`
- [ ] Exécuter dans Supabase SQL Editor : `drizzle/0011_ads_audits.sql`

Ces 3 migrations créent les tables :
- `seo_audits`, `security_audits`, `ads_audits` (scores mensuels + recommandations)
- `security_incidents` (alertes du monitoring 6h/jour)
- `security_monitorings` (snapshots status + hash + SSL)
- `rate_limits_chat` (shield widget /api/chat)

### Crons Vercel

Après prochain deploy, vérifier dans Vercel → Project → **Crons** que 5 crons apparaissent :

| Path | Schedule | Rôle |
|---|---|---|
| `/api/cron/rapports-quotidiens` | `0 6 * * *` | Rapport email tous les matins 7h Paris |
| `/api/cron/audits-seo-mensuels` | `0 7 1 * *` | Audit SEO le 1er du mois |
| `/api/cron/audits-security-mensuels` | `0 8 1 * *` | Audit sécurité le 1er du mois |
| `/api/cron/audits-ads-mensuels` | `0 9 1 * *` | Audit publicité le 1er du mois |
| `/api/cron/monitoring-security` | `0 */6 * * *` | Monitoring toutes les 6h |

### Shield widget automatique

Rien à configurer. Dès le deploy :
- rate limiting 60 msgs/min + 300 msgs/jour par visiteur (IP+UA hashé)
- blocage temporaire 15 min au-delà du seuil minute
- détection prompt injection sur les messages visiteur (patterns + unicode suspect)
- blocage soft avec HTTP 429 + header `Retry-After`

---

## 8. Stripe (LOT K — livré)

### 8.1 — Compte Stripe

- [ ] Vérifier compte Stripe Ataraxis Holding Ltd actif
- [ ] Activer le mode Live après KYC (démarrer en mode Test est OK le temps du beta)

### 8.2 — Produits à créer dans Stripe Dashboard

Les 3 formules AxiSolver standalone (prix fondateur, pack vs standalone +50 %) :

| Nom produit | Prix mensuel HT | Features |
|---|---|---|
| AxiSolver Starter | 39 € | 1 site, 500 conversations/mois, essai 14j |
| AxiSolver Pro | 59 € | 3 sites, 2 500 conv/mois, essai 14j, voix premium, « Propulsé par » masquable |
| AxiSolver Business | 149 € | 10 sites, 15 000 conv/mois, SLA 99,9 %, onboarding dédié |

- [ ] Stripe Dashboard → **Products** → créer les 3 produits
- [ ] Pour chaque produit, créer un **price récurrent mensuel** en EUR, HT (taxe gérée via Stripe Tax)
- [ ] Noter les 3 `price_id` (format `price_XXXXXX`) et les poser sur Vercel :
  - `STRIPE_PRICE_ID_STARTER`
  - `STRIPE_PRICE_ID_PRO`
  - `STRIPE_PRICE_ID_BUSINESS`

### 8.3 — Clés API Stripe sur Vercel

Dans Vercel → Project → Environment Variables :

- [ ] `STRIPE_SECRET_KEY` — clé secrète (Test puis Live)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — clé publique (facultatif pour V1, utile en V1.1 pour Elements)
- [ ] `STRIPE_WEBHOOK_SECRET` — généré à l'étape 8.4

### 8.4 — Endpoint Webhook

- [ ] Stripe Dashboard → **Developers → Webhooks → Add endpoint**
- [ ] URL : `https://axisolver.app/api/webhooks/stripe`
- [ ] Événements à sélectionner (minimum) :
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copier le **Signing Secret** (format `whsec_...`) et le poser comme `STRIPE_WEBHOOK_SECRET`

### 8.5 — Stripe Tax (facultatif mais recommandé)

- [ ] Stripe Dashboard → **Tax** → activer
- [ ] Déclarer la nexus France + UE (OSS si > 10 000 € de ventes B2C EU)
- [ ] Les sessions Checkout AxiSolver utilisent déjà `automatic_tax: enabled`

### 8.6 — Portail client

Déjà configuré côté code via `creerSessionPortail()`. Rien à faire côté Stripe Dashboard — le portail est activé par défaut.

### 8.7 — Base de données

- [ ] Exécuter dans Supabase SQL Editor : `drizzle/0012_stripe_facturation.sql`

Crée les tables `stripe_subscriptions` + `usage_conversations` et ajoute `stripe_customer_id` à `users`.

---

## 9. Communication et lancement

Quand la V1 sera prête à être annoncée (fin LOT K ou avant) :

### 9.1 — Pages marketing

- [ ] Page tarifs publique sur axisolver.app (hors dashboard)
- [ ] Page cas d'usage / clients témoins
- [ ] Page comparatif vs Intercom/Crisp/Drift

### 9.2 — Blog d'annonce

- [ ] Article « Pourquoi nous avons créé AxiSolver » sur ataraxis.group
- [ ] Article technique « Comment AxiSolver remplace votre chatbot en 30 secondes » sur blog AxiHub
- [ ] Cross-posting LinkedIn + X d'Ataraxis

### 9.3 — Partenaires d'évangélisation

- [ ] Identifier 10 agences/consultants qui pourraient devenir apporteurs d'affaires AxiSolver (commission 20 % à vie — doctrine simulateur-axisolver)
- [ ] Programme AXI Partner Launcher (chantier séparé) pour industrialiser

---

## 10. Checklist avant chaque release AxiSolver V1.x

Pour chaque mise à jour significative :

- [ ] Tester le flow signup → confirmation email → dashboard
- [ ] Tester la création d'un nouveau site
- [ ] Tester la vérification de propriété (balise meta + fichier + DNS)
- [ ] Tester l'ingestion d'une URL + d'un PDF
- [ ] Tester que le widget s'ouvre et répond sur un site réel (coryphea.com en test)
- [ ] Vérifier logs Vercel pour les erreurs runtime récentes
- [ ] Vérifier Brevo Statistics pour les mails sortants
- [ ] Vérifier Supabase Auth Logs

---

## Journal des modifications

- **27 oct 2026** : document créé après LOT F.1 + F.2 + F.3 (plugin WordPress + template GTM + dashboard installation enrichi)
- **27 oct 2026** : ajout section 7bis après LOT G (rapports quotidiens Brevo + cron Vercel 6h UTC + cheval de Troie upsell AXI Initial) ; nouvelles vars `BREVO_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_FROM_NAME`, `CRON_SECRET`
- **27 oct 2026** : ajout section 7ter après LOT H (moteur SEO + dashboard + cron mensuel 1er du mois) et LOT I (moteur Shield 6 piliers + dashboard incidents + monitoring 6h/jour + rate limiting /api/chat + anti prompt injection). 2 migrations SQL + 3 nouveaux crons Vercel.
- **27 oct 2026** : LOT J livré — moteur Ads 4 piliers (trackers, consentement, visibilité SERP, remarketing) + dashboard + cron mensuel 1er du mois à 9h UTC. Migration `drizzle/0011_ads_audits.sql` à exécuter. 5e cron ajouté.
- **27 oct 2026** : LOT K livré — facturation Stripe. 3 formules (Starter 39 € / Pro 59 € / Business 149 €), essai 14 jours Starter+Pro, Stripe Checkout + Portail client, webhook signé, metering mensuel conversations avec enforcement HTTP 402 au-delà du quota, page /tarifs publique, /dashboard/abonnement. Migration `drizzle/0012_stripe_facturation.sql` à exécuter + 3 produits Stripe à créer + webhook endpoint à configurer. Section 8 enrichie.

---

## Pour télécharger ce document

Ce fichier vit dans le repo : https://github.com/Highmindcontrol/axisolver-platform/blob/main/docs/CHECKLIST_ACTIONS_FRANCOIS.md

Pour le télécharger en version Markdown :
1. Ouvrir le lien ci-dessus
2. Cliquer sur « Raw » en haut à droite
3. Clic-droit → « Enregistrer sous… »

Je mettrai à jour ce document à chaque nouveau LOT livré.
