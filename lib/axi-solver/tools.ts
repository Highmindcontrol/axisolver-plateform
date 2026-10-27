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
  | { type: "demander_prenom"; raison?: string }
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
      type: "demander_url_site";
      raison?: string;
    }
  | {
      type: "afficher_site_hote";
      url: string;
    }
  | {
      type: "auditer_site";
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
  | { type: "proposer_jeu_morpion" }
  | {
      type: "estimer_tarif_axisolver";
      visiteursMois: number;
      secteurSlug: string;
      usagePrincipal: string;
      tailleEquipe: string;
    };

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
    | { kind: "demande_prenom"; raison?: string }
    | { kind: "demande_email"; raison?: string }
    | { kind: "demande_telephone"; raison?: string }
    | { kind: "demande_url_site"; raison?: string }
    | {
        kind: "choix";
        question: string;
        options: Array<{ libelle: string; valeur: string }>;
      }
    | { kind: "telechargement"; libelle: string; url: string }
    | { kind: "page_web"; url: string; titre?: string }
    | { kind: "site_hote"; url: string }
    | {
        kind: "analyse_site";
        url: string;
        etat: "en_cours" | "terminee";
        volet?: "securite" | "seo" | "referencement";
        findings?: Array<{
          categorie: "seo" | "securite" | "performance" | "metier";
          severite: "info" | "amelioration" | "critique";
          titre: string;
          detail?: string;
        }>;
        technologies?: string[];
        findingsReferencement?: Array<{
          requete: string;
          position: number | null;
          totalResultats?: number;
          concurrents: Array<{
            titre: string;
            url: string;
            snippet?: string;
          }>;
        }>;
      }
    | {
        kind: "choix_multiple";
        question: string;
        options: Array<{ libelle: string; valeur: string }>;
      }
    | { kind: "envoi_fiche_email"; email?: string }
    | { kind: "morpion" }
    | {
        kind: "estimation_tarif";
        visiteursMois: number;
        secteurSlug: string;
        usagePrincipal: string;
        tailleEquipe: string;
        formuleRecommandee: "text" | "classique" | "premium";
        prixTextOnly: number;
        prixClassique: number;
        prixPremium: number;
        tauxEffectif: number;
        conversationsMois: number;
      }
    | { kind: "cloture" };
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
    name: "demander_prenom",
    description:
      "Affiche dans le panneau de travail à gauche un champ texte que le visiteur doit remplir avec son prénom. Utilise ce tool au Temps 2 du protocole d'accueil (après avoir reformulé la demande du visiteur) PLUTÔT que de laisser le visiteur dicter son prénom à l'oral : la voix écorche souvent les prénoms (François → « Franswah », Léo → « L. O. », etc.). Toujours annoncer avant l'appel : « Un instant, confirmez-moi votre prénom dans le petit champ qui apparaît à gauche. »",
    input_schema: {
      type: "object" as const,
      properties: {
        raison: {
          type: "string",
          description:
            "Phrase courte, optionnelle, pour expliquer la demande (ex: « pour qu'on se connaisse mieux »).",
        },
      },
      required: [],
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
      "Affiche dans le panneau d'action une question avec 2 à 4 boutons cliquables (choix UNIQUE). Idéal pour : préférence de contact, confirmation oui/non, choix d'un seul chemin.",
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
    name: "proposer_choix_multiple",
    description:
      "Affiche dans le panneau d'action une question avec des cases à cocher — le visiteur peut en sélectionner PLUSIEURS. Idéal pour : objectifs multiples, besoins combinés, intérêts croisés. Utilise ce tool quand plusieurs réponses sont possibles (ex: 'quels sont vos objectifs ?').",
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
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              libelle: {
                type: "string",
                description: "Le texte affiché à côté de la checkbox.",
              },
              valeur: {
                type: "string",
                description: "La valeur envoyée au backend quand cochée.",
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
    name: "demander_url_site",
    description:
      "Affiche dans le panneau d'actions (gauche) un formulaire élégant pour que le visiteur saisisse l'URL de son site web. Le formulaire comprend un champ URL avec validation + un bouton Valider + un bouton 'Je préfère ne pas le donner' pour éviter de bloquer la conversation. À appeler APRÈS avoir obtenu le prénom + le secteur + le volume de visiteurs, avant de proposer l'audit. Tu reçois ensuite soit [URL site : ...] soit [URL site refusée] et tu adaptes la suite.",
    input_schema: {
      type: "object" as const,
      properties: {
        raison: {
          type: "string",
          description:
            "Phrase courte expliquant pourquoi tu demandes l'URL (ex: « pour auditer rapidement votre site »).",
        },
      },
      required: [],
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
    name: "auditer_securite",
    description:
      "Lance un audit SÉCURITÉ du site du visiteur (headers HTTP, HSTS, CSP, X-Frame, HTTPS, serveur exposé, X-Powered-By, version CMS). Durée garantie minimum 8 secondes pour un effet de sérieux. Pendant ce temps, tu NE PARLES PAS. À la fin, Claude reçoit le tool_result avec les findings à commenter. Appelle ce tool APRÈS la question au visiteur 'En termes de sécurité, votre site est en norme ?' (quelle que soit sa réponse).",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description:
            "URL complète du site à auditer. La même que celle passée à afficher_site_hote.",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "auditer_seo",
    description:
      "Lance un audit SEO du site du visiteur (title, meta description, H1, Open Graph, images sans alt, langue, poids HTML). Durée garantie minimum 8 secondes. Pendant ce temps, tu NE PARLES PAS. Appelle ce tool APRÈS l'audit sécurité, après avoir affiché à nouveau le site hôte (afficher_site_hote) et dit 'Je vais faire la même chose avec votre SEO, donnez-moi deux minutes'.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "URL complète du site à auditer.",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "auditer_referencement",
    description:
      "Lance un audit RÉFÉRENCEMENT externe du site (position sur Google pour les requêtes métier du client, concurrents visibles). Interroge Serper/Google Search sur 2-4 requêtes représentatives. Durée garantie minimum 8 secondes, animation côté panneau. Appelle ce tool APRÈS l'audit SEO, après avoir demandé l'autorisation : 'Et dernière chose, j'aimerais regarder comment vous êtes référencé — où vous apparaissez quand on cherche votre métier.' Fournis les mots-clés adaptés au secteur du visiteur (métier + ville ou pays, nom de marque, type de produit).",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "URL complète du site à auditer en référencement.",
        },
        mots_cles: {
          type: "array",
          items: { type: "string" },
          description:
            "2 à 4 requêtes à tester sur Google. Adapte-les au secteur du client. Exemples pour une boulangerie à Lyon : ['boulangerie Lyon', 'pain traditionnel Lyon', 'nom-de-la-marque']. Exemples pour un cabinet d'avocats droit du travail à Paris : ['avocat droit du travail Paris', 'avocat prud'hommes', 'nom-du-cabinet'].",
          minItems: 2,
          maxItems: 4,
        },
      },
      required: ["url", "mots_cles"],
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
  {
    name: "estimer_tarif_axisolver",
    description:
      "Calcule et affiche dans le panneau de travail le tarif AxiSolver recommandé pour le visiteur. À appeler APRÈS avoir obtenu en conversation les 5 informations suivantes : (1) il a un site internet (sinon pas d'estimation possible, propose plutôt AXI Vitrine Complète), (2) volume de visiteurs mensuels (approximation OK), (3) secteur d'activité parmi la liste autorisée, (4) usage principal du site (support/vente/leads/vitrine/mixte), (5) taille de l'équipe actuelle (aucune/une/petite/grande). Le tool CALCULE le prix officiel via la formule interne — ne cite jamais un chiffre toi-même, laisse le panneau l'afficher. Après l'appel, enchaîne vocalement avec une phrase du type « Voici votre estimation, visible à gauche. La formule qui vous correspond, c'est AxiSolver [nom], à [prix] euros par mois hors taxes. »",
    input_schema: {
      type: "object" as const,
      properties: {
        visiteursMois: {
          type: "number",
          minimum: 1,
          description:
            "Nombre de visiteurs mensuels du site, approximation OK (ex. 5000, 20000).",
        },
        secteurSlug: {
          type: "string",
          enum: [
            "vitrine",
            "ecommerce",
            "ecommerce-premium",
            "saas",
            "support",
            "medical-juridique",
            "medias",
            "immobilier",
            "autre",
          ],
          description:
            "Secteur d'activité du visiteur, choisi dans la liste du référentiel sectoriel.",
        },
        usagePrincipal: {
          type: "string",
          enum: ["support", "vente", "leads", "vitrine", "mixte"],
          description:
            "Usage principal du site : support client, vente en ligne, génération de leads, vitrine corporate, ou mixte.",
        },
        tailleEquipe: {
          type: "string",
          enum: ["aucune", "une", "petite", "grande"],
          description:
            "Taille de l'équipe qui répond aujourd'hui aux visiteurs : aucune personne, une seule, petite équipe 2-5, grande équipe 5+.",
        },
      },
      required: [
        "visiteursMois",
        "secteurSlug",
        "usagePrincipal",
        "tailleEquipe",
      ],
    },
  },
  {
    name: "proposer_cloture_conversation",
    description:
      "Affiche l'écran de clôture final dans le panneau de gauche : case à cocher 'J'accepte d'être recontacté par Ataraxis' + bouton 'Clôturer et recevoir mon compte-rendu'. Le bouton ne s'active que si la case est cochée. À appeler systématiquement à la fin de la conversation, après le morpion (ou directement après la référence AXI si le morpion n'a pas été proposé). C'est la dernière action du widget — après le clic du visiteur, les ailettes se replient et le widget se ferme.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "chercher_base_connaissances",
    description:
      "Interroge la base de connaissances du site hôte (contenus URL/sitemap crawlés + PDF uploadés par le propriétaire du site). À utiliser dès qu'une question du visiteur porte sur le contenu, les tarifs, les horaires, les services, les procédures du site. Retourne les passages les plus pertinents avec leur source (URL ou page du PDF). INSTRUCTION ABSOLUE : si tu utilises un résultat, cite la source dans ta réponse. Si aucun résultat ne répond vraiment, dis-le franchement — ne jamais inventer. Ne pas appeler ce tool si la question n'a rien à voir avec le site (ex. une blague, une salutation).",
    input_schema: {
      type: "object" as const,
      properties: {
        requete: {
          type: "string" as const,
          description:
            "La question ou le sujet à chercher, reformulé en 5-20 mots. Formule à la 3e personne ou en requête neutre (ex. 'tarifs consultation licenciement' plutôt que 'je voudrais savoir le prix').",
        },
        nb_resultats: {
          type: "integer" as const,
          minimum: 1,
          maximum: 10,
          description:
            "Nombre de passages à récupérer. Défaut : 5. Monter à 8-10 pour une question large, baisser à 3 pour une question très ciblée.",
        },
      },
      required: ["requete"],
    },
  },
];

/** État initial du panneau au démarrage de la conversation. */
export const ETAT_PANNEAU_INITIAL: EtatPanneauTravail = {
  fiche: {},
  elementActif: { kind: "aucun" },
};
