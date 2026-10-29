-- Destinataires supplémentaires du rapport quotidien AxiSolver.
--
-- Par défaut, le rapport va à l'email de l'administrateur du site.
-- L'admin peut ajouter des récipiendaires additionnels (ex. équipe
-- marketing, direction, agence partenaire) qui recevront le rapport
-- quotidien avec une mention explicite « ajouté par X ».
--
-- IDEMPOTENT.

CREATE TABLE IF NOT EXISTS "site_rapport_destinataires" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "prenom" text,
  "ajoute_par_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("site_id", "email")
);

CREATE INDEX IF NOT EXISTS "idx_site_rapport_destinataires_site"
  ON "site_rapport_destinataires" ("site_id");

ALTER TABLE "site_rapport_destinataires" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_rapport_destinataires_tout"
  ON "site_rapport_destinataires";
CREATE POLICY "site_rapport_destinataires_tout"
  ON "site_rapport_destinataires"
  FOR ALL
  USING (user_a_acces_site("site_id"))
  WITH CHECK (user_a_acces_site("site_id"));
