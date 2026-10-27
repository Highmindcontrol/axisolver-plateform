import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { stripe } from "./client";

/**
 * Ouvre le portail de facturation Stripe pour l'utilisateur courant.
 * Le portail permet à l'utilisateur de changer de carte, consulter ses
 * factures, mettre à jour son plan, résilier.
 *
 * Pré-requis : l'utilisateur doit avoir déjà un `stripe_customer_id`
 * (créé lors du premier checkout).
 */
export async function creerSessionPortail(params: {
  userId: string;
}): Promise<{ url: string } | { erreur: string }> {
  const [row] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);

  if (!row?.stripeCustomerId) {
    return { erreur: "Aucun abonnement actif. Souscrivez d'abord un plan." };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://axisolver.app";

  const session = await stripe().billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${baseUrl}/dashboard/abonnement`,
  });

  return { url: session.url };
}
