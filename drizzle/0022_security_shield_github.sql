-- AXI Security Shield — Ajout du type d'accès GitHub pour sites Next.js / statiques.
--
-- Pour les sites Next.js / Astro / Hugo / SvelteKit hébergés sur Vercel,
-- Netlify ou Cloudflare Pages, les corrections de sécurité (headers HTTP,
-- redirections, robots.txt) passent par un commit sur le repo GitHub du
-- site. AXI utilise un Personal Access Token fine-grained pour :
--   - Lire vercel.json (ou next.config.ts)
--   - Modifier/créer vercel.json à la racine
--   - Pousser un commit qui déclenche le redéploiement automatique Vercel
--
-- IDEMPOTENT.

ALTER TYPE security_shield_acces_type ADD VALUE IF NOT EXISTS 'github_repo';
