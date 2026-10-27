import "server-only";

// @ts-expect-error — pdf-parse n'exporte pas de types natifs
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { ingererSegments } from "./ingest";

/**
 * Ingestion d'un PDF uploadé par le propriétaire du site.
 *
 * Scénario : un cabinet d'avocats charge sa plaquette tarifaire, une
 * école son règlement intérieur, un restaurant son menu. AxiSolver
 * en extrait le texte, le chunke, l'embed, et sait répondre
 * précisément en citant la page source.
 *
 * Taille max 20 MB. Au-delà, c'est probablement un PDF scanné (OCR
 * nécessaire) — on refuse avec message clair.
 */

const TAILLE_MAX_OCTETS = 20 * 1024 * 1024;

export async function ingererPdf(params: {
  siteId: string;
  sourceId: string;
  buffer: Buffer;
  nomFichier: string;
}): Promise<{ nbChunks: number; nbPages: number; titre: string | null }> {
  const { siteId, sourceId, buffer, nomFichier } = params;

  if (buffer.length > TAILLE_MAX_OCTETS) {
    throw new Error(
      `PDF trop volumineux (${Math.round(buffer.length / 1024 / 1024)} MB, max ${
        TAILLE_MAX_OCTETS / 1024 / 1024
      } MB)`,
    );
  }

  const parsed = await pdfParse(buffer);
  const texte = String(parsed.text ?? "").trim();
  const nbPages = Number(parsed.numpages ?? 0);
  const titre =
    (parsed.info?.Title as string | undefined) ?? nomFichier.replace(/\.pdf$/i, "");

  if (!texte || texte.length < 100) {
    throw new Error(
      `Aucun texte extrait du PDF ${nomFichier} — probablement un scan (OCR non supporté V1).`,
    );
  }

  // Découpe par page pour pouvoir citer la page source dans la
  // recherche sémantique. pdf-parse concatène tout le texte avec \n\f
  // (form feed) entre les pages. On split sur \f, fallback approximatif
  // par pagination si le marqueur manque.
  const segments = decouperParPage(texte, nbPages, nomFichier, titre);

  const result = await ingererSegments({ siteId, sourceId, segments });
  return { nbChunks: result.nbChunks, nbPages, titre };
}

function decouperParPage(
  texteComplet: string,
  nbPages: number,
  nomFichier: string,
  titre: string | null,
): Array<{ texte: string; meta: { page?: number; titre?: string } }> {
  // pdf-parse insère un form feed \f entre les pages
  const pages = texteComplet.split(/\f/).filter((p) => p.trim().length > 0);

  if (pages.length > 1) {
    return pages.map((texte, i) => ({
      texte: texte.trim(),
      meta: {
        page: i + 1,
        titre: titre ?? nomFichier,
      },
    }));
  }

  // Fallback : pas de marqueurs de page, on garde tout en un segment
  return [
    {
      texte: texteComplet,
      meta: { titre: titre ?? nomFichier },
    },
  ];
}
