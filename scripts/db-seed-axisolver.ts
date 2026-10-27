/**
 * Seed du site « axisolver.app » dans la DB.
 *
 * Insère axisolver comme premier site de la table `sites` (sans owner
 * user — site système Ataraxis), avec sa config vitrine et les
 * options d'accueil hardcodées actuelles. Idempotent (ON CONFLICT DO
 * UPDATE / INSERT ... WHERE NOT EXISTS).
 *
 * Usage :
 *   npx tsx scripts/db-seed-axisolver.ts
 *
 * Permet la bascule progressive : /api/chat?slug=axisolver fait tout
 * tourner via la DB au lieu des constantes hardcodées, mais la route
 * continue d'être rétro-compatible (si pas de ?slug, prompt legacy).
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

const OPTIONS_ACCUEIL_AXISOLVER = [
  {
    ordre: 0,
    libelle:
      "J'ai entendu parler d'AxiSolver et je voulais en savoir plus.",
  },
  {
    ordre: 1,
    libelle:
      "Je cherche une solution pour augmenter mon trafic et mes ventes sur Internet.",
  },
  {
    ordre: 2,
    libelle: "Je voudrais sécuriser mon site.",
  },
  {
    ordre: 3,
    libelle:
      "Je souhaite utiliser AdSense et AdWords pour faire de la pub, mais j'ai besoin d'aide.",
  },
];

async function main() {
  const sql = postgres(DATABASE_URL!, { prepare: false, max: 1 });

  try {
    console.log("→ Seed site axisolver.app…");

    // Insert ou update du site. ownerUserId = NULL (site système).
    const [site] = await sql`
      INSERT INTO sites (
        slug, owner_user_id, nom_entreprise, domaine_principal,
        domaines_autorises, plan, actif
      ) VALUES (
        'axisolver',
        NULL,
        'AxiSolver — vitrine Ataraxis',
        'axisolver.app',
        ARRAY['axisolver.app', 'www.axisolver.app', 'localhost']::text[],
        'enterprise',
        true
      )
      ON CONFLICT (slug) DO UPDATE SET
        nom_entreprise = EXCLUDED.nom_entreprise,
        domaine_principal = EXCLUDED.domaine_principal,
        domaines_autorises = EXCLUDED.domaines_autorises,
        maj_le = now()
      RETURNING id
    `;
    console.log(`  ✓ site inséré/mis à jour (id=${site.id})`);

    // Insert ou update de la config vitrine
    await sql`
      INSERT INTO site_configs (
        site_id, nom_assistant, secteur, ton, mode_prompt,
        langues_actives, langue_defaut, voix_mode
      ) VALUES (
        ${site.id},
        'AXI',
        'tech_ia',
        'professionnel_chaleureux',
        'vitrine_axisolver',
        ARRAY['fr', 'en']::text[],
        'fr',
        'premium_elevenlabs'
      )
      ON CONFLICT (site_id) DO UPDATE SET
        nom_assistant = EXCLUDED.nom_assistant,
        secteur = EXCLUDED.secteur,
        mode_prompt = EXCLUDED.mode_prompt,
        langues_actives = EXCLUDED.langues_actives,
        maj_le = now()
    `;
    console.log("  ✓ site_config vitrine posée");

    // Reset des options d'accueil + réinsertion (pour que l'ordre reste propre)
    await sql`DELETE FROM site_options_accueil WHERE site_id = ${site.id}`;
    for (const opt of OPTIONS_ACCUEIL_AXISOLVER) {
      await sql`
        INSERT INTO site_options_accueil (site_id, ordre, libelle, actif)
        VALUES (${site.id}, ${opt.ordre}, ${opt.libelle}, true)
      `;
    }
    console.log(
      `  ✓ ${OPTIONS_ACCUEIL_AXISOLVER.length} options d'accueil posées`,
    );

    console.log("\n✓ Seed terminé.");
    console.log(`\nTeste avec : GET /api/chat?slug=axisolver`);
  } catch (e) {
    console.error("\n✗ Erreur :", e);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
