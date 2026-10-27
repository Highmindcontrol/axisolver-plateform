import type { Config } from "drizzle-kit";

/**
 * Config drizzle-kit — génère les migrations SQL à partir de
 * lib/db/schema.ts et les applique sur la base pointée par
 * DATABASE_URL.
 *
 * Commandes utiles :
 *   npx drizzle-kit generate   — produit un .sql dans drizzle/
 *   npx drizzle-kit push       — applique directement (dev only)
 *   npx drizzle-kit migrate    — applique les migrations générées
 *   npx drizzle-kit studio     — ouvre un explorateur de schéma
 */

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
