-- Ajout des 2 formules Pack Web Marketing (doctrine 28 oct 2026) :
--   pack-web-s  (149 €, 300 conv)
--   pack-web-l  (199 €, 500 conv)
--
-- Bundle AxiLanding (5 landing pages créées par AXI, templates
-- éprouvés) + AxiSolver Premium déployé sur les 5 pages. Pour les
-- prospects sans site existant.
--
-- Prérequis : aucun abonnement actif en production, Stripe non
-- encore activé. Pas de risque de perte de données.

ALTER TYPE "plan_abonnement" ADD VALUE 'pack-web-s';
ALTER TYPE "plan_abonnement" ADD VALUE 'pack-web-l';
