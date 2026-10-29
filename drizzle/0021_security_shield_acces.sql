-- AXI Security Shield — Accès au site pour exécution des remédiations.
--
-- Table des accès par site (SSH, WordPress REST API, FTP, Cloudflare…).
-- Les secrets (clés privées, mots de passe, tokens) sont stockés chiffrés
-- en AES-256-GCM dans la colonne credentiels_chiffres (bytea). L'IV et le
-- tag d'authentification sont stockés dans le JSONB meta pour pouvoir
-- déchiffrer.
--
-- IDEMPOTENT.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'security_shield_acces_type'
  ) THEN
    CREATE TYPE security_shield_acces_type AS ENUM (
      'ssh',
      'ftp',
      'sftp',
      'wordpress_rest',
      'cloudflare_api',
      'cpanel_api',
      'plesk_api'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "site_acces_securite" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "type" security_shield_acces_type NOT NULL,
  "libelle" text NOT NULL,
  "parametres_publics" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "credentiels_chiffres" bytea NOT NULL,
  "credentiels_meta" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "actif" boolean NOT NULL DEFAULT true,
  "derniere_connexion_le" timestamptz,
  "derniere_connexion_ok" boolean,
  "derniere_connexion_erreur" text,
  "cree_le" timestamptz NOT NULL DEFAULT now(),
  "maj_le" timestamptz NOT NULL DEFAULT now(),
  "cree_par_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_site_acces_securite_site"
  ON "site_acces_securite" ("site_id");
CREATE INDEX IF NOT EXISTS "idx_site_acces_securite_type"
  ON "site_acces_securite" ("type");

ALTER TABLE "site_acces_securite" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_acces_securite_tout" ON "site_acces_securite";
CREATE POLICY "site_acces_securite_tout"
  ON "site_acces_securite"
  FOR ALL
  USING (user_a_acces_site("site_id"))
  WITH CHECK (user_a_acces_site("site_id"));
