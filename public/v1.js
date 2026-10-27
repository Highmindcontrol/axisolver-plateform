/**
 * AxiSolver — loader du widget distribuable V1.
 *
 * Usage côté site hôte :
 *   <script src="https://axisolver.app/v1.js" data-site-id="xxx" async></script>
 *
 * Comportement :
 *   1. Injecte un cercle rayonnant fixé en bas à droite
 *   2. Au clic, ouvre une iframe https://axisolver.app/embed/{slug}
 *      en overlay (modale sur desktop, plein écran sur mobile)
 *   3. L'iframe peut poster { type: "axi:fermer" } pour se fermer
 *      elle-même et { type: "axi:pret" } pour signaler le chargement
 *
 * Zéro dépendance, zéro framework, zéro CSS externe. Toutes les
 * styles sont inline avec préfixe axi- pour éviter tout conflit
 * avec le site hôte.
 */

(function () {
  "use strict";

  // Déjà chargé ? (double inclusion)
  if (window.__axiSolverLoader) return;
  window.__axiSolverLoader = true;

  // Lit le site-id depuis la balise script actuelle ou précédente
  var script = document.currentScript;
  if (!script) {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf("/v1.js") !== -1) {
        script = scripts[i];
        break;
      }
    }
  }
  if (!script) {
    console.error("[AxiSolver] balise script introuvable");
    return;
  }

  // Lit le site-id depuis l'attribut data-site-id en priorité, puis
  // fallback sur la query string du src (?siteId=xxx) pour le template
  // Google Tag Manager qui ne peut pas ajouter d'attributs data-*.
  var siteId = script.getAttribute("data-site-id");
  if (!siteId && script.src) {
    try {
      siteId = new URL(script.src).searchParams.get("siteId");
    } catch (e) {
      /* URL non parsable */
    }
  }
  if (!siteId) {
    console.error(
      "[AxiSolver] attribut data-site-id manquant sur la balise script",
    );
    return;
  }

  // Origine du widget : par défaut même origine que le loader
  var baseUrl = "https://axisolver.app";
  try {
    baseUrl = new URL(script.src).origin;
  } catch (e) {
    /* fallback */
  }

  var EMBED_URL = baseUrl + "/embed/" + encodeURIComponent(siteId);

  // ─── Styles isolés ────────────────────────────────────────────
  var style = document.createElement("style");
  style.textContent =
    ".axi-root{all:initial;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;position:fixed;z-index:2147483647;bottom:24px;right:24px}" +
    ".axi-bouton{position:relative;width:56px;height:56px;cursor:pointer;border:none;padding:0;background:transparent}" +
    ".axi-onde{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(139,92,246,.55);animation:axi-pulse 2.6s cubic-bezier(.2,.6,.3,1) infinite}" +
    ".axi-onde-2{animation-delay:1.3s}" +
    ".axi-noyau{position:absolute;inset:6px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:20px;box-shadow:inset 0 1px 2px rgba(255,255,255,.4),0 6px 14px rgba(79,70,229,.4)}" +
    "@keyframes axi-pulse{0%{transform:scale(.75);opacity:.65}100%{transform:scale(1.6);opacity:0}}" +
    ".axi-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:2147483646;opacity:0;transition:opacity .25s ease;pointer-events:none}" +
    ".axi-overlay.on{opacity:1;pointer-events:auto}" +
    ".axi-panneau{position:fixed;bottom:92px;right:24px;width:380px;height:620px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(15,23,42,.3);z-index:2147483647;overflow:hidden;transform:translateY(20px) scale(.96);opacity:0;transition:transform .3s cubic-bezier(.2,.8,.3,1),opacity .25s ease;pointer-events:none}" +
    ".axi-panneau.on{transform:translateY(0) scale(1);opacity:1;pointer-events:auto}" +
    ".axi-panneau iframe{width:100%;height:100%;border:0;display:block;background:transparent}" +
    "@media (max-width:640px){.axi-panneau{bottom:0;right:0;left:0;top:0;width:100%;height:100%;max-height:100%;border-radius:0}.axi-root{bottom:16px;right:16px}}";
  document.head.appendChild(style);

  // ─── Container racine ──────────────────────────────────────────
  var root = document.createElement("div");
  root.className = "axi-root";
  root.setAttribute("aria-live", "polite");

  // Overlay (clic pour fermer)
  var overlay = document.createElement("div");
  overlay.className = "axi-overlay";

  // Bouton pastille cercle rayonnant
  var bouton = document.createElement("button");
  bouton.className = "axi-bouton";
  bouton.setAttribute("aria-label", "Ouvrir l'assistant AxiSolver");
  bouton.innerHTML =
    '<span class="axi-onde"></span>' +
    '<span class="axi-onde axi-onde-2"></span>' +
    '<span class="axi-noyau">A</span>';

  // Panneau avec iframe
  var panneau = document.createElement("div");
  panneau.className = "axi-panneau";
  panneau.setAttribute("role", "dialog");
  panneau.setAttribute("aria-label", "Assistant AxiSolver");

  var iframe = null;
  var ouvert = false;

  function creerIframe() {
    if (iframe) return;
    iframe = document.createElement("iframe");
    iframe.src = EMBED_URL;
    iframe.setAttribute("title", "Assistant AxiSolver");
    iframe.setAttribute(
      "allow",
      "microphone *; clipboard-write *; autoplay *",
    );
    panneau.appendChild(iframe);
  }

  function ouvrir() {
    if (ouvert) return;
    creerIframe();
    ouvert = true;
    overlay.classList.add("on");
    panneau.classList.add("on");
    bouton.style.display = "none";
  }

  function fermer() {
    if (!ouvert) return;
    ouvert = false;
    overlay.classList.remove("on");
    panneau.classList.remove("on");
    bouton.style.display = "";
  }

  bouton.addEventListener("click", ouvrir);
  overlay.addEventListener("click", fermer);

  window.addEventListener("message", function (e) {
    if (!e.data || typeof e.data !== "object") return;
    if (e.data.type === "axi:fermer") fermer();
    if (e.data.type === "axi:pret") {
      // Signal : widget prêt (hook futur pour analytics)
    }
  });

  root.appendChild(bouton);
  document.body.appendChild(overlay);
  document.body.appendChild(panneau);
  document.body.appendChild(root);

  // API publique globale
  window.AxiSolver = {
    ouvrir: ouvrir,
    fermer: fermer,
    siteId: siteId,
    version: "1.0.0",
  };
})();
