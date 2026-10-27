export type PilierSecurity =
  | "headers"
  | "tls"
  | "exposition"
  | "cookies"
  | "contenu"
  | "reputation";

export type SeveriteFinding = "critique" | "haute" | "moyenne" | "basse" | "info";

export type FindingSecurity = {
  pilier: PilierSecurity;
  code: string;
  severite: SeveriteFinding;
  message: string;
  details?: Record<string, unknown>;
};

export type RecommandationSecurity = {
  titre: string;
  description: string;
  priorite: "critique" | "haute" | "moyenne" | "basse";
  effort: "faible" | "moyen" | "eleve";
  impact: "faible" | "moyen" | "fort";
  pilier: PilierSecurity;
  pris_en_charge_axi?: {
    pack: string;
    cout_sans_axi: string;
    cout_avec_axi: string;
  };
};

export type ScoresParPilier = {
  headers: number;
  tls: number;
  exposition: number;
  cookies: number;
  contenu: number;
  reputation: number;
};

export type ResultatAuditSecurity = {
  urlAuditee: string;
  dureeMs: number;
  scoreGlobal: number;
  scores: ScoresParPilier;
  findings: FindingSecurity[];
  recommandations: RecommandationSecurity[];
  certificatSslExpireeLe: Date | null;
};
