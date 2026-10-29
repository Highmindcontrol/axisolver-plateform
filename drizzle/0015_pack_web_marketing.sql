-- Ajout des 2 formules Pack Web Marketing (doctrine 28 oct 2026) :
--   pack-web-s  (149 €, 300 conv)
--   pack-web-l  (199 €, 500 conv)
--
-- Bundle AxiLanding (5 landing pages créées par AXI, templates
-- éprouvés) + AxiSolver Premium déployé sur les 5 pages. Pour les
-- prospects sans site existant.
--
-- IDEMPOTENT : ADD VALUE est protégé par un check sur pg_enum.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'pack-web-s'
  ) THEN
    ALTER TYPE "plan_abonnement" ADD VALUE 'pack-web-s';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_abonnement' AND e.enumlabel = 'pack-web-l'
  ) THEN
    ALTER TYPE "plan_abonnement" ADD VALUE 'pack-web-l';
  END IF;
END $$;
