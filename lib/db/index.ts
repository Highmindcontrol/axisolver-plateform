import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Client Drizzle pour les queries serveur AxiSolver.
 *
 * Utilisé par les Server Actions, les routes API, les cron jobs.
 * Pas utilisable côté navigateur (postgres-js nécessite TCP direct).
 *
 * Les composants client qui ont besoin de lire la DB doivent passer
 * par le client Supabase JS (RLS appliquée) via createSupabaseServerClient
 * depuis un Server Component ou une Server Action.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL manquant — Drizzle ne peut pas se connecter");
}

const client = postgres(connectionString, {
  prepare: false,
  max: 10,
});

export const db = drizzle(client, { schema });
export { schema };
