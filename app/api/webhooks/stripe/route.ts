import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stripeSubscriptions, users } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";
import { planDePriceId } from "@/lib/stripe/formules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Stripe — reçoit tous les événements de facturation et met à
 * jour la table `stripe_subscriptions` en conséquence.
 *
 * Événements gérés :
 *   - checkout.session.completed : premier abonnement créé
 *   - customer.subscription.created/updated : état subscription
 *   - customer.subscription.deleted : résiliation
 *   - invoice.payment_succeeded/failed : logs
 *
 * Signature vérifiée via STRIPE_WEBHOOK_SECRET. Les écritures DB sont
 * idempotentes (ON CONFLICT UPDATE via stripe_subscription_id unique).
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET manquant");
    return new NextResponse("Webhook secret non configuré", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Signature manquante", { status: 400 });
  }

  const corpsBrut = await request.text();

  let evenement: Stripe.Event;
  try {
    evenement = stripe().webhooks.constructEvent(corpsBrut, signature, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[stripe/webhook] Signature invalide : ${msg}`);
    return new NextResponse(`Signature invalide : ${msg}`, { status: 400 });
  }

  try {
    switch (evenement.type) {
      case "checkout.session.completed":
        await gererCheckoutComplete(evenement.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await gererSubscriptionMaj(evenement.data.object);
        break;

      case "customer.subscription.deleted":
        await gererSubscriptionSupprimee(evenement.data.object);
        break;

      case "invoice.payment_succeeded":
        console.log(
          `[stripe/webhook] Paiement OK pour ${evenement.data.object.id}`,
        );
        break;

      case "invoice.payment_failed":
        console.warn(
          `[stripe/webhook] Paiement échoué pour ${evenement.data.object.id}`,
        );
        break;

      default:
        console.log(`[stripe/webhook] Événement ignoré : ${evenement.type}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[stripe/webhook] Erreur traitement ${evenement.type} : ${msg}`);
    return NextResponse.json({ erreur: msg }, { status: 500 });
  }

  return NextResponse.json({ recu: true });
}

async function gererCheckoutComplete(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.client_reference_id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!userId || !subscriptionId || !customerId) {
    console.warn(
      `[stripe/webhook] checkout.session.completed sans userId/subId/custId : ${session.id}`,
    );
    return;
  }

  // Assure que le customer est bien lié à l'utilisateur.
  await db
    .update(users)
    .set({ stripeCustomerId: customerId })
    .where(eq(users.id, userId));

  const subscription = await stripe().subscriptions.retrieve(subscriptionId);
  await upsertAbonnement(userId, subscription);
}

async function gererSubscriptionMaj(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userIdMeta = subscription.metadata?.user_id;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  let userId = userIdMeta ?? null;
  if (!userId) {
    // Fallback : récupérer userId via stripe_customer_id.
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);
    userId = row?.id ?? null;
  }

  if (!userId) {
    console.warn(
      `[stripe/webhook] subscription ${subscription.id} sans user_id résolvable`,
    );
    return;
  }

  await upsertAbonnement(userId, subscription);
}

async function gererSubscriptionSupprimee(
  subscription: Stripe.Subscription,
): Promise<void> {
  await db
    .update(stripeSubscriptions)
    .set({
      statut: "canceled",
      majLe: new Date(),
    })
    .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));
}

async function upsertAbonnement(
  userId: string,
  subscription: Stripe.Subscription,
): Promise<void> {
  const item = subscription.items.data[0];
  if (!item) return;
  const priceId = item.price.id;
  const plan = planDePriceId(priceId);

  if (!plan) {
    console.warn(
      `[stripe/webhook] Price ${priceId} non mappé à un plan AxiSolver — subscription ignorée`,
    );
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // `current_period_end` existe sur les SubscriptionItem individuels
  // depuis l'API 2025 — on prend celui du premier item.
  const periodeFinLe = item.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;

  const essaiFinLe = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  // Upsert via stripe_subscription_id unique.
  const existant = await db
    .select({ id: stripeSubscriptions.id })
    .from(stripeSubscriptions)
    .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  const statutInterne = mapperStatutStripe(subscription.status);

  if (existant.length > 0) {
    await db
      .update(stripeSubscriptions)
      .set({
        statut: statutInterne,
        stripePriceId: priceId,
        plan,
        periodeFinLe,
        annuleFinDePeriode: subscription.cancel_at_period_end,
        essaiFinLe,
        majLe: new Date(),
      })
      .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));
  } else {
    await db.insert(stripeSubscriptions).values({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan,
      statut: statutInterne,
      periodeFinLe,
      annuleFinDePeriode: subscription.cancel_at_period_end,
      essaiFinLe,
    });
  }
}

type StatutInterne =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired";

/**
 * Stripe peut renvoyer `paused` ou des statuts élargis dans certaines
 * API versions (type OtherString). On mappe sur notre enum interne,
 * avec fallback sur `incomplete` pour les cas non prévus.
 */
function mapperStatutStripe(statut: Stripe.Subscription.Status): StatutInterne {
  const connus: StatutInterne[] = [
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
  ];
  if ((connus as string[]).includes(statut)) return statut as StatutInterne;
  if (statut === "paused") return "past_due";
  return "incomplete";
}
