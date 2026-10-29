-- LOT NOTATION — Intégration Gaugista fin de conversation.
--
-- Chaque site AxiSolver peut activer la notation Gaugista en fin de
-- conversation visiteur. On stocke le slug de l'entreprise Gaugista
-- correspondante (côté gaugista.com) + un flag d'activation.
--
-- La clé API Gaugista NE VIT PAS en base : elle est posée en variable
-- d'environnement serveur (GAUGISTA_API_KEY) et consommée uniquement
-- par le proxy /api/widget/[slug]/notation. Jamais exposée au widget.
--
-- IDEMPOTENT.

alter table "site_configs"
  add column if not exists "gaugista_slug"  text,
  add column if not exists "gaugista_actif" boolean not null default false;

comment on column "site_configs"."gaugista_slug" is
  'Slug de l''entreprise correspondante sur gaugista.com (ex: axisolver-demo). Null si pas de notation.';
comment on column "site_configs"."gaugista_actif" is
  'Si vrai, affiche le bouton "Terminer" en fin de conversation widget + ouvre le modal de notation.';
