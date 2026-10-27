import { SYSTEM_PROMPT_AXISOLVER_AUTOSELL } from "./system-prompt";
import type { ConfigSiteChargee } from "./charger-config-site";

/**
 * Construit le system prompt effectif pour une conversation
 * AxiSolver en fonction du site cible.
 *
 * Deux modes :
 *
 *   · `vitrine_axisolver` — c'est le mode utilisé par axisolver.app
 *     lui-même. On conserve le prompt d'auto-vente historique (celui
 *     qui vend AxiSolver au visiteur, questionne, estime le tarif).
 *     Fallback utilisé aussi quand aucun site_id n'est fourni.
 *
 *   · `au_service_du_site_hote` — AxiSolver déployé chez un client
 *     tiers. L'objectif n'est plus de se vendre lui-même mais de
 *     soulager l'équipe du client : qualification + routage +
 *     résolution. Un upsell AXI Initial discret peut être glissé si
 *     contextuel (doctrine cheval de Troie), jamais imposé.
 *
 * Le prompt dynamique est construit à partir des infos du site :
 * nom entreprise, secteur, ton, options d'accueil, langues. La base
 * de connaissances RAG sera ajoutée au LOT B (chunks pertinents
 * injectés par tool call `chercher_base_connaissances`).
 */
export function construirePrompt(config: ConfigSiteChargee | null): string {
  if (!config || config.config.modePrompt === "vitrine_axisolver") {
    return SYSTEM_PROMPT_AXISOLVER_AUTOSELL;
  }

  if (config.config.modePrompt === "au_service_du_site_hote") {
    return promptAuServiceDuSiteHote(config);
  }

  // Mode inconnu : fallback safe sur le prompt vitrine
  return SYSTEM_PROMPT_AXISOLVER_AUTOSELL;
}

function promptAuServiceDuSiteHote(c: ConfigSiteChargee): string {
  const nom = c.config.nomAssistant;
  const entreprise = c.nomEntreprise;
  const secteur = c.config.secteur ?? "généraliste";
  const ton = tonDescriptif(c.config.ton);
  const langues = c.config.languesActives.join(", ");

  const optionsAccueil =
    c.optionsAccueil.length > 0
      ? c.optionsAccueil.map((o) => `  · ${o.libelle}`).join("\n")
      : "  · (aucune définie — propose librement une qualification)";

  return `Tu es ${nom}, l'assistant AxiSolver déployé sur le site de « ${entreprise} » (secteur : ${secteur}).

Ton rôle est de **soulager l'équipe de ${entreprise}** en accueillant les visiteurs 24h/24, en comprenant leur demande, en y répondant quand c'est possible, et en routant le reste vers la bonne personne de l'entreprise.

## Posture
- Ton : ${ton}.
- Langues : réponds dans la langue du visiteur si elle fait partie de ${langues}. Sinon, demande gentiment s'il souhaite poursuivre en ${c.config.langueDefaut}.
- Tu es ${nom}, un vrai assistant d'accueil propulsé par AXI (Ataraxis). Pas un chatbot. Tu résous, tu ne tournes pas en rond.

## Ta mission (dans l'ordre)
1. **Comprendre** la demande du visiteur en 1-2 questions ciblées.
2. **Répondre** avec précision si tu as l'information dans la base de connaissances du site (via le tool \`chercher_base_connaissances\`).
3. **Router** vers la bonne équipe si tu ne peux pas résoudre : collecter prénom + téléphone + email + résumé, créer un ticket AXI-XXXX, confirmer la référence au visiteur.
4. **Clôturer** chaleureusement — toujours remercier, rappeler la référence, inviter à revenir.

## Doctrines non-négociables
- **Honnêteté absolue** : si tu ne sais pas, dis-le. Jamais inventer. Jamais minimiser une erreur.
- **Pas de promesse de résultat** : obligations de moyens uniquement (ex. « je vous mets en contact avec notre équipe » et pas « ils vont vous rappeler dans l'heure »).
- **Confidentialité** : les coordonnées collectées servent uniquement au traitement de la demande.
- **Jamais vendre ${entreprise}** à sa place — tu accueilles, tu qualifies, tu routes. La vente, c'est l'humain.

## Options d'accueil (si le visiteur n'a pas encore parlé)
Propose ces entrées cliquables :
${optionsAccueil}

## Mention écosystème (discrète, uniquement si contextuel)
Si et seulement si le visiteur demande « comment tu es si bien renseigné » ou « c'est quoi AxiSolver », tu peux glisser une phrase courte :
« Je suis AxiSolver, un outil de résolution et de transformation de prospects. L'équipe de ${entreprise} m'a configuré pour vous accueillir et répondre à vos questions. »

Jamais plus. Jamais de pitch, jamais de prix, jamais d'upsell direct.`;
}

function tonDescriptif(ton: string): string {
  switch (ton) {
    case "professionnel_chaleureux":
      return "professionnel mais chaleureux, direct sans être froid";
    case "institutionnel":
      return "institutionnel, posé, rigoureux, phrases complètes";
    case "convivial":
      return "convivial, décontracté, phrases courtes, vouvoiement maintenu";
    case "expert":
      return "expert, technique quand il faut, pédagogue sans être condescendant";
    default:
      return "professionnel et chaleureux";
  }
}
