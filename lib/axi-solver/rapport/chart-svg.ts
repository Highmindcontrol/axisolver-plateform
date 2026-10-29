import "server-only";

/**
 * Génère un petit bar chart SVG inline email-ready pour le rapport
 * quotidien AxiSolver. Pas de JS, pas de dépendance externe : juste
 * du SVG statique inclus dans le HTML. Compatible Gmail, Apple Mail,
 * Outlook récent.
 */

export function barChartHoraireSvg(params: {
  valeurs: number[]; // 24 valeurs (0h → 23h)
  largeur?: number;
  hauteur?: number;
  couleur?: string;
}): string {
  const largeur = params.largeur ?? 540;
  const hauteur = params.hauteur ?? 110;
  const couleur = params.couleur ?? "#4f46e5";
  const valeurs = params.valeurs.length === 24 ? params.valeurs : Array(24).fill(0);

  const max = Math.max(1, ...valeurs);
  const padGauche = 24;
  const padBas = 20;
  const padHaut = 8;
  const padDroit = 8;
  const zoneLargeur = largeur - padGauche - padDroit;
  const zoneHauteur = hauteur - padBas - padHaut;
  const nbBars = 24;
  const barLargeur = zoneLargeur / nbBars - 2;

  let barres = "";
  for (let i = 0; i < nbBars; i++) {
    const h = (valeurs[i] / max) * zoneHauteur;
    const x = padGauche + i * (zoneLargeur / nbBars) + 1;
    const y = padHaut + (zoneHauteur - h);
    barres += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barLargeur.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${couleur}" opacity="${0.35 + 0.65 * (valeurs[i] / max)}" />`;
  }

  // Axe Y : 0 et max
  const axeY = `
    <text x="${padGauche - 6}" y="${padHaut + 4}" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="#94a3b8">${max}</text>
    <text x="${padGauche - 6}" y="${padHaut + zoneHauteur}" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="#94a3b8">0</text>
  `;

  // Axe X : labels 0h, 6h, 12h, 18h, 23h
  const labelsX = [0, 6, 12, 18, 23]
    .map((h) => {
      const x = padGauche + h * (zoneLargeur / nbBars) + barLargeur / 2 + 1;
      return `<text x="${x.toFixed(1)}" y="${hauteur - 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#94a3b8">${h}h</text>`;
    })
    .join("");

  // Ligne de base
  const baseline = `<line x1="${padGauche}" y1="${padHaut + zoneHauteur}" x2="${largeur - padDroit}" y2="${padHaut + zoneHauteur}" stroke="#e2e8f0" stroke-width="1" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" width="100%" height="${hauteur}" role="img" aria-label="Activité horaire des conversations">
  ${baseline}
  ${barres}
  ${axeY}
  ${labelsX}
</svg>`;
}
