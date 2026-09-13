"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function createCheckoutSessionAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID manquant dans les variables d'environnement.");
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: user.id,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    customer: user.stripeCustomerId ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/parametres?abonnement=succes`,
    cancel_url: `${appUrl}/parametres?abonnement=annule`,
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
  }

  redirect(session.url);
}

export async function createPortalSessionAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  if (!user.stripeCustomerId) {
    redirect("/parametres");
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/parametres`,
  });

  redirect(session.url);
}

export async function syncSubscriptionStatus(userId: string): Promise<void> {
  // Utilisé par le webhook Stripe pour resynchroniser un abonnement au besoin.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeSubscriptionId) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(
    user.stripeSubscriptionId
  );

  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionStatus: subscription.status },
  });
}
