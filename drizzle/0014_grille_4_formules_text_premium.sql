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
-- Prérequis : aucun abonnement actif en production, Stripe non
-- encore activé. Pas de risque de perte de données.

ALTER TYPE "plan_abonnement" RENAME VALUE 'text' TO 'text-s';
ALTER TYPE "plan_abonnement" RENAME VALUE 'classique' TO 'text-l';
ALTER TYPE "plan_abonnement" RENAME VALUE 'premium' TO 'premium-s';
ALTER TYPE "plan_abonnement" ADD VALUE 'premium-l';
