/**
 * Supprime proprement un utilisateur AxiSolver par email :
 *   · auth.users via Supabase Admin API (nécessite SUPABASE_SERVICE_ROLE_KEY)
 *   · public.users via Drizzle (nettoyage shadow row orpheline)
 *   · cascade automatique sur sites/site_membres via FK (ON DELETE SET NULL / CASCADE)
 *
 * Usage :
 *   npx tsx scripts/db-supprimer-user.ts <email>
 *
 * Idempotent — si l'utilisateur n'existe pas, pas d'erreur.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

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

const email = process.argv[2];
if (!email) {
  console.error("Usage : npx tsx scripts/db-supprimer-user.ts <email>");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_ROLE || !DATABASE_URL) {
  console.error(
    "Vars manquantes : NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL",
  );
  process.exit(1);
}

async function main() {
  console.log(`\n→ Suppression user ${email}…`);

  // 1. auth.users via Supabase Admin API
  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Chercher l'utilisateur par email (pagination côté API)
  let userId: string | null = null;
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) {
      console.error("Erreur listUsers :", error.message);
      break;
    }
    const trouve = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (trouve) {
      userId = trouve.id;
      break;
    }
    if (data.users.length < 100) break;
    page += 1;
  }

  if (userId) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Erreur deleteUser auth :", error.message);
    } else {
      console.log(`  ✓ auth.users supprimé (id=${userId})`);
    }
  } else {
    console.log("  · aucun user dans auth.users pour cet email");
  }

  // 2. public.users nettoyage (au cas où shadow row orpheline)
  const sql = postgres(DATABASE_URL!, { prepare: false, max: 1 });
  try {
    const result = await sql`
      DELETE FROM public.users WHERE email = ${email} RETURNING id
    `;
    if (result.length > 0) {
      console.log(`  ✓ public.users nettoyé (${result.length} ligne·s)`);
    } else {
      console.log("  · aucune ligne public.users à nettoyer");
    }
  } finally {
    await sql.end();
  }

  console.log("\n✓ Suppression terminée.");
}

main().catch((e) => {
  console.error("\n✗ Erreur :", e);
  process.exit(1);
});
