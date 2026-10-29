-- Nouvelle grille tarifaire : 4 formules selon voix × trafic
-- (voir doctrine 28 oct 2026).
--
-- La voix neuronale Azure est abandonnée. On garde ElevenLabs
-- comme seule option vocale, et un palier trafic (Petit <10k /
-- Grand >=10k) pour chaque option.
--
--   text      → text-s   (49 €, 300 conv)
--   classique → text-l   (69 €, 500 conv — reconvertit vers Text L)
--   premium   → premium-s (99 €, 300 conv — PHARE)
--   (nouveau)   premium-l (129 €, 500 conv)
--
-- IDEMPOTENT : chaque ALTER vérifie que la valeur source existe et
-- que la cible n'existe pas encore.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'text'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'text-s'
  ) THEN
    ALTER TYPE "plan_abonnement" RENAME VALUE 'text' TO 'text-s';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'classique'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'text-l'
  ) THEN
    ALTER TYPE "plan_abonnement" RENAME VALUE 'classique' TO 'text-l';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'premium'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'premium-s'
  ) THEN
    ALTER TYPE "plan_abonnement" RENAME VALUE 'premium' TO 'premium-s';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'premium-l'
  ) THEN
    ALTER TYPE "plan_abonnement" ADD VALUE 'premium-l';
  END IF;
END $$;
