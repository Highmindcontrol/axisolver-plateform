/**
 * Catalogue des connecteurs Composio proposés aux admins AxiSolver.
 *
 * Chaque connecteur a :
 *  - un slug Composio (identifiant côté Composio, voir leur doc)
 *  - un libellé lisible et une description courte orientée bénéfice
 *  - une catégorie (CRM, Support, Email, Agenda, E-commerce, …)
 *  - les cas d'usage AXI concrets (ce que l'admin obtient en connectant)
 *
 * V1 ciblée AxiSolver (widget visiteur) : surtout CRM + Support +
 * Email + Agenda + E-commerce. On n'expose PAS les connecteurs
 * côté « sortant » (Google Ads, Apollo…) qui sont pour AxiHub.
 *
 * Ajouter un connecteur = ajouter une entrée ici. Zéro code à toucher
 * côté UI (la page `/connecteurs` lit ce catalogue).
 */

export type CategorieConnecteur =
  | "crm"
  | "support"
  | "email"
  | "agenda"
  | "ecommerce"
  | "com-interne"
  | "fichiers";

export type ConnecteurCatalogue = {
  slug: string;
  nom: string;
  description: string;
  categorie: CategorieConnecteur;
  casUsage: string[];
  disponible: boolean;
};

export const CATALOGUE_CONNECTEURS: ConnecteurCatalogue[] = [
  /* ─── CRM ────────────────────────────────────────────────── */
  {
    slug: "hubspot",
    nom: "HubSpot",
    description: "CRM n°1 des PME. AXI crée automatiquement vos leads qualifiés et met à jour les deals.",
    categorie: "crm",
    casUsage: [
      "Chaque conversation qualifiée dans AxiSolver → nouveau contact + deal dans HubSpot",
      "Historique de chat posté en note sur la fiche contact",
      "Mise à jour du score de qualification depuis les jauges Gaugista",
    ],
    disponible: true,
  },
  {
    slug: "salesforce",
    nom: "Salesforce",
    description: "CRM d'entreprise. AXI pousse les leads du widget directement dans Sales Cloud.",
    categorie: "crm",
    casUsage: [
      "Création automatique de Lead ou Contact",
      "Journalisation des conversations dans l'historique d'activité",
      "Déclenchement de workflows Salesforce depuis les événements du chat",
    ],
    disponible: true,
  },
  {
    slug: "pipedrive",
    nom: "Pipedrive",
    description: "CRM visuel orienté pipeline. AXI alimente vos deals en temps réel.",
    categorie: "crm",
    casUsage: [
      "Nouveau lead du chat → carte créée dans la bonne étape du pipeline",
      "Enrichissement automatique des contacts avec les données collectées",
    ],
    disponible: true,
  },
  {
    slug: "zoho",
    nom: "Zoho CRM",
    description: "CRM complet et abordable. AXI synchronise contacts et opportunités.",
    categorie: "crm",
    casUsage: [
      "Création de Lead avec champs personnalisés",
      "Attribution automatique au bon commercial",
    ],
    disponible: true,
  },
  {
    slug: "attio",
    nom: "Attio",
    description: "CRM moderne pour équipes design-first. AXI écrit dans vos listes personnalisées.",
    categorie: "crm",
    casUsage: [
      "Ajout de personnes et sociétés dans vos listes",
      "Logging des interactions sur les enregistrements",
    ],
    disponible: true,
  },

  /* ─── Support client ─────────────────────────────────────── */
  {
    slug: "zendesk",
    nom: "Zendesk",
    description: "Support ticketing leader. AXI synchronise les demandes du chat vers vos agents.",
    categorie: "support",
    casUsage: [
      "Ticket chaud du chat → ticket Zendesk ouvert automatiquement",
      "Transcription complète attachée pour contexte agent",
      "Statut mis à jour quand AXI résout la demande",
    ],
    disponible: true,
  },
  {
    slug: "intercom",
    nom: "Intercom",
    description: "Messagerie client haut de gamme. AXI pousse les conversations vers vos commerciaux.",
    categorie: "support",
    casUsage: [
      "Création automatique de conversation Intercom avec contexte",
      "Attribution au bon team member selon le sujet",
    ],
    disponible: true,
  },
  {
    slug: "freshdesk",
    nom: "Freshdesk",
    description: "Alternative Zendesk économique. AXI crée vos tickets prioritaires.",
    categorie: "support",
    casUsage: [
      "Nouveau ticket avec priorité et catégorie",
      "Notes privées sur les tickets existants",
    ],
    disponible: true,
  },

  /* ─── Email ──────────────────────────────────────────────── */
  {
    slug: "gmail",
    nom: "Gmail",
    description: "AXI envoie des emails de suivi au commercial quand un lead chaud arrive.",
    categorie: "email",
    casUsage: [
      "Notification email avec résumé de conversation + coordonnées",
      "Envoi d'un email de bienvenue au visiteur si capturé",
    ],
    disponible: true,
  },
  {
    slug: "outlook",
    nom: "Outlook",
    description: "Même pouvoir que Gmail pour les équipes Microsoft 365.",
    categorie: "email",
    casUsage: [
      "Notifications internes aux commerciaux",
      "Envoi de récapitulatifs post-conversation",
    ],
    disponible: true,
  },

  /* ─── Agenda ─────────────────────────────────────────────── */
  {
    slug: "googlecalendar",
    nom: "Google Calendar",
    description: "AXI prend rendez-vous dans l'agenda du commercial en direct dans le chat.",
    categorie: "agenda",
    casUsage: [
      "Prise de RDV guidée depuis le chat visiteur",
      "Création d'un événement avec invitation + lien visio",
      "Vérification de la disponibilité en temps réel",
    ],
    disponible: true,
  },
  {
    slug: "outlookcalendar",
    nom: "Outlook Calendar",
    description: "Prise de RDV sur agendas Microsoft 365.",
    categorie: "agenda",
    casUsage: [
      "Mêmes capacités que Google Calendar sur stack Microsoft",
    ],
    disponible: true,
  },
  {
    slug: "calcom",
    nom: "Cal.com",
    description: "Agenda de réservation en ligne. AXI partage le lien et confirme le créneau.",
    categorie: "agenda",
    casUsage: [
      "Lien de prise de RDV adapté au contexte du visiteur",
      "Confirmation du créneau choisi dans le chat",
    ],
    disponible: true,
  },

  /* ─── E-commerce ─────────────────────────────────────────── */
  {
    slug: "shopify",
    nom: "Shopify",
    description: "AXI lit vos commandes et répond précisément aux questions SAV e-commerce.",
    categorie: "ecommerce",
    casUsage: [
      "« Où en est ma commande #4523 ? » → statut en temps réel",
      "Informations stock et prix produits",
      "Création de bons de réduction personnalisés",
    ],
    disponible: true,
  },
  {
    slug: "woocommerce",
    nom: "WooCommerce",
    description: "Même pouvoir que Shopify sur les boutiques WordPress.",
    categorie: "ecommerce",
    casUsage: [
      "Statut de commande en direct",
      "Catalogue produit interrogeable",
    ],
    disponible: true,
  },

  /* ─── Com interne ────────────────────────────────────────── */
  {
    slug: "slack",
    nom: "Slack",
    description: "AXI notifie votre équipe quand un lead chaud arrive dans le chat.",
    categorie: "com-interne",
    casUsage: [
      "Message Slack dans #commercial à chaque conversation qualifiée",
      "Alerte urgence si visiteur VIP ou gros panier",
    ],
    disponible: true,
  },
  {
    slug: "microsoftteams",
    nom: "Microsoft Teams",
    description: "Mêmes notifications sur stack Microsoft 365.",
    categorie: "com-interne",
    casUsage: [
      "Notifications dans canaux Teams",
      "Alertes et récapitulatifs",
    ],
    disponible: true,
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */

export function trouverConnecteur(
  slug: string,
): ConnecteurCatalogue | undefined {
  return CATALOGUE_CONNECTEURS.find((c) => c.slug === slug);
}

export function listerParCategorie(
  categorie: CategorieConnecteur,
): ConnecteurCatalogue[] {
  return CATALOGUE_CONNECTEURS.filter(
    (c) => c.categorie === categorie && c.disponible,
  );
}

export const LIBELLES_CATEGORIES: Record<CategorieConnecteur, string> = {
  crm: "CRM",
  support: "Support client",
  email: "Email",
  agenda: "Agenda",
  ecommerce: "E-commerce",
  "com-interne": "Communication interne",
  fichiers: "Fichiers",
};
