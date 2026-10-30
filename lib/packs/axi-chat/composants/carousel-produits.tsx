"use client";

import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ConfigProduitsAxi, ProduitAxi } from "../types";

/**
 * Carousel de produits e-commerce du pack @axi-chat.
 *
 * **Doctrine Praximea** : ce composant vit dans **l'ailette gauche**
 * du triptyque `AxiChatCopilote`, PAS dans la zone de chat centrale.
 * L'ailette gauche est l'endroit canonique pour les informations
 * riches (images, formulaires, inputs structurés, carousel). La
 * zone centrale reste réservée aux messages + boutons rapides, et
 * l'ailette droite aux ordres pris par AXI.
 *
 * Usage canonique :
 *   <AxiChatCopilote
 *     config={config}
 *     aileteGauche={
 *       <CarouselProduits produits={produits} config={configProduits} />
 *     }
 *   />
 *
 * Zones fournies pour chaque card :
 *   - image principale (avec badge en overlay si présent)
 *   - nom du produit
 *   - description courte (160 chars max affichés)
 *   - prix (actuel + barré en option) avec devise
 *   - pastille de stock (en_stock / faible / rupture)
 *   - bouton CTA « Voir le produit » (ou texte custom) → ouvre
 *     lienBoutique dans un nouvel onglet
 *
 * Navigation : flèches Prev/Next + dots. Autoplay optionnel.
 * L'ailette gauche étant étroite (~29% du viewport), le défaut
 * responsive affiche 1 card visible à la fois.
 *
 * Zéro dépendance externe hors lucide-react + React (doctrine pack).
 */
