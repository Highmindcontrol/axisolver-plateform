/**
 * Script de vérification DB — liste les tables créées et vérifie
 * que le trigger + l'extension pgvector sont en place.
 */

import { readFileSync } from "node:fs";
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

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL manquant");
  process.exit(1);
}

async function main() {
  const sql = postgres(DATABASE_URL!, { prepare: false, max: 1 });

  try {
    const tables = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log("\nTables publiques :");
    for (const row of tables) console.log(`  · ${row.tablename}`);

    const extensions = await sql`
      SELECT extname FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp', 'pgcrypto')
    `;
    console.log("\nExtensions :");
    for (const row of extensions) console.log(`  · ${row.extname}`);

    const triggers = await sql`
      SELECT tgname, relname FROM pg_trigger
      JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
      WHERE tgname = 'on_auth_user_created'
    `;
    console.log("\nTriggers :");
    for (const row of triggers) console.log(`  · ${row.tgname} sur ${row.relname}`);

    const policies = await sql`
      SELECT tablename, policyname FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;
    console.log("\nRLS policies :");
    for (const row of policies) console.log(`  · ${row.tablename} → ${row.policyname}`);
  } finally {
    await sql.end();
  }
}

main();
