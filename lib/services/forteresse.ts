import { randomBytes, createHash } from "node:crypto";
import { desc, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { tokensApiForteresse } from "@/lib/db/schema";
import {
  listerCoutsMois,
  totalCoutsMois,
  totalParCategorie,
} from "@/lib/services/couts-fournisseurs";
import { moisCourant, moisPrecedent } from "@/lib/services/couts-fournisseurs-types";
import { lireMetriquesPlateforme } from "@/lib/services/metriques-plateforme";

/**
 * Services d'export vers la Forteresse Ataraxis.
 *
 * - gestion des tokens API (création SHA-256 hashée, listage, révocation)
 * - construction du snapshot JSON structuré consommé par la Forteresse
 *
 * Doctrine : les tokens clairs ne sont AFFICHÉS QU'UNE FOIS lors de la
 * création. En base on ne stocke que le hash SHA-256 — exactement comme
 * les mots de passe. Si l'utilisateur perd le token, il doit en créer
 * un nouveau (pas de récupération possible).
 */

export type TokenForteresseInfo = {
  id: string;
  nom: string;
  creeLe: Date;
  derniereUtilisationLe: Date | null;
  revoqueLe: Date | null;
};

const PREFIXE_TOKEN = "fort_";

export function genererToken(): string {
  return PREFIXE_TOKEN + randomBytes(32).toString("hex");
}

export function hasherToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function creerToken(
  nom: string,
  creeParUserId: string,
): Promise<{ token: string; info: TokenForteresseInfo }> {
  const token = genererToken();
  const tokenHash = hasherToken(token);
  const [row] = await db
    .insert(tokensApiForteresse)
    .values({
      nom: nom.trim(),
      tokenHash,
      creeParUserId,
    })
    .returning();
  return {
    token,
    info: {
      id: row.id,
      nom: row.nom,
      creeLe: row.creeLe,
      derniereUtilisationLe: row.derniereUtilisationLe,
      revoqueLe: row.revoqueLe,
    },
  };
}

export async function listerTokens(): Promise<TokenForteresseInfo[]> {
  try {
    const rows = await db
      .select()
      .from(tokensApiForteresse)
      .orderBy(desc(tokensApiForteresse.creeLe));
    return rows.map((r) => ({
      id: r.id,
      nom: r.nom,
      creeLe: r.creeLe,
      derniereUtilisationLe: r.derniereUtilisationLe,
      revoqueLe: r.revoqueLe,
    }));
  } catch {
    return [];
  }
}

export async function revoquerToken(id: string): Promise<void> {
  await db
    .update(tokensApiForteresse)
    .set({ revoqueLe: new Date() })
    .where(eq(tokensApiForteresse.id, id));
}

export async function supprimerToken(id: string): Promise<void> {
  await db.delete(tokensApiForteresse).where(eq(tokensApiForteresse.id, id));
}

/**
 * Vérifie un token Bearer (clair) et renvoie l'id du token si valide.
 * Met à jour derniereUtilisationLe au passage (observabilité).
 */
export async function verifierToken(tokenClair: string): Promise<{
  valide: boolean;
  tokenId?: string;
}> {
  if (!tokenClair.startsWith(PREFIXE_TOKEN)) return { valide: false };
  const hash = hasherToken(tokenClair);
  try {
    const [row] = await db
      .select({
        id: tokensApiForteresse.id,
        revoqueLe: tokensApiForteresse.revoqueLe,
      })
      .from(tokensApiForteresse)
      .where(eq(tokensApiForteresse.tokenHash, hash))
      .limit(1);
    if (!row || row.revoqueLe) return { valide: false };

    db.update(tokensApiForteresse)
      .set({ derniereUtilisationLe: new Date() })
      .where(eq(tokensApiForteresse.id, row.id))
      .catch(() => {});

    return { valide: true, tokenId: row.id };
  } catch {
    return { valide: false };
  }
}

/**
 * Payload JSON consommé par la Forteresse Ataraxis.
 * Snapshot complet de l'état d'AxiSolver à l'instant t.
 */
export type SnapshotForteresse = {
  genereLe: string;
  site: {
    nom: "AxiSolver";
    url: "https://axisolver.app";
  };
  commerce: {
    nbClientsTotal: number;
    nbClientsNouveauxCeMois: number;
    nbSitesInstalles: number;
    nbAbonnementsActifs: number;
    nbEssaisEnCours: number;
    nbAnnulationsProgrammees: number;
    mrrEurHt: number;
    arrProjeteEurHt: number;
    repartitionFormules: Array<{
      plan: string;
      nomFormule: string;
      nbAbonnements: number;
      revenuMensuelHt: number;
    }>;
  };
  usage: {
    moisCourant: string;
    nbConversations: number;
    nbMessages: number;
    topSites: Array<{
      slug: string;
      nom: string;
      nbConversations: number;
    }>;
  };
  couts: {
    moisCourant: string;
    totalMoisCourantEurHt: number;
    moisPrecedent: string;
    totalMoisPrecedentEurHt: number;
    evolutionPct: number | null;
    parCategorie: Array<{
      categorie: string;
      totalEurHt: number;
    }>;
    detailMoisCourant: Array<{
      fournisseur: string;
      categorie: string;
      montantEurHt: number;
    }>;
  };
  margeBrute: {
    mrrEurHt: number;
    coutsMoisEurHt: number;
    margeBruteEurHt: number;
    tauxMargePct: number | null;
  };
};

export async function construireSnapshot(): Promise<SnapshotForteresse> {
  const mc = moisCourant();
  const mp = moisPrecedent(mc);

  const [metriques, totalCourant, totalPrecedent, parCategorie, detailMois] =
    await Promise.all([
      lireMetriquesPlateforme(),
      totalCoutsMois(mc),
      totalCoutsMois(mp),
      totalParCategorie(mc),
      listerCoutsMois(mc),
    ]);

  const evolutionPct =
    totalPrecedent > 0
      ? Math.round(((totalCourant - totalPrecedent) / totalPrecedent) * 100)
      : null;

  const margeBrute = metriques.mrrEurHt - totalCourant;
  const tauxMargePct =
    metriques.mrrEurHt > 0
      ? Math.round((margeBrute / metriques.mrrEurHt) * 100)
      : null;

  return {
    genereLe: new Date().toISOString(),
    site: {
      nom: "AxiSolver",
      url: "https://axisolver.app",
    },
    commerce: {
      nbClientsTotal: metriques.nbClientsTotal,
      nbClientsNouveauxCeMois: metriques.nbClientsNouveauxCeMois,
      nbSitesInstalles: metriques.nbSitesTotal,
      nbAbonnementsActifs: metriques.nbAbonnementsActifs,
      nbEssaisEnCours: metriques.nbEssaisEnCours,
      nbAnnulationsProgrammees: metriques.nbAnnulationsEnCours,
      mrrEurHt: metriques.mrrEurHt,
      arrProjeteEurHt: metriques.mrrEurHt * 12,
      repartitionFormules: metriques.repartitionFormules.map((r) => ({
        plan: r.plan,
        nomFormule: r.nomFormule,
        nbAbonnements: r.nbAbonnements,
        revenuMensuelHt: r.revenuMensuelHt,
      })),
    },
    usage: {
      moisCourant: mc,
      nbConversations: metriques.nbConversationsCeMois,
      nbMessages: metriques.nbMessagesCeMois,
      topSites: metriques.topSitesConversations.map((s) => ({
        slug: s.siteSlug,
        nom: s.nomSite,
        nbConversations: s.nbConversations,
      })),
    },
    couts: {
      moisCourant: mc,
      totalMoisCourantEurHt: totalCourant,
      moisPrecedent: mp,
      totalMoisPrecedentEurHt: totalPrecedent,
      evolutionPct,
      parCategorie: parCategorie.map((pc) => ({
        categorie: pc.categorie,
        totalEurHt: pc.total,
      })),
      detailMoisCourant: detailMois.map((d) => ({
        fournisseur: d.fournisseur,
        categorie: d.categorie,
        montantEurHt: d.montantEurHt,
      })),
    },
    margeBrute: {
      mrrEurHt: metriques.mrrEurHt,
      coutsMoisEurHt: totalCourant,
      margeBruteEurHt: margeBrute,
      tauxMargePct,
    },
  };
}
