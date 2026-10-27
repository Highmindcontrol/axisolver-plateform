import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Client Drizzle pour les queries serveur AxiSolver.
 *
 * Initialisation **paresseuse** (lazy) : le client postgres n'est
 * créé qu'à la première utilisation réelle. Permet au build Next
 * d'analyser les routes qui importent `db` sans crasher si
 * DATABASE_URL n'est pas encore disponible (ex. build Vercel avant
 * que l'env var ne soit configurée).
 *
 * À l'usage runtime effectif, l'absence de DATABASE_URL lève une
 * erreur claire.
 */

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;
let _client: ReturnType<typeof postgres> | null = null;

function initDb(): Db {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL manquant — Drizzle ne peut pas se connecter",
    );
  }
  _client = postgres(connectionString, {
    prepare: false,
    max: 10,
  });
  _db = drizzle(_client, { schema });
  return _db;
}

/**
 * Proxy qui différe l'init au premier accès. Permet d'importer `db`
 * depuis des modules analysés au build time sans crash.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = initDb();
    const value = instance[prop as keyof Db];
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as Db;

export { schema };
