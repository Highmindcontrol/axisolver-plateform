-- LOT SUPER-ADMIN — Coûts fournisseurs mensuels.
--
-- Table de saisie manuelle (V1) des coûts facturés par les fournisseurs
-- de l'écosystème AxiSolver / Ataraxis : IA (OpenAI, Anthropic, …),
-- voix (ElevenLabs), infra (Supabase, Vercel, OVH), paiements (Stripe),
-- email (Brevo), SEO (Ahrefs, DataForSEO), outillage divers.
--
-- Une ligne = (mois AAAA-MM, fournisseur, catégorie, montant HT). Unique
-- sur ces 3 clés pour éviter les doublons quand on resaisit.
--
-- V2 (futur) : auto-remplissage via API fournisseurs quand disponible.
--
-- IDEMPOTENT.

/* ─── Enum catégorie_cout_fournisseur ───────────────────────────── */

DO $$ BEGIN
  CREATE TYPE "categorie_cout_fournisseur" AS ENUM (
    'ia_llm',
    'voix',
    'infra',
    'paiements',
    'email',
    'seo',
    'outillage',
    'autre'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

/* ─── Table couts_fournisseurs_mensuel ──────────────────────────── */

CREATE TABLE IF NOT EXISTS "couts_fournisseurs_mensuel" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "bucket_mois" text NOT NULL,
  "fournisseur" text NOT NULL,
  "categorie" "categorie_cout_fournisseur" NOT NULL,
  "montant_eur_ht" numeric(10, 2) NOT NULL DEFAULT 0,
  "notes" text,
  "saisi_par_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "maj_le" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("bucket_mois", "fournisseur", "categorie")
);

CREATE INDEX IF NOT EXISTS "idx_couts_fournisseurs_mois"
  ON "couts_fournisseurs_mensuel" ("bucket_mois");

CREATE INDEX IF NOT EXISTS "idx_couts_fournisseurs_categorie"
  ON "couts_fournisseurs_mensuel" ("categorie");

/* ─── RLS : seuls les super_admin & admin_plateforme voient ─────── */

ALTER TABLE "couts_fournisseurs_mensuel" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couts_fournisseurs_lecture"
  ON "couts_fournisseurs_mensuel";
CREATE POLICY "couts_fournisseurs_lecture"
  ON "couts_fournisseurs_mensuel"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "profils_plateforme" p
      WHERE p."user_id" = auth.uid()
        AND p."role" IN ('super_admin', 'admin_plateforme')
    )
  );

DROP POLICY IF EXISTS "couts_fournisseurs_ecriture"
  ON "couts_fournisseurs_mensuel";
CREATE POLICY "couts_fournisseurs_ecriture"
  ON "couts_fournisseurs_mensuel"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "profils_plateforme" p
      WHERE p."user_id" = auth.uid()
        AND p."role" = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "profils_plateforme" p
      WHERE p."user_id" = auth.uid()
        AND p."role" = 'super_admin'
    )
  );
