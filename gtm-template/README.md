# AxiSolver — Template Google Tag Manager

Template officiel pour installer AxiSolver via Google Tag Manager en
3 clics.

## Pourquoi un template GTM

Beaucoup de sites utilisent déjà GTM pour poser leurs tags (Google
Analytics, Meta Pixel, Hotjar…). Pour ces sites, pas besoin de modifier
le code source — le propriétaire va dans son GTM, cherche AxiSolver,
clique « Add », colle son `site_id`, publie.

**Durée d'installation côté client : 30 secondes.** Taux de couverture
estimé du marché : ~30 % des sites.

## Structure

```
gtm-template/
├── README.md       — ce document (interne)
└── template.tpl    — template GTM à publier sur la Gallery
```

## Format `.tpl`

Le format `.tpl` est une pseudo-syntaxe propriétaire Google composée de
sections délimitées par `___NOM_SECTION___`. Les sections utilisées :

- `___INFO___` : métadonnées du template (nom, catégorie, icône base64, description)
- `___TEMPLATE_PARAMETERS___` : champs saisis par l'utilisateur dans l'UI GTM
- `___SANDBOXED_JS_FOR_WEB_TEMPLATE___` : code JS exécuté dans la sandbox GTM
- `___WEB_PERMISSIONS___` : permissions demandées (ici : injecter un script depuis axisolver.app)
- `___TESTS___` : scénarios de test (vide pour V1)
- `___NOTES___` : notes libres (non affichées côté GTM)

## Compatibilité loader

Le template passe le `siteId` en query string (`?siteId=xxx`) parce que
l'API `injectScript` du sandbox GTM ne permet pas d'ajouter des
attributs `data-*` sur la balise injectée.

**Nécessaire côté loader** : adapter `public/v1.js` sur axisolver-platform
pour lire `siteId` depuis la query string de son propre src en priorité,
puis fallback sur `data-site-id`. À faire avant soumission.

## Publication sur la Gallery

1. **Fork ou créer un repo public** sur GitHub nommé `axisolver-gtm-template`
   (ou l'inclure directement dans axisolver-platform avec le README qui pointe)
2. **Soumettre** sur https://gallery.tagmanager.google.com/#/gallery → bouton
   « Submit a template »
3. **Fournir** : URL repo GitHub, URL de l'icône (optionnel, embed base64 OK),
   adresse mail de contact (ataraxis)
4. **Review** Google : ~1-2 semaines
5. **Après validation** : apparaît dans la Gallery sous « Chat » ou
   « Analytics ». Installable par recherche « AxiSolver ».

## Checklist pré-soumission

- [x] `___INFO___` complet avec icône
- [x] Validation du siteId (regex, non vide)
- [x] Permission `inject_script` limitée à l'URL exacte du loader
- [x] Help text qui pointe vers le dashboard AxiSolver
- [ ] Modif loader `public/v1.js` pour lire siteId depuis query string (TODO)
- [ ] Tests manuels sur un conteneur GTM test
- [ ] Screenshot de l'UI (facultatif mais apprécié par les reviewers)
