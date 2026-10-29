import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { coutsFournisseursMensuel } from "@/lib/db/schema";

export type {
  CategorieCoutFournisseur,
} from "./couts-fournisseurs-types";
export {
  libelleCategorie,
  moisCourant,
  moisPrecedent,
  moisSuivant,
  libelleMois,
} from "./couts-fournisseurs-types";

import type { CategorieCoutFournisseur } from "./couts-fournisseurs-types";

export type LigneCoutFournisseur = {
  id: string;
  bucketMois: string;
  fournisseur: string;
  categorie: CategorieCoutFournisseur;
  montantEurHt: number;
  notes: string | null;
  majLe: Date;
};

/**
 * Catalogue des fournisseurs standards de l'écosystème Ataraxis.
 * Pré-rempli dans l'UI de saisie — l'utilisateur n'a plus qu'à mettre
 * un montant. Peut aussi ajouter un fournisseur ad hoc.
 */
export const CATALOGUE_FOURNISSEURS: ReadonlyArray<{
  fournisseur: string;
  categorie: CategorieCoutFournisseur;
  description: string;
}> = [
  // ─── IA / LLM ──────────────────────────────────────────────
  {
    fournisseur: "OpenAI",
    categorie: "ia_llm",
    description: "GPT-4o, GPT-4o-mini, embeddings OpenAI",
  },
  {
    fournisseur: "Anthropic",
    categorie: "ia_llm",
    description: "Claude Opus / Sonnet / Haiku (API)",
  },
  {
    fournisseur: "Mistral",
    categorie: "ia_llm",
    description: "Mistral Large / Medium (souveraineté EU)",
  },
  {
    fournisseur: "xAI (Grok)",
    categorie: "ia_llm",
    description: "Grok Beta / 3 (Conclave disrupteur)",
  },
  {
    fournisseur: "Google (Gemini)",
    categorie: "ia_llm",
    description: "Gemini 1.5 Pro / 2.0 (Conclave calcul)",
  },
  {
    fournisseur: "Perplexity",
    categorie: "ia_llm",
    description: "Deep Research + sources récentes",
  },
  // ─── Voix ─────────────────────────────────────────────────
  {
    fournisseur: "ElevenLabs",
    categorie: "voix",
    description: "Voix synthétique AxiSolver Premium + AXI vocal",
  },
  // ─── Infra ────────────────────────────────────────────────
  {
    fournisseur: "Supabase",
    categorie: "infra",
    description: "PostgreSQL + Auth + Storage (prod + staging)",
  },
  {
    fournisseur: "Vercel",
    categorie: "infra",
    description: "Hosting Next.js + Cron + Analytics",
  },
  {
    fournisseur: "OVH",
    categorie: "infra",
    description: "Noms de domaine + emails (axisolver.app, ataraxis.group…)",
  },
  // ─── Paiements ────────────────────────────────────────────
  {
    fournisseur: "Stripe",
    categorie: "paiements",
    description: "Frais sur abonnements + packs supp",
  },
  // ─── Email transactionnel ─────────────────────────────────
  {
    fournisseur: "Brevo",
    categorie: "email",
    description: "Emails transactionnels (contact, confirmations, rapports)",
  },
  // ─── SEO ──────────────────────────────────────────────────
  {
    fournisseur: "Ahrefs",
    categorie: "seo",
    description: "Analyse SEO humaine (Standard 249$)",
  },
  {
    fournisseur: "DataForSEO",
    categorie: "seo",
    description: "API SEO pay-per-use (packs AI SEO + AxiLanding)",
  },
  // ─── Outillage ────────────────────────────────────────────
  {
    fournisseur: "Google Workspace",
    categorie: "outillage",
    description: "Emails + Drive + Meet",
  },
  {
    fournisseur: "Canva",
    categorie: "outillage",
    description: "Design (visuels marketing, templates)",
  },
];

export async function listerCoutsMois(
  bucketMois: string,
): Promise<LigneCoutFournisseur[]> {
  try {
    const rows = await db
      .select()
      .from(coutsFournisseursMensuel)
      .where(eq(coutsFournisseursMensuel.bucketMois, bucketMois))
      .orderBy(coutsFournisseursMensuel.categorie, coutsFournisseursMensuel.fournisseur);
    return rows.map((r) => ({
      id: r.id,
      bucketMois: r.bucketMois,
      fournisseur: r.fournisseur,
      categorie: r.categorie as CategorieCoutFournisseur,
      montantEurHt: Number(r.montantEurHt),
      notes: r.notes,
      majLe: r.majLe,
    }));
  } catch {
    return [];
  }
}

export async function totalCoutsMois(bucketMois: string): Promise<number> {
  try {
    const [row] = await db
      .select({ total: sql<string>`COALESCE(SUM(${coutsFournisseursMensuel.montantEurHt}), 0)` })
      .from(coutsFournisseursMensuel)
      .where(eq(coutsFournisseursMensuel.bucketMois, bucketMois));
    return Number(row?.total ?? 0);
  } catch {
    return 0;
  }
}

export async function totalParCategorie(
  bucketMois: string,
): Promise<Array<{ categorie: CategorieCoutFournisseur; total: number }>> {
  try {
    const rows = await db
      .select({
        categorie: coutsFournisseursMensuel.categorie,
        total: sql<string>`SUM(${coutsFournisseursMensuel.montantEurHt})`,
      })
      .from(coutsFournisseursMensuel)
      .where(eq(coutsFournisseursMensuel.bucketMois, bucketMois))
      .groupBy(coutsFournisseursMensuel.categorie)
      .orderBy(desc(sql`SUM(${coutsFournisseursMensuel.montantEurHt})`));
    return rows.map((r) => ({
      categorie: r.categorie as CategorieCoutFournisseur,
      total: Number(r.total),
    }));
  } catch {
    return [];
  }
}

export async function enregistrerCout(options: {
  bucketMois: string;
  fournisseur: string;
  categorie: CategorieCoutFournisseur;
  montantEurHt: number;
  notes?: string | null;
  saisiParUserId: string;
}): Promise<void> {
  const { bucketMois, fournisseur, categorie, montantEurHt, notes, saisiParUserId } =
    options;
  await db
    .insert(coutsFournisseursMensuel)
    .values({
      bucketMois,
      fournisseur,
      categorie,
      montantEurHt: montantEurHt.toString(),
      notes: notes ?? null,
      saisiParUserId,
    })
    .onConflictDoUpdate({
      target: [
        coutsFournisseursMensuel.bucketMois,
        coutsFournisseursMensuel.fournisseur,
        coutsFournisseursMensuel.categorie,
      ],
      set: {
        montantEurHt: montantEurHt.toString(),
        notes: notes ?? null,
        saisiParUserId,
        majLe: new Date(),
      },
    });
}

export async function supprimerCout(id: string): Promise<void> {
  await db.delete(coutsFournisseursMensuel).where(eq(coutsFournisseursMensuel.id, id));
}
