# AxiSolver — Roadmap de construction

> *Chatbots talk. AxiSolver solves.*
>
> Produit B2B dédié aux entreprises qui veulent remplacer leur chatbot sur
> leur site. AXI éduqué pour accueillir, résoudre et transmettre.

---

## Doctrine fondatrice (rappel)

AxiSolver est un **AXI dédié à la mission accueil visiteur**. Il n'est pas un
AXI généraliste. Six lignes rouges inscrites dans son system prompt :

1. **N'engage rien, ne signe rien** — pas de prix fermes, dates, validation.
2. **Scope strict à l'entreprise** où il est installé.
3. **Pas de capacités d'AXI complet** — pas d'agenda, mails, outils métier.
4. **Mémoire opérationnelle, pas personnelle** — reconnaissance email/tél, pas de profil psychologique.
5. **Pas de rôle organisationnel** — ne pilote pas d'équipe, pas de KPI business.
6. **Conversation courte, orientée résolution** — 3 à 5 messages, puis fermeture avec référence `AXI-XXXX`.

Chaque limite est un **upsell naturel** vers l'écosystème AXI complet via AxiHub.

---

## Lots de travail

### Lot 0 — Landing & Marketing (en cours)

- [x] Landing racine `/` avec hero, comparatif, capacités, CTA AxiHub
- [ ] Page `/mentions-legales`
- [ ] Page `/cgv` (Conditions Générales de Vente)
- [ ] Page `/comment-ca-marche` (procédure installation détaillée)
- [ ] Page `/cas-usage` (templates métiers : avocat, agence immo, cabinet comptable…)
- [ ] Favicon + apple-touch-icon + manifest PWA
- [ ] Partage OG optimisé (image hero AxiSolver dédiée)
- [ ] Analytics opt-in (Plausible/Umami, pas Google)

### Lot 1 — Infrastructure Supabase (bloquant pour Lot 2+)

