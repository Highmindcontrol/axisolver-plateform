"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, siteConnaissanceSources } from "@/lib/db/schema";
import { ingererUrl } from "@/lib/axi-solver/connaissance/ingest-url";
import { ingererSitemap } from "@/lib/axi-solver/connaissance/ingest-sitemap";
import { ingererPdf } from "@/lib/axi-solver/connaissance/ingest-pdf";

/**
 * Server actions de gestion des sources de la base de connaissances.
 *
 * V1 : ingestion synchrone pour URL + PDF (OK sur Vercel serverless
 * jusqu'à ~60s). Sitemap est capé à 20 URLs côté UI (le vrai cap
 * côté ingest-sitemap.ts est à 100) pour éviter les timeouts.
 */

export type EtatSource = {
  erreur: string | null;
  ok?: boolean;
  nbChunks?: number;
};

async function sitePossede(slug: string, userId: string) {
  const [s] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, userId)))
    .limit(1);
  return s ?? null;
}

async function userAuthentifie(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function ajouterSourceUrlAction(
  _prev: EtatSource,
  formData: FormData,
): Promise<EtatSource> {
  const slug = String(formData.get("slug") ?? "").trim();
  const urlBrut = String(formData.get("url") ?? "").trim();

  if (!/^https?:\/\//i.test(urlBrut)) {
    return { erreur: "URL invalide (doit commencer par http:// ou https://)." };
  }

  const userId = await userAuthentifie();
  if (!userId) return { erreur: "Non connecté." };
  const site = await sitePossede(slug, userId);
  if (!site) return { erreur: "Site introuvable." };

  try {
    const [source] = await db
      .insert(siteConnaissanceSources)
      .values({
        siteId: site.id,
        type: "url",
        source: urlBrut,
        nomAffichage: new URL(urlBrut).hostname + new URL(urlBrut).pathname,
        statut: "en_cours",
      })
      .returning();

    const result = await ingererUrl({
      siteId: site.id,
      sourceId: source.id,
      url: urlBrut,
    });

    revalidatePath(`/dashboard/sites/${slug}/base-connaissances`);
    return { erreur: null, ok: true, nbChunks: result.nbChunks };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ajouter-url]", msg);
    return { erreur: `Ingestion échouée : ${msg}` };
  }
}

export async function ajouterSourceSitemapAction(
  _prev: EtatSource,
  formData: FormData,
): Promise<EtatSource> {
  const slug = String(formData.get("slug") ?? "").trim();
  const urlBrut = String(formData.get("urlSitemap") ?? "").trim();

  if (!/^https?:\/\//i.test(urlBrut)) {
    return { erreur: "URL de sitemap invalide." };
  }

  const userId = await userAuthentifie();
  if (!userId) return { erreur: "Non connecté." };
  const site = await sitePossede(slug, userId);
  if (!site) return { erreur: "Site introuvable." };

  try {
    const [source] = await db
      .insert(siteConnaissanceSources)
      .values({
        siteId: site.id,
        type: "sitemap",
        source: urlBrut,
        nomAffichage: `sitemap · ${new URL(urlBrut).hostname}`,
        statut: "en_cours",
      })
      .returning();

    const result = await ingererSitemap({
      siteId: site.id,
      sourceId: source.id,
      urlSitemap: urlBrut,
    });

    revalidatePath(`/dashboard/sites/${slug}/base-connaissances`);
    return { erreur: null, ok: true, nbChunks: result.nbChunks };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ajouter-sitemap]", msg);
    return { erreur: `Ingestion sitemap échouée : ${msg}` };
  }
}

export async function uploadPdfAction(
  _prev: EtatSource,
  formData: FormData,
): Promise<EtatSource> {
  const slug = String(formData.get("slug") ?? "").trim();
  const fichier = formData.get("pdf");

  if (!(fichier instanceof File) || fichier.size === 0) {
    return { erreur: "Aucun fichier PDF sélectionné." };
  }
  if (
    !fichier.name.toLowerCase().endsWith(".pdf") &&
    fichier.type !== "application/pdf"
  ) {
    return { erreur: "Seuls les fichiers PDF sont acceptés." };
  }
  if (fichier.size > 20 * 1024 * 1024) {
    return {
      erreur: `Fichier trop volumineux (${Math.round(fichier.size / 1024 / 1024)} MB, max 20 MB).`,
    };
  }

  const userId = await userAuthentifie();
  if (!userId) return { erreur: "Non connecté." };
  const site = await sitePossede(slug, userId);
  if (!site) return { erreur: "Site introuvable." };

  const buffer = Buffer.from(await fichier.arrayBuffer());

  try {
    const [source] = await db
      .insert(siteConnaissanceSources)
      .values({
        siteId: site.id,
        type: "pdf",
        source: fichier.name,
        nomAffichage: fichier.name,
        statut: "en_cours",
      })
      .returning();

    const result = await ingererPdf({
      siteId: site.id,
      sourceId: source.id,
      buffer,
      nomFichier: fichier.name,
    });

    revalidatePath(`/dashboard/sites/${slug}/base-connaissances`);
    return { erreur: null, ok: true, nbChunks: result.nbChunks };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[upload-pdf]", msg);
    return { erreur: `Ingestion PDF échouée : ${msg}` };
  }
}

export async function supprimerSourceAction(
  slug: string,
  sourceId: string,
): Promise<void> {
  const userId = await userAuthentifie();
  if (!userId) throw new Error("Non connecté");
  const site = await sitePossede(slug, userId);
  if (!site) throw new Error("Site introuvable");

  await db
    .delete(siteConnaissanceSources)
    .where(
      and(
        eq(siteConnaissanceSources.id, sourceId),
        eq(siteConnaissanceSources.siteId, site.id),
      ),
    );
  revalidatePath(`/dashboard/sites/${slug}/base-connaissances`);
}
