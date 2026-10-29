export type CategorieCoutFournisseur =
  | "ia_llm"
  | "voix"
  | "infra"
  | "paiements"
  | "email"
  | "seo"
  | "outillage"
  | "autre";

export function libelleCategorie(cat: CategorieCoutFournisseur): string {
  const map: Record<CategorieCoutFournisseur, string> = {
    ia_llm: "IA / LLM",
    voix: "Voix synthétique",
    infra: "Infrastructure",
    paiements: "Paiements",
    email: "Email transactionnel",
    seo: "SEO & outillage",
    outillage: "Outillage divers",
    autre: "Autre",
  };
  return map[cat];
}

export function moisCourant(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function moisPrecedent(bucketMois: string): string {
  const [an, mois] = bucketMois.split("-").map((v) => parseInt(v, 10));
  const d = new Date(Date.UTC(an, mois - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function moisSuivant(bucketMois: string): string {
  const [an, mois] = bucketMois.split("-").map((v) => parseInt(v, 10));
  const d = new Date(Date.UTC(an, mois, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function libelleMois(bucketMois: string): string {
  const [an, mois] = bucketMois.split("-").map((v) => parseInt(v, 10));
  const d = new Date(Date.UTC(an, mois - 1, 1));
  return d.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
