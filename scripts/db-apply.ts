/**
 * Applique UN fichier SQL spécifique sur la DB (DATABASE_URL).
 *
 * Usage :
 *   npx tsx scripts/db-apply.ts drizzle/0002_allow_null_owner_system_sites.sql
 *
 * Utilisé pour les migrations incrémentales (après la pose initiale
 * via scripts/db-migrate.ts). Chaque fichier doit être idempotent
 * autant que possible (DROP IF EXISTS, CREATE OR REPLACE, etc.).
 */

import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

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
  } catch {}
}
chargerEnvLocal();

const fichier = process.argv[2];
if (!fichier) {
  console.error("Usage : npx tsx scripts/db-apply.ts <fichier.sql>");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL manquant");
  process.exit(1);
}

async function main() {
  const sql = postgres(DATABASE_URL!, { prepare: false, max: 1 });
  try {
    console.log(`→ Application de ${fichier}…`);
    const contenu = await readFile(resolve(fichier), "utf8");
    const sqlClean = contenu.replace(/--> statement-breakpoint/g, "");
    await sql.unsafe(sqlClean);
    console.log(`  ✓ ${fichier} appliqué`);
  } catch (e) {
    console.error("\n✗ Erreur :", e);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
