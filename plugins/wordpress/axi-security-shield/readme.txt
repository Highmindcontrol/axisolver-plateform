=== AXI Security Shield ===
Contributors: ataraxisholding
Tags: security, headers, hsts, csp, hardening, axisolver
Requires at least: 5.6
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.0.0
License: Proprietary

Permet à AXI (AxiSolver / AxiHub) d'appliquer automatiquement les corrections de sécurité détectées lors des audits.

== Description ==

AXI Security Shield est le compagnon WordPress d'AxiSolver et d'AxiHub. Une fois installé et activé, il expose des endpoints REST sécurisés que l'IA AXI utilise pour appliquer concrètement les corrections de sécurité identifiées lors des audits (en-têtes HTTP, CSP, cookies, robots.txt, security.txt, redirection HTTPS, etc.).

**Important** : ce plugin ne fait rien par lui-même tant qu'AXI n'a pas appliqué de remédiation. Toutes les protections activées sont pilotées depuis le dashboard AxiSolver.

== Installation ==

1. Télécharge le zip depuis ton dashboard AxiSolver
2. Dans WordPress : Extensions → Ajouter → Téléverser une extension → Choisir le fichier zip
3. Active le plugin
4. Dans ton dashboard AxiSolver, vérifie que la détection du plugin est OK

== Changelog ==

= 1.0.0 =
* Version initiale.
* Endpoints REST /wp-json/axi-shield/v1/{status,config,apply/{code},revoke/{code}}.
* Remédiations : HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP, masquage version CMS, noopener target_blank, robots.txt virtuel, security.txt virtuel, force HTTPS, masquage X-Powered-By.
