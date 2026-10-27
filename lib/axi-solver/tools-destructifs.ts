/**
 * Liste des tool_use « destructifs » qui touchent aux systèmes
 * externes du client (Google Ads, Cloudflare, Vercel Firewall,
 * Google Analytics modif, etc.).
 *
 * Pour tout tool de cette liste, /api/chat refuse l'exécution si la
 * propriété du domaine du site cible n'est pas vérifiée.
 *
 * À enrichir au fur et à mesure que les missions 5 et 6 (SEO/Ads
 * actif et Shield actif) sont implémentées — LOTS H, I, J.
 *
 * Doctrine : jamais d'action irréversible sur un système que l'owner
 * ne nous a pas prouvé lui appartenir. Modèle Google Search Console.
 */

export const TOOLS_DESTRUCTIFS = new Set<string>([
  // Mission 5 — SEO/Ads actif (LOT J)
  "programmer_campagne_adwords",
  "modifier_campagne_adwords",
  "mettre_en_pause_campagne",
  "appliquer_recommandation_seo",

  // Mission 6 — Shield actif (LOT I)
  "poser_regle_blocage_cloudflare",
  "retirer_regle_blocage_cloudflare",
  "poser_regle_firewall_vercel",
  "activer_mode_sous_attaque",
]);

export function estDestructif(nomTool: string): boolean {
  return TOOLS_DESTRUCTIFS.has(nomTool);
}
