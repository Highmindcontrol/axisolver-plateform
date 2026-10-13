# ADR 001 — Vision produit complète d'AxiSolver

**Statut** : Accepté
**Date** : 13 octobre 2026
**Décideurs** : François Le Moing (direction produit)
**Scribe** : Claude Opus 4.7 (assistant architecture)

---

## Contexte

Lors de la session fondatrice du 13 octobre 2026, François a arbitré **quatre
décisions doctrinales majeures** qui transforment AxiSolver d'un simple
« remplaçant de chatbot » en un produit sans équivalent au monde.

Ces décisions sont figées ici pour servir de source de vérité pour toute
l'équipe (humaine et IA) qui travaille sur AxiSolver.

---

## Décision 1 — AxiSolver fait quatre missions, un seul tarif

AxiSolver n'est **pas** un widget conversationnel. C'est **la métamorphose
complète** de la présence en ligne d'une entreprise, en un seul produit
indivisible :

### Les 4 missions obligatoires d'AxiSolver

| Mission | Rôle | Fréquence |
|---|---|---|
| **1. Accueil visiteur** | Parler aux visiteurs 24/7, voix et écrit, résoudre, qualifier, transmettre | En continu |
| **2. Veille SEO** | Audit on-page complet à l'installation + monitoring continu | Initial + hebdomadaire |
| **3. Veille sécurité** | Audit sécurité initial + monitoring continu + alertes régressions | Initial + hebdomadaire |
| **4. Veille métriques** | Connexion aux analytics du site, lecture mensuelle narrative, détection points de fuite | Continue + rapport mensuel |

### Pas de pack « AxiSolver Essentiel » / « Vigilance » / « 360 »

**Décision ferme** : il n'y a **qu'un seul AxiSolver**, qui inclut les
4 missions. Pas de version Lite. Pas de version Premium. Un seul produit,
un seul prix.

### Marché résiduel sur AxiHub

Les entreprises qui ne veulent **pas** AxiSolver complet peuvent acheter sur
AxiHub des **packs AXI séparés** :

- Pack SEO AXI (audit + monitoring + recommandations)
- Pack Sécurité AXI (audit + monitoring + alertes)
- Pack Métriques AXI (connexion analytics + rapport narratif mensuel)

Prix additionnés de ces 3 packs **supérieur** au prix d'AxiSolver complet.
Argument de vente automatique sur AxiHub : *« Vous payez plus pour moins —
AxiSolver fait tout en même temps + l'accueil. »*

### Phrase de vente cristallisée

> *« AxiSolver, c'est la caissière, le vigile, le consultant SEO et
> l'analyste trafic. Un seul produit, quatre missions, un seul tarif. »*

---

## Décision 2 — Rapport AxiSolver avec triple voie de solution

