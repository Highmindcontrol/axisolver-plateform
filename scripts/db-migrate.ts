/**
 * Script de migration DB — applique les fichiers SQL de drizzle/
 * dans l'ordre, en utilisant postgres-js (DATABASE_URL).
 *
 * Usage :
 *   npx tsx scripts/db-migrate.ts
 *
 * Idempotent — chaque fichier applique du SQL qui tolère la
 * ré-exécution (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE`,
 * etc.). On applique les 2 fichiers de drizzle/ :
 *   · 0000_init_multi_tenant.sql   — tables, enums, FK
 *   · 0001_post_init_supabase.sql  — pgvector, trigger auth, RLS
 */

import { readFile, readFileSync } from "node:fs";
import { readFile as readFileAsync } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

// Charge manuellement .env.local (évite une dépendance à dotenv CLI)
function chargerEnvLocal() {
  try {
    const envContent = readFileSync(resolve(".env.local"), "utf8");
    for (const ligne of envContent.split("\n")) {
      const trim = ligne.trim();
      if (!trim || trim.startsWith("#")) continue;
      const idx = trim.indexOf("=");
      if (idx === -1) continue;
      const cle = trim.slice(0, idx).trim();
      let val = trim.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!process.env[cle]) process.env[cle] = val;
    }
  } catch {
    // Pas de .env.local — on continue avec l'environnement courant
  }
}
chargerEnvLocal();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL manquant dans l'environnement");
  process.exit(1);
}

const FICHIERS = [
  "drizzle/0000_init_multi_tenant.sql",
  "drizzle/0001_post_init_supabase.sql",
];

async function main() {
  const sql = postgres(DATABASE_URL!, { prepare: false, max: 1 });

  try {
    for (const fichier of FICHIERS) {
      console.log(`\n→ Application de ${fichier}…`);
      const contenu = await readFileAsync(resolve(fichier), "utf8");

      // Les migrations Drizzle utilisent `--> statement-breakpoint`
      // pour séparer les statements. On nettoie ces marqueurs et on
      // laisse postgres-js parser le reste.
      const sqlClean = contenu.replace(/--> statement-breakpoint/g, "");

      await sql.unsafe(sqlClean);
      console.log(`  ✓ ${fichier} appliqué`);
    }
    console.log("\n✓ Toutes les migrations ont été appliquées.");
  } catch (e) {
    console.error("\n✗ Erreur à l'application :", e);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