export function CarouselProduits({
  produits,
  config,
  onClicProduit,
  onClicAcheter,
}: {
  produits: ProduitAxi[];
  config?: ConfigProduitsAxi;
  onClicProduit?: (produit: ProduitAxi) => void;
  onClicAcheter?: (produit: ProduitAxi) => void;
}) {
  const refScroll = useRef<HTMLDivElement | null>(null);
  const [indexActif, setIndexActif] = useState(0);
  const cardsVisibles = config?.cardsVisibles ?? null; // null = responsive auto
  const avecFleches = config?.avecFleches !== false;
  const avecDots = config?.avecDots !== false && produits.length > 1;
  const autoplayMs = config?.autoplayMs ?? 0;

  // Autoplay optionnel.
  useEffect(() => {
    if (!autoplayMs || produits.length <= 1) return;
    const t = setInterval(() => {
      setIndexActif((i) => (i + 1) % produits.length);
    }, autoplayMs);
    return () => clearInterval(t);
  }, [autoplayMs, produits.length]);

  // Scroll vers la card active quand indexActif change (via dots ou flèches).
  useEffect(() => {
    const el = refScroll.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-card]");
    const target = cards[indexActif];
    if (target) {
      el.scrollTo({
        left: target.offsetLeft - el.offsetLeft,
        behavior: "smooth",
      });
    }
  }, [indexActif]);

  // Observe scroll manuel (swipe mobile) pour mettre à jour l'index.
  useEffect(() => {
    const el = refScroll.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const cards = el.querySelectorAll<HTMLElement>("[data-card]");
        let plusProche = 0;
        let distanceMin = Infinity;
        cards.forEach((c, i) => {
          const d = Math.abs(c.offsetLeft - el.scrollLeft - el.offsetLeft);
          if (d < distanceMin) {
            distanceMin = d;
            plusProche = i;
          }
        });
        setIndexActif(plusProche);
      }, 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (produits.length === 0) return null;

  // Largeur card selon cardsVisibles : si fixé on force, sinon responsive
  // via CSS (basis-full sm:basis-1/2 lg:basis-1/3).
  const classeLargeur =
    cardsVisibles === 1
      ? "basis-full"
      : cardsVisibles === 2
        ? "basis-full sm:basis-1/2"
        : cardsVisibles === 3
          ? "basis-full sm:basis-1/2 lg:basis-1/3"
          : "basis-[85%] sm:basis-1/2 lg:basis-1/3";

  return (
    <section
      className="relative py-3"
      aria-label={config?.titre ?? "Produits recommandés"}
    >
      {config?.titre && (
        <h3
          className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--axi-chat-texte-secondaire)" }}
        >
          {config.titre}
        </h3>
      )}

      <div className="relative">
        {/* Flèche gauche */}
        {avecFleches && produits.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setIndexActif((i) => (i - 1 + produits.length) % produits.length)
            }
            aria-label="Produit précédent"
            className="absolute left-0 top-1/2 z-10 -translate-x-2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-opacity hover:opacity-100 opacity-80"
            style={{
              background: "var(--axi-chat-surface)",
              color: "var(--axi-chat-texte)",
              border: "1px solid var(--axi-chat-bordure)",
            }}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
          </button>
        )}

        {/* Rail scrollable */}
        <div
          ref={refScroll}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
          style={{
            scrollbarWidth: "none",
          }}
        >
          <style>{`
            [data-carousel-produits]::-webkit-scrollbar { display: none; }
          `}</style>
          {produits.map((p) => (
            <article
              key={p.id}
              data-card
              className={`${classeLargeur} shrink-0 snap-start`}
            >
              <CardProduit
                produit={p}
                onClicProduit={onClicProduit}
                onClicAcheter={onClicAcheter}
              />
            </article>
          ))}
        </div>

        {/* Flèche droite */}
        {avecFleches && produits.length > 1 && (
          <button
            type="button"
            onClick={() => setIndexActif((i) => (i + 1) % produits.length)}
            aria-label="Produit suivant"
            className="absolute right-0 top-1/2 z-10 translate-x-2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-opacity hover:opacity-100 opacity-80"
            style={{
              background: "var(--axi-chat-surface)",
              color: "var(--axi-chat-texte)",
              border: "1px solid var(--axi-chat-bordure)",
            }}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Dots navigation */}
      {avecDots && (
        <div className="mt-2 flex justify-center gap-1.5">
          {produits.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndexActif(i)}
              aria-label={`Aller au produit ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === indexActif ? "16px" : "6px",
                background:
                  i === indexActif
                    ? "var(--axi-chat-accent)"
                    : "var(--axi-chat-texte-tertiaire)",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CardProduit({
  produit,
  onClicProduit,
  onClicAcheter,
}: {
  produit: ProduitAxi;
  onClicProduit?: (p: ProduitAxi) => void;
  onClicAcheter?: (p: ProduitAxi) => void;
}) {
  const devise = devisePourSymbole(produit.devise ?? "EUR");
  const texteBouton = produit.texteBouton ?? "Voir le produit";

  function ouvrirBoutique() {
    if (typeof window !== "undefined") {
      window.open(produit.lienBoutique, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{
        background: "var(--axi-chat-surface)",
        border: "1px solid var(--axi-chat-bordure)",
        borderRadius: "var(--axi-chat-rayon)",
      }}
    >
      {/* Image + badge */}
      <button
        type="button"
        onClick={() => {
          onClicProduit?.(produit);
          ouvrirBoutique();
        }}
        className="relative block w-full overflow-hidden"
        aria-label={`Voir ${produit.nom}`}
      >
        <div
          className="aspect-[4/3] w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${produit.imageUrl})`,
            backgroundColor: "var(--axi-chat-surface-interactive)",
          }}
          role="img"
          aria-label={produit.nom}
        />
        {produit.badge && (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm"
            style={{
              background: "var(--axi-chat-accent)",
              color: "var(--axi-chat-texte-sur-accent)",
            }}
          >
            {produit.badge}
          </span>
        )}
        {produit.stock && produit.stock !== "en_stock" && (
          <span
            className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm"
            style={{
              background:
                produit.stock === "rupture" ? "#dc2626" : "#f59e0b",
              color: "#ffffff",
            }}
          >
            {produit.stock === "rupture" ? "Épuisé" : "Stock faible"}
          </span>
        )}
      </button>

      {/* Contenu */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h4
          className="line-clamp-2 text-sm font-semibold leading-tight"
          style={{ color: "var(--axi-chat-texte)" }}
        >
          {produit.nom}
        </h4>

        {produit.description && (
          <p
            className="line-clamp-2 text-xs leading-snug"
            style={{ color: "var(--axi-chat-texte-secondaire)" }}
          >
            {produit.description}
          </p>
        )}

        {/* Prix */}
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span
            className="text-base font-bold"
            style={{ color: "var(--axi-chat-texte)" }}
          >
            {produit.prix}&nbsp;{devise}
          </span>
          {produit.prixBarre && (
            <span
              className="text-xs line-through"
              style={{ color: "var(--axi-chat-texte-tertiaire)" }}
            >
              {produit.prixBarre}&nbsp;{devise}
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => {
            onClicAcheter?.(produit);
            ouvrirBoutique();
          }}
          disabled={produit.stock === "rupture"}
          className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--axi-chat-accent)",
            color: "var(--axi-chat-texte-sur-accent)",
          }}
        >
          {texteBouton}
          <ExternalLink className="h-3 w-3" strokeWidth={2.4} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/**
 * Convertit un code ISO 4217 en symbole affichable. Codes exotiques
 * tombent sur le code brut (ex: "SEK").
 */
function devisePourSymbole(code: string): string {
  const map: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    CHF: "CHF",
    CAD: "CA$",
    JPY: "¥",
  };
  return map[code.toUpperCase()] ?? code;
}
