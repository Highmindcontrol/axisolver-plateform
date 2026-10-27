# AxiSolver — Setup base de données

Guide pour mettre en place Supabase + Drizzle depuis zéro.

## 1. Créer le projet Supabase

1. Aller sur https://supabase.com → New project
2. Nommer le projet `axisolver-prod` (ou `axisolver-dev` pour la préprod)
3. Noter la region (idéalement **eu-west-3 Paris** pour la souveraineté FR)
4. Choisir un mot de passe fort pour la DB

## 2. Récupérer les clés

Dans le dashboard Supabase du projet :

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Project API keys → anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Project API keys → service_role** → `SUPABASE_SERVICE_ROLE_KEY` (secret, serveur uniquement)
- **Settings → Database → Connection string → Session mode** → `DATABASE_URL`

Les coller dans `.env.local` à la racine du repo (copier depuis `.env.local.example`).

## 3. Appliquer les migrations

### Étape 1 — Schéma Drizzle (tables, enums, FK)

```bash
npx drizzle-kit push
```

Applique directement `lib/db/schema.ts` sur la DB. En prod on utilisera `migrate` avec les migrations générées (`drizzle/0000_init_multi_tenant.sql`).

### Étape 2 — Post-init Supabase (triggers, extensions, RLS)

Drizzle ne gère pas les triggers sur `auth.*`, les extensions ni les policies RLS. **À coller manuellement** dans le SQL Editor Supabase :

```
drizzle/0001_post_init_supabase.sql
```

Ce fichier est **idempotent** — safe à ré-exécuter si besoin.

Contenu :

- Extension `vector` (pgvector, préparation RAG LOT B)
- Trigger `on_auth_user_created` qui copie `auth.users` → `public.users` à chaque inscription
- RLS activée sur toutes les tables + policies owner-only + membres
- Fonction helper `public.user_a_acces_site(site_id)` utilisée par les policies

## 4. Configurer les providers OAuth

Dashboard Supabase → **Authentication → Providers** :

- **Google** : coller client ID + secret Google Cloud Console (OAuth 2.0 Client)
- **LinkedIn (OIDC)** : coller client ID + secret LinkedIn Developers (`linkedin_oidc`, pas l'ancien `linkedin`)
- **Facebook** et **Apple** : à configurer plus tard si besoin

URLs de callback à ajouter côté providers :

- `https://{supabase-project}.supabase.co/auth/v1/callback`

## 5. Configurer les URL de redirection

Dashboard Supabase → **Authentication → URL Configuration** :

- **Site URL** : `https://axisolver.app` (prod) ou `http://localhost:3000` (dev)
- **Redirect URLs** : ajouter `http://localhost:3000/**` et `https://axisolver.app/**`

## 6. Vérifier

```bash
npm run dev
```

Puis se connecter via `/sign-in` ou `/sign-up` — la shadow row doit apparaître automatiquement dans `public.users`.

## Commandes utiles

```bash
# Explorer la DB
npx drizzle-kit studio

# Générer une migration après modif du schema
npx drizzle-kit generate --name nom_du_changement

# Vérifier le schéma
npx drizzle-kit check
```
