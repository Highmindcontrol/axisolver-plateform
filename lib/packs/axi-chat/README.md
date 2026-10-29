# @axi-chat — Interface de communication AXI unifiée

Pack React auto-contenu qui fournit l'interface conversationnelle AXI
pour **tous les sites de l'écosystème Ataraxis**. Doctrine « 1 code,
N produits » comme AXI Security Shield.

## Installation sur un nouveau site

```bash
# Depuis la racine du nouveau site (nécessite tailwindcss + lucide-react)
cp -r axisolver-platform/lib/packs/axi-chat <monsite>/lib/packs/
```

Zéro migration SQL, zéro service backend requis côté pack : il
consomme un endpoint HTTP que tu fournis (`endpoints.urlChat`).

## Dépendances externes

Minimales et volontairement standard :

- `react` ≥ 18 (hooks `useState`, `useMemo`)
- `lucide-react` (icônes)
- `tailwindcss` ≥ 3 (uniquement pour les classes utilitaires de layout
  — les couleurs passent par variables CSS, pas par Tailwind)

Aucun import vers `@/lib/...` du site hôte. Le pack est portable.

## Usage minimal

```tsx
import {
  AxiChatCopilote,
  type ConfigAxiChat,
} from "@/lib/packs/axi-chat";

const config: ConfigAxiChat = {
  channel: "back-office-copilote",
  endpoints: { urlChat: "/api/chat" },
  theme: { mode: "sombre" },
  contexte: { prenomUtilisateur: "François" },
};

<AxiChatCopilote
  config={config}
  aileteGauche={<MesSites />}
  aileteDroite={<MonCarnet />}
/>;
```

## Channels disponibles

| Channel                 | Usage                                                  | Statut |
| ----------------------- | ------------------------------------------------------ | ------ |
| `back-office-copilote`  | Triptyque dashboard (ailettes + chat)                  | ✅ V1  |
| `bandeau-toggle`        | Bandeau + panneau déroulant qui pousse la page         | ✅ V1  |
| `widget-flottant`       | Bulle flottante (4 positions) + panneau overlay        | ✅ V1  |
| `back-office-panneau`   | Panneau latéral AxiHub-style                           | ⏳ V2  |
| `widget-embarque`       | Iframe/div inline dans une page                        | ⏳ V2  |
| `plein-ecran`           | Modale conversation immersive                          | ⏳ V2  |

### Variante `bandeau-toggle`

Reproduit le pattern du dashboard admin : barre pleine largeur avec
bouton toggle + panneau conversation qui descend en poussant la page
vers le bas (pas d'overlay). Idéal pour s'installer juste **sous le
menu principal** d'un site client.

```tsx
<AxiChatBandeauToggle
  config={config}
  position="haut"              // 'haut' | 'bas'
  libelleFerme="Parler à AXI"
  libelleOuvert="Conversation en cours"
  defautOuvert={false}
  dureeMs={1800}               // vitesse d'ouverture/fermeture
/>
```

### Variante `widget-flottant`

Bulle fixe ancrée dans un coin de l'écran. Panneau de conversation qui
apparaît en overlay (ne pousse pas la page). 4 positions possibles.

```tsx
<AxiChatWidgetFlottant
  config={config}
  position="bas-droite"         // 'bas-droite' | 'bas-gauche' | 'haut-droite' | 'haut-gauche'
  teaser="Besoin d'aide ? Parlons-en."   // optionnel
  tailleBulle={56}
  largeurPanneau={400}
  hauteurPanneau={600}
/>
```

## Palettes de thème incluses

- `sombre` — fond `#0f172a` (slate-900), accent indigo-violet AXI
- `clair` — fond blanc, mêmes accents
- `ecommerceChaud` — stone-900 + amber-600 (sites de vente chaleureux)
- `institutionnel` — bleu nuit + sky-600 (médical, juridique)

Les clients peuvent fournir leur propre palette :

```tsx
const config: ConfigAxiChat = {
  channel: "widget-flottant",
  endpoints: { urlChat: "/api/chat" },
  theme: {
    mode: "personnalise",
    palette: {
      fond: "#2d1b69",
      accent: "#f59e0b",
      texteSurAccent: "#000000",
      // ... overrides partiels : les champs non fournis prennent
      // la palette sombre par défaut
    },
  },
};
```

## Fonctionnalités à activer à la carte

```tsx
fonctionnalites: {
  dictee: true,              // bouton micro
  piecesJointes: true,       // bouton paperclip
  voixSynthese: true,        // lecture TTS des réponses
  suggestionsRapides: true,  // chips cliquables sous l'input
  carnetOrdres: true,        // panneau d'ordres (copilote only)
  notationGaugista: true,    // modal fin de conversation
  historiqueMulti: true,     // reprise contexte entre visites
  mentionPropulsePar: true,  // badge « Propulsé par AxiSolver »
}
```

## Contrat du endpoint `urlChat`

Le pack envoie :

```json
POST /api/chat
Content-Type: application/json

{
  "messages": [
    { "role": "visiteur" | "axi" | "systeme", "contenu": "..." }
  ],
  "contexte": { ... },
  "siteId": "...",
  "channel": "back-office-copilote"
}
```

Attend en retour :

```json
200 OK
{
  "contenu": "Réponse d'AXI",
  "suggestions": [{ "id": "s1", "libelle": "Oui, allons-y" }]  // optionnel
}
```

Non-200 → le pack affiche un message système d'erreur.

## Structure interne du pack

```
lib/packs/axi-chat/
├── index.ts                 ← API publique (seul point d'import)
├── types.ts                 ← Contrats
├── theme/
│   ├── palettes.ts          ← 4 presets + Palette custom
│   └── use-theme.ts         ← Hook CSS variables
├── composants/              ← Atomiques
│   ├── axi-chat-root.tsx
│   ├── bulle-message.tsx
│   ├── entete-chat.tsx
│   ├── suggestions-rapides.tsx
│   └── zone-saisie.tsx
└── variantes/               ← Surfaces prêtes à l'emploi
    └── back-office-copilote.tsx
```

## Évolutions prévues

- Lot B : variantes `widget-flottant`, `widget-embarque`, `plein-ecran`
- Lot C : dictée (STT), voix synthèse (TTS ElevenLabs), pièces jointes
- Lot D : notation Gaugista fin de conversation
- Lot E : historique multi-session + reprise contexte
- Lot F : suggestions rapides depuis `site_options_accueil`
