/**
 * Définition des « tools » qu'AxiSolver peut appeler pendant la
 * conversation pour piloter le panneau de travail (côté droit du widget).
 *
 * Chaque tool est passé à l'API Claude via l'option `tools`. Claude peut
 * les invoquer en plus (ou à la place) de son texte conversationnel.
 * Le backend relaie les tool_use events au frontend via le stream SSE,
 * et le composant Panneau de Travail réagit en affichant / mettant à
 * jour le composant correspondant.
 *
 * Format : chaque tool a un `name` snake_case, une `description` (à
 * l'attention du LLM) et un `input_schema` JSON Schema.
 */

import type Anthropic from "@anthropic-ai/sdk";

export type ToolDefinition = Anthropic.Tool;

/** Niveau de chaleur estimé d'un ticket. */
export type ChaleurTicket = "froid" | "tiede" | "chaud" | "urgent";

/** Entrée possible du panneau de travail (ce que Claude peut déclencher). */
export type EvenementPanneau =
  | { type: "ajouter_note_fiche"; champ: ChampFiche; valeur: string }
  | { type: "demander_email"; raison?: string }
  | { type: "demander_telephone"; raison?: string }
  | {
      type: "proposer_choix";
      question: string;
      options: Array<{ libelle: string; valeur: string }>;
    }
  | {
      type: "proposer_telechargement";
      libelle: string;
      url: string;
    }
  | {
      type: "montrer_page_web";
      url: string;
      titre?: string;
    }
  | {
      type: "afficher_site_hote";
      url: string;
    }
  | {
      type: "generer_reference_axi";
      reference: string;
      resume: string;
      chaleur: ChaleurTicket;
    }
  | {
      type: "proposer_envoi_fiche_email";
      email?: string;
    }
  | { type: "proposer_jeu_morpion" };

/** Champs de la fiche visiteur. */
export type ChampFiche =
  | "prenom"
  | "nom"
  | "entreprise"
  | "secteur"
  | "site_web"
  | "demande"
  | "contexte"
  | "urgence";

/** État complet du panneau de travail au niveau du composant React. */
export type EtatPanneauTravail = {
  fiche: Partial<Record<ChampFiche, string>>;
  elementActif:
    | { kind: "aucun" }
    | { kind: "demande_email"; raison?: string }
    | { kind: "demande_telephone"; raison?: string }
    | {
        kind: "choix";
        question: string;
        options: Array<{ libelle: string; valeur: string }>;
      }
    | { kind: "telechargement"; libelle: string; url: string }
    | { kind: "page_web"; url: string; titre?: string }
    | { kind: "site_hote"; url: string }
    | { kind: "envoi_fiche_email"; email?: string }
    | { kind: "morpion" };
  reference?: {
    reference: string;
    resume: string;
    chaleur: ChaleurTicket;
  };
  emailValide?: string;
  telephoneValide?: string;
};

