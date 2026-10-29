-- Sépare le nom du site (affichage) de la raison sociale cliente
-- (facturation). Avant : un seul champ nom_entreprise mélangeait les
-- deux usages, provoquant une confusion à la création.
--
-- Après : nom_site = identifiant visuel du site (ex. « Coryphea »,
-- « Neuroactif »), affiché partout dans le dashboard. nom_entreprise
-- reste pour la raison sociale (déjà disponible dans
-- user_metadata.societe.raisonSociale côté Votre compte).
--
-- IDEMPOTENT.

/* ─── Colonne nom_site ──────────────────────────────────────────── */

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sites'
      AND column_name = 'nom_site'
  ) THEN
    ALTER TABLE "sites" ADD COLUMN "nom_site" text;
  END IF;
END $$;

/* ─── Backfill ──────────────────────────────────────────────────── */
--
-- Pour les sites existants sans nom_site, on dérive un nom lisible
-- depuis le slug (ex. « cabinet-dupont » → « Cabinet Dupont »).

UPDATE "sites"
SET "nom_site" = INITCAP(REPLACE(slug, '-', ' '))
WHERE "nom_site" IS NULL;