Chaque rapport (initial à l'installation, puis mensuel) produit par
AxiSolver contient, pour **chaque faille détectée**, trois voies de
résolution :

### 🏢 Variante « Faire faire par une agence »
*« Prévoir X à Y € HT, 2-3 jours de prestation. Nos partenaires Ataraxis
Bridge accrédités dans votre région : [liste géolocalisée]. »*

Opportunité : commission d'apport Ataraxis Bridge.

### 💪 Variante « Faire vous-même avec un dev »
*« Faisable en interne en 30-60 min pour un dev familier avec [stack].
Compétences requises : [liste]. »*

### 📘 Variante « Méthode pas-à-pas »
*« Procédure détaillée en 7 étapes :*
1. *Connectez-vous à votre console [X]*
2. *Allez dans Paramètres → Sécurité*
3. *Copiez-collez cette ligne : [snippet]*
4. *…*
*Temps estimé : 15 min. Niveau requis : à l'aise avec un ordinateur. »*

### Pourquoi c'est stratégique

Chaque dirigeant a un profil (fait-faire / fait-tout / veut-apprendre). Le
rapport s'adapte sans qu'il ait à choisir. **Aucun concurrent ne tient le
dirigeant par la main comme ça.** La variante Méthode pas-à-pas est
générée par Claude Opus 4.7 pour maximiser la qualité.

### Livraison du rapport

- PDF branded (logo tenant + logo AxiSolver + score global 0-100)
- Envoyé par email (Brevo) au moment de la génération
- Archivé dans la console admin tenant
- Historique conservé mois après mois pour voir l'évolution

---

## Décision 3 — Interface vivante en split-view

Le widget AxiSolver abandonne le format classique « bouton bulle qui ouvre
une fenêtre de chat ». Il adopte un format **split-view** :

### Structure visuelle

- **Côté gauche** : la conversation (chat + microphone + input texte)
- **Côté droit** : **le panneau de travail live**, qui affiche en temps
  réel ce qu'AxiSolver est en train de faire pour le visiteur

### Contenu possible du panneau droit

| Composant | Déclenché par | Effet |
|---|---|---|
| **Fiche visiteur** | AxiSolver prend des notes | Le visiteur voit son prénom, email, téléphone, demande se remplir en live |
| **Champ email validé** | AxiSolver demande l'email | Le visiteur tape (pas de dictée vocale foireuse) |
| **Champ téléphone validé** | AxiSolver demande le téléphone | Idem |
| **Boutons de choix** | AxiSolver propose des options | Clic au lieu de dicter |
| **Lien de téléchargement** | AxiSolver propose une brochure | Button download direct |
| **Page web embarquée** | AxiSolver pointe une page du site | iframe léger avec highlight |
| **Référence AXI-XXXX** | Clôture du ticket | Encadré, copie-rapide |

### Technique : tool calling Claude

Implémentation via **Anthropic Tool Use** natif. Le modèle (Claude Haiku
4.5) peut appeler des outils structurés en plus d'écrire du texte
conversationnel. Le backend intercepte les tool calls et les relaie au
frontend via le même stream SSE.

### Pourquoi c'est fondamental

- **Fin de la frustration conversationnelle** : *« allô, vous m'avez
  noté ? »* n'existe plus. Le visiteur voit AXI écrire.
- **Captation de données propres** : email tapé = email correct
  (vs email dicté 50 % faux).
- **Révélation visuelle de la valeur** : AxiSolver n'est pas un widget,
  c'est une **surface de travail partagée**.
- **Démo auto-vente sur axisolver.app** : le prospect voit sa fiche
  prospect se construire en live. Il est déjà client avant d'avoir souscrit.

### Mobile

Pattern **bottom sheet** : le chat prend toute la hauteur, et le panneau
remonte en bottom sheet quand AxiSolver déclenche une action. Effet
dramaturgique « AXI me montre quelque chose ».

---

## Décision 4 — La touche morpion

À la fin de chaque conversation résolue, AxiSolver propose une **rupture
de ton inattendue** :

### Déroulé de la fin de conversation

1. AxiSolver récapitule ce qu'il a noté : *« Nous sommes bien d'accord ? »*
2. Visiteur confirme
3. AxiSolver propose : *« Si vous voulez, je peux vous envoyer cette fiche
   par email. »* → bouton dans le panneau droit
4. AxiSolver génère la référence AXI-XXXX
5. **La cerise** : *« Si vous avez encore 5 minutes avant de partir,
   pourquoi est-ce qu'on ne se ferait pas un petit morpion ? »* → la grille
   3×3 s'affiche dans le panneau droit

### Pourquoi c'est signature

- **Mémorabilité virale** : les gens vont screenshot et partager
- **Humanité commerciale** : AXI sort de son rôle et devient attachant
- **Rétention post-résolution** : 2-5 min de plus = ancrage mémoriel maximal
- **Démo auto-vente** : sur axisolver.app, le prospect **joue** avec AXI
  avant d'acheter

### Règle du jeu

AXI est **imparfait au morpion** — minimax léger qui gagne 50 %, perd 25 %,
égalité 25 %. On ne veut pas d'un AxiSolver sadique.

### Déclenchement conditionnel

AXI ne propose **jamais** le morpion si :
- Conversation urgente / litigieuse
- Visiteur pressé (plusieurs messages courts type « rapide »)
- Entreprise cliente est en secteur sensible (santé, juridique, deuil)

L'activation est **paramétrable** par le tenant dans sa config AxiHub.

### Extensions V2

- Mini-leaderboard : *« Vous êtes la 42e personne à me battre aujourd'hui »*
- Easter egg : qui bat AXI 3 fois d'affilée reçoit un code promo partenaire
- Palette de mini-jeux selon la culture du visiteur

---

## Conséquences

### Immédiates

- Doctrine mise à jour dans `docs/doctrine-capacites.md`
- System prompt refondu pour que l'AxiSolver auto-vendeur sur axisolver.app
  reflète immédiatement cette vision complète
- Landing refondue avec les 4 piliers

### Techniques (prochains lots)

1. **Lot A — Split-view widget + tool calling** (le plus différenciant visuellement)
2. **Lot B — Audit SEO/Sécurité/Métriques initial + rapport PDF** (gros chantier backend)
3. **Lot C — Monitoring continu + alertes régressions**
4. **Lot D — Morpion + extensions ludiques**
5. **Lot E — Soumission moteurs/annuaires** (phase 3)

### Positionnement final

AxiSolver n'est pas un chatbot amélioré. Ce n'est pas un outil SEO augmenté.
C'est une **catégorie nouvelle** : *« la plateforme vivante de présence en
ligne »*. Dans cette catégorie, il est seul.

---

## Phrase de signature

> *« AxiSolver parle avec vos visiteurs. Veille sur votre site. Travaille
> à côté de vous. Et sait aussi s'amuser. Un seul produit. Zéro concurrent
> au monde. »*