/** Catalogue des tools exposés à Claude. */
export const TOOLS_AXISOLVER: ToolDefinition[] = [
  {
    name: "ajouter_note_fiche",
    description:
      "Ajoute silencieusement une information à la fiche visiteur visible dans le panneau de travail. Appelle ce tool chaque fois qu'un visiteur te donne une info identifiante (prénom, nom, entreprise, secteur, site web, nature de la demande, contexte, urgence). N'annonce PAS verbalement cette action — le visiteur voit sa fiche se remplir en direct.",
    input_schema: {
      type: "object" as const,
      properties: {
        champ: {
          type: "string",
          enum: [
            "prenom",
            "nom",
            "entreprise",
            "secteur",
            "site_web",
            "demande",
            "contexte",
            "urgence",
          ],
          description: "Le champ de fiche à remplir.",
        },
        valeur: {
          type: "string",
          description: "La valeur du champ, en français, courte et nette.",
        },
      },
      required: ["champ", "valeur"],
    },
  },
  {
    name: "demander_email",
    description:
      "Affiche dans le panneau de travail un champ email que le visiteur doit taper lui-même (plutôt que de le dicter — l'oral introduit trop d'erreurs). Utilise ce tool quand tu as besoin de l'email pour envoyer un dossier ou créer un ticket.",
    input_schema: {
      type: "object" as const,
      properties: {
        raison: {
          type: "string",
          description:
            "Phrase courte expliquant pourquoi tu demandes l'email (ex: « pour vous envoyer le dossier »).",
        },
      },
      required: [],
    },
  },
  {
    name: "demander_telephone",
    description:
      "Affiche dans le panneau de travail un champ téléphone que le visiteur doit taper (avec formatage automatique). Utilise ce tool quand tu as besoin d'un contact téléphonique pour un rappel.",
    input_schema: {
      type: "object" as const,
      properties: {
        raison: {
          type: "string",
          description:
            "Phrase courte expliquant pourquoi tu demandes le téléphone.",
        },
      },
      required: [],
    },
  },
  {
    name: "proposer_choix",
    description:
      "Affiche dans le panneau de travail une question avec 2 à 4 boutons cliquables, pour éviter au visiteur de taper une réponse à choix fermé. Idéal pour : préférence contact (email / téléphone / RDV), choix de pack, confirmation oui/non.",
    input_schema: {
      type: "object" as const,
      properties: {
        question: {
          type: "string",
          description: "La question posée au visiteur.",
        },
        options: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: {
            type: "object",
            properties: {
              libelle: {
                type: "string",
                description: "Le texte affiché sur le bouton.",
              },
              valeur: {
                type: "string",
                description: "La valeur envoyée au backend quand cliqué.",
              },
            },
            required: ["libelle", "valeur"],
          },
        },
      },
      required: ["question", "options"],
    },
  },
  {
    name: "proposer_telechargement",
    description:
      "Affiche dans le panneau de travail un lien de téléchargement direct vers un document (brochure, catalogue PDF, mode d'emploi).",
    input_schema: {
      type: "object" as const,
      properties: {
        libelle: {
          type: "string",
          description: "Texte visible du bouton (ex: « Télécharger la brochure 2026 »).",
        },
        url: {
          type: "string",
          description: "URL complète du fichier à télécharger.",
        },
      },
      required: ["libelle", "url"],
    },
  },
  {
    name: "montrer_page_web",
    description:
      "Affiche une page web du site hôte dans le panneau d'actions (gauche) pour montrer visuellement où le visiteur peut trouver l'information. Préférer un chemin interne au site hôte (ex: /tarifs, /contact).",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "URL de la page à afficher (relatif ou absolu).",
        },
        titre: {
          type: "string",
          description: "Titre court affiché au-dessus de l'iframe.",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "afficher_site_hote",
    description:
      "Affiche l'aperçu visuel du site web du visiteur dans le panneau d'actions (gauche). À déclencher SYSTÉMATIQUEMENT dès que le visiteur te donne l'URL de son site. Effet théâtral : le visiteur sent qu'AxiSolver 'regarde chez lui' en live. Dis simplement 'Je regarde votre site' avant l'affichage.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description:
            "URL complète du site du visiteur (avec ou sans https://, le composant gère les deux).",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "generer_reference_axi",
    description:
      "Clôture le ticket et affiche la référence AXI-XXXX dans le panneau de travail. Appelle ce tool UNIQUEMENT à la fin, après avoir collecté les infos nécessaires (nom, contact, demande claire). Le visiteur voit un encadré avec sa référence copiable.",
    input_schema: {
      type: "object" as const,
      properties: {
        reference: {
          type: "string",
          pattern: "^AXI-[0-9]{4}$",
          description: "Référence au format AXI-XXXX (4 chiffres).",
        },
        resume: {
          type: "string",
          description: "Résumé en 1-2 phrases de la demande pour l'équipe humaine.",
        },
        chaleur: {
          type: "string",
          enum: ["froid", "tiede", "chaud", "urgent"],
          description:
            "Niveau de chaleur estimé : froid (exploration), tiède (intérêt), chaud (prêt à acheter), urgent (problème à régler vite).",
        },
      },
      required: ["reference", "resume", "chaleur"],
    },
  },
  {
    name: "proposer_envoi_fiche_email",
    description:
      "Propose au visiteur de recevoir une copie de la fiche par email. À appeler après generer_reference_axi, dans le rituel de clôture.",
    input_schema: {
      type: "object" as const,
      properties: {
        email: {
          type: "string",
          description: "Email vers lequel envoyer la fiche (optionnel si déjà connu).",
        },
      },
      required: [],
    },
  },
  {
    name: "proposer_jeu_morpion",
    description:
      "Propose une partie de morpion dans le panneau de travail — rupture de ton pour terminer la conversation sur une note mémorable. À N'APPELER QUE si le visiteur est détendu, pas pressé, pas en contexte urgent / litigieux / secteur sensible (santé, juridique grave, deuil). Appel après le rituel de clôture.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

/** État initial du panneau au démarrage de la conversation. */
export const ETAT_PANNEAU_INITIAL: EtatPanneauTravail = {
  fiche: {},
  elementActif: { kind: "aucun" },
};
