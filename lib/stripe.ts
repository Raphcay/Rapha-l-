import "server-only";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY manquant dans les variables d'environnement."
      );
    }
    stripeInstance = new Stripe(secretKey);
  }
  return stripeInstance;
}
