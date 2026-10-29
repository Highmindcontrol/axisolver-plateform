-- AXI Security Shield — Ajout des types d'accès Shopify, Wix, Webflow.
--
-- Compléments de l'enum security_shield_acces_type pour les packs
-- Shield par plateforme. SSH était déjà présent dans la migration 0021.
--
-- IDEMPOTENT.

ALTER TYPE security_shield_acces_type ADD VALUE IF NOT EXISTS 'shopify_admin';
ALTER TYPE security_shield_acces_type ADD VALUE IF NOT EXISTS 'wix_api';
ALTER TYPE security_shield_acces_type ADD VALUE IF NOT EXISTS 'webflow_api';
