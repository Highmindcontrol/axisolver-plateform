import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { stripe } from "./client";
import { FORMULES, priceIdDePlan, type SlugPlan } from "./formules";

/**
 * Crée une session Stripe Checkout en mode subscription + essai gratuit.
 *
 * Si l'utilisateur n'a pas encore de `stripe_customer_id`, on le crée
 * à la volée et on le persiste dans la table `users`. Idempotent via
 * `client_reference_id = userId` qui permet au webhook de retrouver
 * l'utilisateur.
 */
export async function creerSessionCheckout(params: {
  slug: SlugPlan;
  user: { id: string; email: string | null };
}): Promise<{ url: string } | { erreur: string }> {
  const formule = FORMULES[params.slug];
  if (!formule) return { erreur: "Plan inconnu." };

  const priceId = priceIdDePlan(params.slug);
  if (!priceId) {
    return {
      erreur: `Plan ${params.slug} non configuré côté Stripe. Variable ${formule.priceIdVar} manquante.`,
    };
  }

  const email = params.user.email;
  if (!email) return { erreur: "Email utilisateur manquant." };

  // ─── Récupération ou création du customer ───────────────────────
  const [row] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, params.user.id))
    .limit(1);

  let customerId = row?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email,
      metadata: { user_id: params.user.id },
    });
    customerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, params.user.id));
  }

  // ─── Session Checkout ───────────────────────────────────────────
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://axisolver.app";

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: params.user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: formule.essaiJours > 0 ? formule.essaiJours : undefined,
      metadata: {
        user_id: params.user.id,
        plan: params.slug,
      },
    },
    success_url: `${baseUrl}/dashboard/abonnement?checkout=success`,
    cancel_url: `${baseUrl}/tarifs?checkout=cancel`,
    allow_promotion_codes: true,
    billing_address_collection: "required",
    automatic_tax: { enabled: true },
  });

  if (!session.url) {
    return { erreur: "Stripe n'a pas renvoyé d'URL de checkout." };
  }
  return { url: session.url };
}
