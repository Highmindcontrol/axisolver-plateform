-- Renomme les slugs du type ENUM plan_abonnement pour aligner avec
-- la nouvelle grille marketing par type de voix :
--   starter  → text
--   pro      → classique
--   business → premium
--
-- IDEMPOTENT : chaque ALTER vérifie que la valeur existe avant de
-- renommer. Peut être relancé plusieurs fois sans erreur.
--
-- Prérequis : aucun abonnement actif en production (Stripe non activé
-- en attente du numéro fiscal de la société). Pas de risque de perte
-- de données.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'starter'
  ) THEN
    ALTER TYPE "plan_abonnement" RENAME VALUE 'starter' TO 'text';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'pro'
  ) THEN
    ALTER TYPE "plan_abonnement" RENAME VALUE 'pro' TO 'classique';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'business'
  ) THEN
    ALTER TYPE "plan_abonnement" RENAME VALUE 'business' TO 'premium';
  END IF;
END $$;
