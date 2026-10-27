import { and, eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Télécharge le fichier de vérification de propriété prêt à uploader
 * à la racine du site hôte. Vérifie que l'utilisateur authentifié est
 * bien propriétaire du site + que le token du URL match.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; token: string }> },
) {
  const { slug, token } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non authentifié", { status: 401 });
  }

  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, user.id)))
    .limit(1);
  if (!site || site.tokenVerificationFichier !== token) {
    return new Response("Non autorisé", { status: 404 });
  }

  const nomFichier = `axisolver-verification-${token}.txt`;
  return new Response(token, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
      "Cache-Control": "no-store",
    },
  });
}
