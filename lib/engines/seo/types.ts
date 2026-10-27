export type PilierSeo =
  | "technique"
  | "contenu"
  | "mots_cles"
  | "performance"
  | "mobile";

export type SeveriteFinding = "critique" | "haute" | "moyenne" | "basse" | "info";

export type FindingSeo = {
  pilier: PilierSeo;
  code: string;
  severite: SeveriteFinding;
  message: string;
  details?: Record<string, unknown>;
};

export type RecommandationSeo = {
  titre: string;
  description: string;
  priorite: "critique" | "haute" | "moyenne" | "basse";
  effort: "faible" | "moyen" | "eleve";
  impact: "faible" | "moyen" | "fort";
  pilier: PilierSeo;
  pris_en_charge_axi?: {
    pack: string;
    cout_sans_axi: string;
    cout_avec_axi: string;
  };
};

export type ScoresParPilier = {
  technique: number;
  contenu: number;
  mots_cles: number;
  performance: number;
  mobile: number;
};

export type ResultatAuditSeo = {
  urlAuditee: string;
  motsClesTestes: string[];
  dureeMs: number;
  scoreGlobal: number;
  scores: ScoresParPilier;
  findings: FindingSeo[];
  recommandations: RecommandationSeo[];
};
