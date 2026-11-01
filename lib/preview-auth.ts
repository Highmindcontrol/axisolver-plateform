/**
 * Verrou Basic Auth pré-lancement Ataraxis.
 *
 * Active si les variables d'env PREVIEW_AUTH_USER et PREVIEW_AUTH_PASS
 * sont définies côté Vercel. Si l'une des deux manque, aucun effet
 * (le site est public). Pour ouvrir au public : retirer
 * PREVIEW_AUTH_PASS dans Vercel.
 */
import { NextResponse, type NextRequest } from "next/server";

export function checkPreviewAuth(
  request: NextRequest,
): NextResponse | null {
  const user = process.env.PREVIEW_AUTH_USER;
  const pass = process.env.PREVIEW_AUTH_PASS;
  if (!user || !pass) return null;

  const { pathname } = request.nextUrl;

  // Laisser passer les assets Next, favicons et fichiers statiques.
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|txt|xml|woff|woff2|ttf|otf|map)$/i.test(
      pathname,
    )
  ) {
    return null;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6));
      const sep = decoded.indexOf(":");
      if (sep >= 0) {
        const u = decoded.slice(0, sep);
        const p = decoded.slice(sep + 1);
        if (u === user && p === pass) return null;
      }
    } catch {
      // Header mal formé, on redemande l'auth.
    }
  }

  return new NextResponse("Authentification requise", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="Preview Ataraxis", charset="UTF-8"`,
    },
  });
}
