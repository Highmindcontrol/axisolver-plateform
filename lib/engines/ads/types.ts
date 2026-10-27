export type PilierAds =
  | "trackers"
  | "consentement"
  | "visibilite"
  | "remarketing";

export type SeveriteFinding = "critique" | "haute" | "moyenne" | "basse" | "info";

export type FindingAds = {
  pilier: PilierAds;
  code: string;
  severite: SeveriteFinding;
  message: string;
  details?: Record<string, unknown>;
};

export type RecommandationAds = {
  titre: string;
  description: string;
  priorite: "critique" | "haute" | "moyenne" | "basse";
  effort: "faible" | "moyen" | "eleve";
  impact: "faible" | "moyen" | "fort";
  pilier: PilierAds;
  pris_en_charge_axi?: {
    pack: string;
    cout_sans_axi: string;
    cout_avec_axi: string;
  };
};

export type TrackerDetecte = {
  code: string;
  nom: string;
  categorie: "analytics" | "publicite" | "remarketing" | "attribution" | "cmp";
  id?: string;
};

export type AnnonceSerp = {
  requete: string;
  position: number;
  titre: string;
  url: string;
  description?: string;
};

export type ScoresParPilier = {
  trackers: number;
  consentement: number;
  visibilite: number;
  remarketing: number;
};

export type ResultatAuditAds = {
  urlAuditee: string;
  motsClesTestes: string[];
  dureeMs: number;
  scoreGlobal: number;
  scores: ScoresParPilier;
  trackersDetectes: TrackerDetecte[];
  annoncesConcurrentes: AnnonceSerp[];
  findings: FindingAds[];
  recommandations: RecommandationAds[];
};
