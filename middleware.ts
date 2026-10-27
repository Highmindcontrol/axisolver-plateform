import { type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/session";

/**
 * Middleware racine — rafraîchit la session Supabase sur chaque
 * requête utilisateur pour que les tokens n'expirent jamais
 * silencieusement.
 *
 * Le matcher exclut :
 *   · les assets statiques (_next/static, _next/image, favicon)
 *   · les routes API publiques du widget (chat, synthese-vocale,
 *     transcrire, embed) — elles font leur propre auth via site_id
 *     + Origin check au lieu de la session utilisateur
 */
export async function middleware(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * Match toutes les requêtes sauf :
     *   - _next/static (fichiers de build)
     *   - _next/image (optimisation d'images)
     *   - favicon.ico, icon.png, images publiques
     *   - /api/chat, /api/synthese-vocale, /api/transcrire (API widget publique)
     *   - /api/embed (embed widget côté sites tiers)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.png|.*\\.jpg|.*\\.svg|api/chat|api/synthese-vocale|api/transcrire|api/embed).*)",
  ],
};
