import "server-only";

import type { StatsQuotidiennes } from "./agreger";

/**
 * Pattern « cheval de Troie commercial » (doctrine fondatrice 12 oct 2026).
 *
 * À partir des stats du jour, détecte UNE opportunité manquée pour
 * laquelle un AXI Initial branché en Duo aurait apporté une valeur
 * concrète. Génère un message contextuel personnalisé.
 *
 * Règles strictes :
 *   · Jamais plus d'une mention par rapport
 *   · Jamais si pas d'opportunité réelle détectée (volume < 2)
 *   · Toujours chiffré et spécifique (pas de « vous pourriez bénéficier
 *     de… »), toujours en « j'aurais pu [verbe] [nb] [chose] »
 *   · Toujours un lien direct d'inscription AXI Initial avec coupon
 *     de bienvenue AxiSolver
 *
 * Les opportunités sont classées par ROI : rappels > RDV > tarifs
 * > tickets non traités > conversations sans résolution.
 */

export type OpportuniteUpsell = {
  nature:
    | "rappels_manques"
    | "rdv_non_planifies"
    | "demandes_tarif"
    | "tickets_non_traites"
    | "conversations_abandonnees"
    | null;
  message: string;
  gainEstimé?: string;
  cta: {
    libelle: string;
    url: string;
  };
};

const SEUIL_MINIMUM = 2;

export function detecterOpportuniteUpsell(
  stats: StatsQuotidiennes,
): OpportuniteUpsell {
  const ctaAxi = {
    libelle: "Découvrir AXI Initial",
    url: "https://axihub.live/essai?source=rapport-axisolver",
  };

  // Priorité 1 : rappels téléphoniques demandés mais pas traités
  if (stats.nbDemandesRappel >= SEUIL_MINIMUM) {
    return {
      nature: "rappels_manques",
      message: `Hier, ${stats.nbDemandesRappel} visiteur·s ont demandé à être rappelé·s. Je les ai qualifiés et stockés en ticket, mais pas rappelés — ce n'est pas mon rôle. Avec un AXI Initial branché en Duo, j'aurais pu composer ces appels directement depuis votre numéro, les tracer dans votre agenda, et vous envoyer un résumé par email.`,
      gainEstimé: `≈ ${stats.nbDemandesRappel * 12} minutes d'équipe économisées`,
      cta: ctaAxi,
    };
  }

  // Priorité 2 : demandes de RDV non planifiées
  if (stats.nbDemandesRdv >= SEUIL_MINIMUM) {
    return {
      nature: "rdv_non_planifies",
      message: `Hier, ${stats.nbDemandesRdv} visiteur·s voulaient prendre rendez-vous avec votre équipe. J'ai collecté leurs coordonnées, mais vous devez encore les contacter pour caler les créneaux. Avec un AXI Initial branché, j'aurais vérifié votre agenda, proposé les créneaux disponibles au visiteur, confirmé la réservation et envoyé les invitations ICS. Zéro frottement, zéro oubli.`,
      gainEstimé: `≈ ${stats.nbDemandesRdv * 8} minutes d'équipe économisées`,
      cta: ctaAxi,
    };
  }

  // Priorité 3 : tickets chauds + urgents cumulés
  const chaleurElevee = stats.nbTicketsChauds + stats.nbTicketsUrgents;
  if (chaleurElevee >= SEUIL_MINIMUM) {
    return {
      nature: "tickets_non_traites",
      message: `Hier, j'ai détecté ${chaleurElevee} lead·s chaud·s (${stats.nbTicketsChauds} chauds, ${stats.nbTicketsUrgents} urgents). Ils sont dans votre liste de tickets, prêts à être rappelés. Avec un AXI Initial branché en Duo, j'aurais pu les transmettre instantanément à votre commercial par SMS/Slack/email, avec un brief enrichi (secteur, besoin, historique de la conversation). Les leads chauds qui attendent plus de 24h sont perdus 3× sur 4.`,
      gainEstimé: `≈ ${chaleurElevee} opportunités commerciales préservées`,
      cta: ctaAxi,
    };
  }

  // Priorité 4 : demandes de tarif
  if (stats.nbDemandesTarif >= SEUIL_MINIMUM) {
    return {
      nature: "demandes_tarif",
      message: `Hier, ${stats.nbDemandesTarif} visiteur·s ont demandé vos tarifs. J'ai répondu avec les infos de ma base de connaissances, mais je ne sais pas s'ils ont converti. Avec un AXI Initial branché, j'aurais pu les relancer 48h plus tard avec une offre personnalisée, puis les basculer vers un commercial humain s'ils restent silencieux. Le taux de conversion sur relance tarif = 15-25 %.`,
      gainEstimé: `≈ ${Math.round(stats.nbDemandesTarif * 0.2)} ventes additionnelles potentielles`,
      cta: ctaAxi,
    };
  }

  // Priorité 5 : conversations abandonnées
  if (stats.conversationsSansResolution >= 5) {
    return {
      nature: "conversations_abandonnees",
      message: `Hier, ${stats.conversationsSansResolution} conversations se sont terminées sans que je comprenne si le visiteur avait eu sa réponse. Avec un AXI Initial branché, j'aurais pu envoyer un email de suivi 2h après chaque conversation abandonnée pour vérifier la satisfaction et proposer un autre canal. Chaque conversation sans suivi = un prospect peut-être perdu.`,
      cta: ctaAxi,
    };
  }

  // Pas d'opportunité significative détectée
  return {
    nature: null,
    message: "",
    cta: ctaAxi,
  };
}
