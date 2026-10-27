import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { embedUn } from "./embeddings";
import type { ChunkMeta } from "@/lib/db/schema";

/**
 * Recherche sémantique dans la base de connaissances d'un site.
 *
 * 1. Embed la requête utilisateur (text-embedding-3-small)
 * 2. Appelle la fonction SQL `chercher_chunks_proches` qui utilise
 *    l'index HNSW cosine pour trouver les N chunks les plus
 *    sémantiquement proches
 * 3. Formate pour Claude avec les sources citables (URL / page PDF)
 *
 * Utilise le client Supabase admin (bypass RLS) parce que le tool
 * call n'a pas de user context — c'est AxiSolver qui parle au nom
 * du site hôte.
 */

export type ChunkTrouve = {
  texte: string;
  distance: number;
  source: {
    url?: string;
    titre?: string;
    page?: number;
  };
};

export async function rechercher(params: {
  siteId: string;
  requete: string;
  limite?: number;
}): Promise<ChunkTrouve[]> {
  const { siteId, requete, limite = 5 } = params;

  if (!requete || requete.trim().length < 3) return [];

  const vecteur = await embedUn(requete);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("chercher_chunks_proches", {
    p_site_id: siteId,
    p_embedding: `[${vecteur.join(",")}]`,
    p_limite: limite,
  });

  if (error) {
    console.error("[rechercher]", error.message);
    return [];
  }

  if (!Array.isArray(data)) return [];

  return data.map((row) => {
    const meta = (row.meta ?? {}) as ChunkMeta;
    return {
      texte: String(row.texte ?? ""),
      distance: Number(row.distance ?? 0),
      source: {
        url: meta.url,
        titre: meta.titre,
        page: meta.page,
      },
    };
  });
}

/** Formate les résultats pour injection dans le tool_result Claude. */
export function formaterResultats(resultats: ChunkTrouve[]): string {
  if (resultats.length === 0) {
    return "Aucun résultat pertinent dans la base de connaissances du site.";
  }

  const blocs = resultats.map((r, i) => {
    const sourceStr = formaterSource(r.source);
    return `[Résultat ${i + 1}] (score ${r.distance.toFixed(2)})\nSource : ${sourceStr}\n\n${r.texte}`;
  });

  return [
    "Voici les passages les plus pertinents trouvés dans la base de connaissances du site :",
    "",
    ...blocs,
    "",
    "INSTRUCTION OBLIGATOIRE : réponds en citant la source (titre, URL ou page du PDF) chaque fois que tu t'appuies sur un de ces passages. Si rien ne répond vraiment à la question, dis-le franchement — ne jamais inventer.",
  ].join("\n");
}

function formaterSource(s: ChunkTrouve["source"]): string {
  const parts: string[] = [];
  if (s.titre) parts.push(s.titre);
  if (s.url) parts.push(s.url);
  if (s.page !== undefined) parts.push(`page ${s.page}`);
  return parts.length > 0 ? parts.join(" · ") : "source non identifiée";
}
