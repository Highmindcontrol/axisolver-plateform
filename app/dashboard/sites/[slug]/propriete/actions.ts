"use server";

import { and, eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import {
  verifierProprieteDomaine,
  genererToken,
} from "@/lib/axi-solver/propriete-domaine";

/**
 * Server actions de vérification de propriété du site.
 *
 * - genererTokensAction : génère les tokens fichier + DNS pour un site
 *   (idempotent — ne régénère pas s'ils existent déjà)
 * - verifierProprieteAction : lance la vérification HTTP + DNS, met
 *   à jour sites.propriete_verifiee_le si succès
 *
 * Garde-fou : chaque action vérifie que l'utilisateur authentifié
 * est bien le propriétaire du site (owner_user_id).
 */

export type EtatVerification = {
  erreur: string | null;
  succes?: {
    methode: "fichier" | "dns";
    verifieLe: string;
  };
  erreurs?: string[];
};

async function recupererSitePossede(slug: string, userId: string) {
  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, userId)))
    .limit(1);
  return site ?? null;
}

export async function genererTokensAction(slug: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const site = await recupererSitePossede(slug, user.id);
  if (!site) throw new Error("Site introuvable ou pas propriétaire");

  // Idempotence : ne regénère que si manquant
  const updates: Partial<typeof sites.$inferInsert> = {};
  if (!site.tokenVerificationFichier) {
    updates.tokenVerificationFichier = genererToken();
  }
  if (!site.tokenVerificationDns) {
    updates.tokenVerificationDns = genererToken();
  }
  if (Object.keys(updates).length > 0) {
    await db
      .update(sites)
      .set({ ...updates, majLe: new Date() })
      .where(eq(sites.id, site.id));
  }
}

export async function verifierProprieteAction(
  _prev: EtatVerification,
  formData: FormData,
): Promise<EtatVerification> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { erreur: "slug manquant" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  const site = await recupererSitePossede(slug, user.id);
  if (!site) return { erreur: "Site introuvable." };

  if (!site.tokenVerificationFichier || !site.tokenVerificationDns) {
    return {
      erreur:
        "Tokens de vérification manquants — rechargez la page pour les générer.",
    };
  }

  const resultat = await verifierProprieteDomaine({
    domaine: site.domainePrincipal,
    tokenFichier: site.tokenVerificationFichier,
    tokenDns: site.tokenVerificationDns,
  });

  if (resultat.verifie && resultat.methode) {
    const maintenant = new Date();
    await db
      .update(sites)
      .set({
        proprieteVerifieeLe: maintenant,
        proprieteMethode: resultat.methode,
        majLe: maintenant,
      })
      .where(eq(sites.id, site.id));
    return {
      erreur: null,
      succes: {
        methode: resultat.methode,
        verifieLe: maintenant.toISOString(),
      },
    };
  }

  return {
    erreur:
      "Vérification impossible — ni le fichier ni l'enregistrement DNS n'ont été trouvés.",
    erreurs: resultat.erreurs,
  };
}
