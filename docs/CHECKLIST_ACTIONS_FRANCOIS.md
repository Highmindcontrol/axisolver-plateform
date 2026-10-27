# AxiSolver — Checklist des actions humaines à mener

Document exhaustif de tout ce que François doit faire **manuellement** pour que la V1 AxiSolver soit opérationnelle, soumise aux marketplaces, et prête au lancement commercial. Les tâches techniques (code, migrations, UI) sont déjà livrées côté repo.

**Dernière mise à jour** : 27 octobre 2026 (fin LOT G)

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

## 8. Stripe (LOT K — pas encore livré)

Préparation à faire côté toi avant que je code le LOT K :

### 8.1 — Compte Stripe

- [ ] Vérifier compte Stripe Ataraxis Holding Ltd actif
- [ ] Activer le mode Live (après vérifications KYC)

### 8.2 — Produits à créer dans Stripe Dashboard

Suggestion de pricing (à arbitrer avec toi) :

| Nom produit | Prix mensuel | Features | Usage |
|---|---|---|---|
| AxiSolver Starter | 99 € HT | 1 site, 500 conversations/mois | Standard |
| AxiSolver Pro | 299 € HT | 5 sites, 5000 conversations/mois, retrait « Propulsé par » | PME |
| AxiSolver Enterprise | sur devis | Sites illimités, conversations illimitées, SLA, support dédié | Grands comptes |

- [ ] Créer les 3 produits dans Stripe Dashboard → Products
- [ ] Noter les `price_id` que je devrai utiliser dans le code

### 8.3 — Webhooks Stripe

- [ ] Créer un endpoint webhook : `https://axisolver.app/api/webhooks/stripe`
- [ ] Événements à écouter : `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Noter le webhook signing secret pour la variable d'env

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

---

## Pour télécharger ce document

Ce fichier vit dans le repo : https://github.com/Highmindcontrol/axisolver-platform/blob/main/docs/CHECKLIST_ACTIONS_FRANCOIS.md

Pour le télécharger en version Markdown :
1. Ouvrir le lien ci-dessus
2. Cliquer sur « Raw » en haut à droite
3. Clic-droit → « Enregistrer sous… »

Je mettrai à jour ce document à chaque nouveau LOT livré.