- [ ] Projet Supabase Frankfurt dédié AxiSolver (séparé Praximea pour isolation RGPD par entreprise)
- [ ] Schema `axi_solver` avec tables :
  - `tenants` (entreprise cliente — nom, slug, domaine site, config brand, system prompt custom)
  - `tenant_members` (users admin autorisés à voir les tickets de ce tenant)
  - `visitors` (empreinte email/téléphone reconnue — reconnaissance return visitor)
  - `conversations` (session de dialogue — tenant_id + visitor_id + status)
  - `messages` (chaque tour de parole — role, content, audio_url?, timestamp)
  - `tickets` (dossier qualifié transmis à l'équipe — référence AXI-XXXX, résumé, chaleur, status)
  - `handoffs` (log des passages de main à un humain — qui, quand, pourquoi)
  - `briefings` (briefs matinaux générés — tenant_id, date, markdown, audio_url?)
- [ ] RLS strict `tenant_id` partout — un tenant ne voit JAMAIS les données d'un autre
- [ ] Index sur colonnes critiques (visitor_email, conversation_id, created_at)

### Lot 2 — Widget JS embarquable (le cœur produit)

- [ ] Route `/widget.js` qui sert le snippet (~15 KB gzip max)
- [ ] Design : bulle flottante bottom-right, inspirée du logo (bleu glossy)
- [ ] États : minimisé (bulle avec notif), ouvert (fenêtre chat), minimisation sticky
- [ ] Mode voix : push-to-talk + TTS réponses
- [ ] Mode écrit : input texte classique
- [ ] Configuration par data-attributes : `data-tenant="slug"`, `data-position`, `data-primary-color`
- [ ] Shadow DOM pour isolation CSS totale du site hôte
- [ ] Compatible SPA (React/Vue) et SSR (Next, Nuxt)
- [ ] Compatible mobile (viewport dynamique, keyboard adaptative)

### Lot 3 — API conversationnelle

- [ ] POST `/api/chat` — reçoit message visitor, renvoie réponse AXI
  - Lookup tenant via domaine origine (header `Origin`)
  - Load conversation context (RLS + mémoire visitor si identifié)
  - Build messages array avec system prompt doctrine 6 lignes rouges
  - Appel Claude Haiku 4.5 (standard) ou Sonnet 4.6 (complexité détectée)
  - Stream SSE pour réponse progressive
  - Persistance message visitor + réponse AXI
- [ ] POST `/api/voice/transcribe` — Whisper audio → texte
- [ ] POST `/api/voice/synthesize` — ElevenLabs ou Web Speech API fallback
- [ ] POST `/api/ticket/create` — déclenchement escalade humain
  - Génère référence AXI-XXXX (incrément atomique)
  - Résume conversation avec Opus 4.7
  - Email Brevo à l'équipe (template branded tenant)
  - Enregistre en DB
- [ ] GET `/api/widget-config/:tenant` — config dynamique du widget (couleurs, baseline, langue)

### Lot 4 — Console admin tenant (le SaaS de pilotage)

> Note doctrinale : la console admin finale vit dans **AxiHub** (point d'entrée
> unique pour toute souscription AXI). Côté AxiSolver, on peut proposer un
> `/admin` léger pour les tenants qui veulent y accéder directement.
> À arbitrer : où vit l'admin ? AxiSolver direct ou proxy depuis AxiHub ?

- [ ] Auth tenant admin (Supabase Auth + magic link email)
- [ ] Dashboard : nombre tickets aujourd'hui, taux résolution auto, temps moyen
- [ ] Liste tickets avec filtres (statut, chaleur, date, mot-clé)
- [ ] Détail ticket : conversation complète + résumé + actions (répondre, fermer, escalader)
- [ ] Brief matinal (Markdown + audio TTS) — généré auto chaque matin 6h local
- [ ] Console vocale pour interroger AXI à l'oral depuis mobile (brief vocal)
- [ ] Settings tenant : config widget, horaires, membres équipe, intégrations

### Lot 5 — Protocole Duo (optionnel, phase 2)

> Quand l'entreprise cliente a aussi adopté l'écosystème via AxiHub,
> AxiSolver se branche en **Duo** avec son AXI maison.

- [ ] Protocol WebSocket AXI-to-AXI pour interrogation en direct
- [ ] Délégation d'action (RDV, mail, devis) — AXI maison agit avec son autorité
- [ ] Enrichissement contextuel (reconnaissance client existant via CRM)
- [ ] Validation en 2 temps (prix spécifique validé avant diffusion visiteur)
- [ ] Debriefing bidirectionnel (AxiSolver apprend comment ses tickets ont été traités)

### Lot 6 — Onboarding automatique (via AxiHub)

- [ ] AXI d'onboarding sur AxiHub qui interroge le dirigeant (15-30 min oral/écrit)
- [ ] Crawl automatique du site public du client → éducation produit
- [ ] Lecture CGV, FAQ, politique retour → doctrine commerciale
- [ ] Génération system prompt custom pour ce tenant
- [ ] Snippet JS généré avec `data-tenant` pré-rempli → copier-coller dans `<head>`
- [ ] Email de bienvenue avec procédure installation

---

## Priorités d'attaque

Ordre d'implémentation suggéré pour atteindre un **MVP vendable** rapidement :

1. **Lot 1 (Supabase)** — fondation nécessaire pour tout le reste
2. **Lot 3 (API chat)** — le cerveau du produit, testable via Postman
3. **Lot 2 (Widget JS)** — le visage du produit sur les sites clients
4. **Lot 4 (Admin minimal)** — permet au client de voir ses tickets
5. **Lot 0 reste (CGV + Mentions)** — nécessaire pour vendre
6. **Lot 6 (Onboarding)** — automatise le déploiement
7. **Lot 5 (Duo)** — upsell phase 2

À chaque fin de lot, un palier de valeur délivrée. Pas de dates — François fixe le tempo.

---

## Stack technique

| Couche | Technologie | Raison |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR + routes API + edge-ready |
| TypeScript | ^5 strict | type safety end-to-end |
| Styling | Tailwind v4 | cohérence avec reste écosystème |
| DB | Supabase Postgres (Frankfurt) | RGPD + RLS natif |
| ORM | Drizzle | léger, édition schema propre |
| LLM | Anthropic SDK | Haiku 4.5 standard, Sonnet 4.6 complexité, Opus 4.7 synthèses |
| Email | Brevo REST | SMTP éprouvé, templates branded |
| STT | OpenAI Whisper API | qualité + latence |
| TTS | ElevenLabs (fallback Web Speech) | voix naturelle |
| Deploy | Vercel | continuité écosystème |
| Monitoring | Vercel Analytics (basique) + Plausible frontend | pas de Google Analytics |

---

## Points d'arbitrage à trancher avec François

- Où vit la console admin finale ? AxiSolver standalone ou proxy depuis AxiHub ?
- Mémoire visitor : stockée dans quel projet Supabase ? AxiSolver dédié ou mémoire centrale AXI (dans Praximea Supabase selon doctrine mémoire architectural) ?
- Modèle commercial du widget : usage illimité ou freemium (X tickets / mois) ?
- Multilingue : natif dès le début ou français-only pour MVP ?
- Branding tenant : combien de niveau de personnalisation (logo, couleurs, baseline…) ?
