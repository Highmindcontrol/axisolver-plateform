# Compte-rendu email de clôture — spécification

> **Statut** : spécifié, pas encore implémenté — en attente de la mise
> en place du canal d'envoi email (Brevo ou équivalent).
>
> Déclenché par le clic du visiteur sur « Clôturer et recevoir mon
> compte-rendu » dans l'écran de clôture du widget AxiSolver.

---

## Contenu du compte-rendu

Un email structuré envoyé au visiteur à la fin de sa conversation
AxiSolver. L'objectif est de lui laisser une **base solide, utile et
agréable à relire**, avec un **finish class** qui garde la touche
d'humanité AxiSolver.

### Structure obligatoire

**1. En-tête**
- Logo AxiSolver
- Référence du dossier (AXI-XXXX)
- Date et heure de la conversation
- Prénom du visiteur personnalisé partout

**2. Historique complet de la conversation**
- Fil texte intégral : AxiSolver + visiteur
- Mise en forme typographique propre (bulles de couleur ou blockquotes)
- Les messages système `[Email saisi : ...]` sont **filtrés** (ne
  figurent pas dans l'email)
- Les tool_use silencieux (`ajouter_note_fiche`) sont **filtrés**
- Les événements interactifs importants sont **transposés en texte** :
  * *« Vous avez répondu : "Je veux développer mes ventes en ligne" »*
    (quand le visiteur a cliqué un bouton de choix)
  * *« Vous avez saisi votre email : flemoing@gmail.com »*
  * *« Vous avez saisi votre téléphone : +33 6 76 87 98 76 »*

**3. Fiche visiteur consolidée**
- Prénom, nom, entreprise, secteur, site web
- Volume de visiteurs mensuel estimé
- Déclencheur principal (celui coché dans la question 4)
- Email + téléphone validés
- Référence AXI

**4. Audit sécurité — résultat complet**
- URL du site auditée
- Technologies détectées
- Findings par sévérité :
  * 🔴 **Critiques** (chaque faille + explication + impact commercial)
  * 🟠 **À améliorer**
  * 🔵 **Infos** (facultatif dans l'email, ou dans un collapsible)
- Phrase de clôture AxiSolver sur l'audit sécurité (reprise du chat)

**5. Audit SEO — résultat complet**
- Mêmes principes que l'audit sécurité
- Findings par sévérité
- Phrase de clôture AxiSolver sur l'audit SEO

**6. Ce qu'AxiSolver aurait fait pour vous**
- Encart commercial court et non pushy
- Rappel des 4 missions
- Pas de prix, pas de « tarif fondateur »
- CTA : *« L'équipe Ataraxis vous recontacte à l'adresse ci-dessus. »*

**7. 🎯 Résultat du morpion (si joué)**
- Score final : *« Vous X · AxiSolver Y »* après N parties
- Mot personnalisé selon le résultat :

**Si le visiteur a gagné** :
> *« Et bravo pour le morpion, hein, mais j'aurai ma revanche ! »*

**Si le visiteur a perdu** :
> *« Et désolé pour le morpion, vous m'aurez la prochaine fois ! »*

**Si égalité parfaite** :
> *« Et match nul au morpion — belle série, à la prochaine ! »*

**Si pas joué** : section omise.

**8. Pied de page**
- Signature AxiSolver
- Mentions légales + lien désabonnement
- Opt-in Ataraxis rappelé si coché à la clôture

---

## Implémentation future

- **Canal** : Brevo REST API (déjà intégré dans ataraxis-platform)
- **Template** : HTML + fallback texte brut
- **Déclencheur** : handler `handleClotureConfirmee` dans `ChatWidget`
  qui appelle une nouvelle route API `/api/envoyer-compte-rendu`
- **Payload** : `{ messages, etatPanneau, resultatMorpion, optIn }`
- **Génération** : Claude Opus 4.7 pour composer le texte narratif
  des audits en français propre (pas de liste technique brute)
- **Rendu PDF optionnel** : via `@react-pdf/renderer` pour attachment
  (déjà utilisé dans ataraxis-platform)

### Résultat du morpion à transmettre

Ajouter dans l'état du widget :
```ts
resultatMorpion?: {
  partiesJouees: number;
  victoiresVisiteur: number;
  victoiresAxi: number;
  champion: "visiteur" | "AxiSolver" | "égalité";
}
```

Mis à jour par le composant `JeuMorpion` dans son `onPartiesTerminees`
avant d'être transmis au compte-rendu.

---

## Finish class

Le compte-rendu doit se lire comme **une lettre bien écrite**, pas
comme un rapport technique froid. Trois clés :

- **Prénom partout** — personnalisation forte
- **AxiSolver garde son ton** — vif, direct, poli, un peu taquin
- **Le morpion ferme en touche d'humanité** — même dans un rapport
  d'audit sérieux

C'est le détail qui fait que le visiteur **retient AxiSolver**
plutôt qu'un rapport d'audit anonyme.
