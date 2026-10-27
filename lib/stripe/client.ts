import Stripe from "stripe";

let instance: Stripe | null = null;

/**
 * Client Stripe singleton — init paresseuse pour éviter l'erreur à
 * l'import si la variable d'env manque au build. L'appel ne se fait
 * que depuis les routes serveur qui ont besoin de Stripe (checkout,
 * webhook, portail).
 */
export function stripe(): Stripe {
  if (instance) return instance;
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) {
    throw new Error(
      "STRIPE_SECRET_KEY manquante. Posez-la dans Vercel → Settings → Environment Variables.",
    );
  }
  instance = new Stripe(cle, {
    apiVersion: "2026-09-30.endive",
    typescript: true,
    appInfo: {
      name: "AxiSolver",
      version: "1.0.0",
      url: "https://axisolver.app",
    },
  });
  return instance;
}
