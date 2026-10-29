import { NextRequest, NextResponse } from "next/server";

import { construireSnapshot, verifierToken } from "@/lib/services/forteresse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Endpoint consommé par la Forteresse Ataraxis.
 *
 * Authentification : Bearer token (fort_...), hashé SHA-256 côté serveur
 * et comparé au hash en base. Les tokens sont gérés dans
 * /dashboard/super-admin/forteresse.
 *
 * CORS : volontairement absent — la Forteresse appelle depuis son
 * backend, pas depuis un navigateur. Les appels cross-origin sont
 * refusés par défaut.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json(
      { erreur: "Authorization: Bearer <token> requis" },
      { status: 401 },
    );
  }
  const token = auth.slice("Bearer ".length).trim();

  const { valide } = await verifierToken(token);
  if (!valide) {
    return NextResponse.json(
      { erreur: "Token invalide ou révoqué" },
      { status: 401 },
    );
  }

  try {
    const snapshot = await construireSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    console.error("[forteresse] snapshot:", e);
    return NextResponse.json(
      { erreur: "Erreur serveur lors de la construction du snapshot" },
      { status: 500 },
    );
  }
}
