# AxiSolver — Plugin WordPress

Plugin officiel pour installer AxiSolver sur un site WordPress en un
seul champ texte.

## Structure

```
wordpress-plugin/
├── README.md                — ce document (interne, pas publié)
└── axisolver/               — dossier à zipper et publier sur wordpress.org
    ├── axisolver.php        — fichier principal du plugin
    └── readme.txt           — doc wordpress.org (description, FAQ, changelog)
```

## Dev

Le plugin tient en un seul fichier PHP volontairement — il n'y a qu'un
champ `site_id` à sauvegarder et un hook `wp_footer` à écrire. Pas de
sur-ingénierie.

## Publication sur wordpress.org

1. **Compte Developer WordPress.org** : créer un compte sur
   https://login.wordpress.org si pas déjà fait, slug choisi « ataraxis »
2. **Soumettre le plugin** sur https://wordpress.org/plugins/developers/add/
   - Nom : AxiSolver
   - Slug : axisolver
   - Zip : `axisolver.zip` (créé depuis le dossier `axisolver/`)
3. **Review** : équipe wordpress.org vérifie en 2-4 semaines (sécurité,
   licences, licensing GPL, pas de tracking caché, etc.)
4. **Après validation** : accès au SVN wordpress.org pour pousser les
   mises à jour (`trunk/`, `tags/1.0.0/`)
5. **Assets du listing** (à préparer, pas inclus pour l'instant) :
   - `assets/icon-128x128.png` — icône plugin
   - `assets/icon-256x256.png` — icône plugin (retina)
   - `assets/banner-772x250.png` — bannière standard
   - `assets/banner-1544x500.png` — bannière retina
   - `assets/screenshot-1.png` à `-5.png` — captures d'écran

## Checklist pré-soumission

- [x] Header plugin complet (Name, URI, Description, Version, Author…)
- [x] Readme.txt au format wordpress.org (Contributors, Tags, Stable tag…)
- [x] License GPL-2.0+
- [x] Sanitize des entrées utilisateur
- [x] Escape des sorties (`esc_attr`, `esc_url`, `esc_html`, `wp_kses`…)
- [x] Pas de `eval()`, pas d'inclusion de fichier distant au runtime
- [x] i18n via `__()` et `esc_html__()` avec `Text Domain: axisolver`
- [ ] Dossier `languages/` avec fichiers `.pot` et `.po/.mo` (à ajouter V1.1)
- [ ] Assets images (icon, banner, screenshots) — à ajouter avant publication
- [ ] Tests manuels sur WordPress 5.8, 6.0, 6.6
- [ ] Tests PHP 7.4, 8.0, 8.2

## Zippage

```bash
cd wordpress-plugin
zip -r axisolver.zip axisolver/ -x "*.DS_Store"
```

Le `.zip` obtenu est prêt à être uploadé sur wordpress.org.
