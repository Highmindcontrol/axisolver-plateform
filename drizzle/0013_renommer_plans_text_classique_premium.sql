-- Renomme les slugs du type ENUM plan_abonnement pour aligner avec
-- la nouvelle grille marketing par type de voix :
--   starter  → text
--   pro      → classique
--   business → premium
--
-- Prérequis : aucun abonnement actif en production (Stripe non activé
-- en attente du numéro fiscal de la société). Pas de risque de perte
-- de données.
--
-- Procédure : ALTER TYPE … RENAME VALUE (PostgreSQL 10+).

ALTER TYPE "plan_abonnement" RENAME VALUE 'starter' TO 'text';
ALTER TYPE "plan_abonnement" RENAME VALUE 'pro' TO 'classique';
ALTER TYPE "plan_abonnement" RENAME VALUE 'business' TO 'premium';
