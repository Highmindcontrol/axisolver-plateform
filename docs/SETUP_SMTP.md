# AxiSolver — Setup emails transactionnels (Supabase → Brevo)

Guide pour brancher Supabase sur le SMTP relay Brevo d'Ataraxis pour
que tous les emails d'authentification (confirmation signup, reset
password, magic link, change email) soient envoyés depuis
`noreply@axisolver.app` via l'infra Brevo partagée de l'écosystème.

Doctrine : [`project_ataraxis_brevo_emails_transactionnels`](../../../.claude/projects/-Users-francoislemoing/memory/project_ataraxis_brevo_emails_transactionnels.md).

## 1. Prérequis Brevo

- Compte Brevo actif pour Ataraxis
- Domaine `axisolver.app` authentifié chez Brevo (DKIM + SPF OK)
- Clé SMTP générée (Settings → SMTP & API → SMTP tab)

## 2. Configuration Supabase

**Dashboard Supabase → Project Settings → Authentication → SMTP Settings**

Cocher « Enable Custom SMTP » et renseigner :

| Champ | Valeur |
|---|---|
| Sender email | `noreply@axisolver.app` |
| Sender name | `AxiSolver` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | login Brevo (généralement l'email du compte) |
| Password | la SMTP key Brevo (pas l'API key) |

## 3. URL de redirection

**Authentication → URL Configuration** :

- Site URL : `https://axisolver.app`
- Redirect URLs : `https://axisolver.app/**`

## 4. Templates emails

Quatre templates HTML cohérents design AxiSolver sont fournis dans
`docs/email-templates/` :

- `01-confirm-signup.html` → Confirmation de création de compte
- `02-reset-password.html` → Réinitialisation de mot de passe
- `03-magic-link.html` → Connexion par lien magique
- `04-change-email.html` → Changement d'adresse email

**Pour chacun** : copier le contenu HTML et le coller dans
**Supabase → Authentication → Email Templates → [template correspondant]**.

Les variables Supabase (`{{ .ConfirmationURL }}`, `{{ .Email }}`, etc.)
sont déjà intégrées aux bons endroits.

## 5. Confirmation email obligatoire

**Authentication → Providers → Email → Enable Confirmations** : coché.

Résultat : à chaque inscription email/password, l'utilisateur reçoit
l'email de confirmation signup via Brevo, clique sur le bouton, est
redirigé vers `/api/auth/confirm` qui valide l'OTP et le logue.

## 6. Flow côté app (déjà codé)

Côté application, le flow est déjà prêt :

1. User remplit `/inscription` → `inscriptionAction` → `supabase.auth.signUp()`
2. Si confirmation obligatoire, pas de session créée immédiatement.
   `inscriptionAction` redirige vers `/verification-email?email=...`
3. User clique sur le lien dans l'email → arrive sur `/api/auth/confirm`
4. `/api/auth/confirm` appelle `verifyOtp()` → crée la session →
   redirige vers `/dashboard`

## 7. Tester

1. Ouvrir `https://axisolver.app/inscription` en navigation privée
2. Créer un compte avec un email réel
3. Arriver sur `/verification-email`
4. Vérifier la boîte mail → cliquer sur « Confirmer mon email »
5. Redirection automatique sur `/dashboard`

Si l'email ne part pas :
- Vérifier le quota Brevo (300/jour gratuit)
- Vérifier dans **Brevo → Statistics → Transactional** si la tentative apparaît
- Vérifier dans Supabase que le SMTP custom est bien activé
- Tester avec `curl -X POST` sur `https://api.brevo.com/v3/smtp/email` avec la même clé pour isoler
