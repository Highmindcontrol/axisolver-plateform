"use client";

import Image from "next/image";

/**
 * Grosse pastille d'invitation à parler avec AxiSolver — version
 * agrandie du BoutonFlottant permanent, à poser dans les sections
 * éditoriales des pages (home, présentation détaillée, etc.) pour
 * remplacer un bouton texte classique « Parlez à AxiSolver ».
 *
 * Dispatche le même CustomEvent `axi:ouvrir` que le BoutonLancer.
 */

export function BoutonPastilleAxi({
  tailleRem = 10,
  className = "",
}: {
  /** Diamètre souhaité en rem. 10 = h-40 w-40 (160 px). */
  tailleRem?: number;
  className?: string;
}) {
  function onClique() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("axi:ouvrir"));
    }
  }
  // Taille fournie en style inline pour éviter la purge Tailwind.
  const style = { width: `${tailleRem}rem`, height: `${tailleRem}rem` };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Pastille — l'animation pulseAxiLarge est posée DIRECTEMENT
          sur le bouton (pas sur un span derrière) pour que le
          box-shadow pulsé parte du contour visible de la pastille
          et déborde vers l'extérieur. Sur une grosse pastille
          (224px), un halo en z-index négatif derrière resterait
          masqué par le bouton opaque. */}
      <button
        type="button"
        onClick={onClique}
        aria-label="Parler à AxiSolver"
        style={style}
        className="animate-pulseAxiLarge relative flex items-center justify-center overflow-hidden rounded-full bg-zinc-950 ring-2 ring-amber-400/60 transition-all hover:scale-105 hover:ring-amber-400"
      >
        <Image
          src="/axi-mascotte-bouton.png"
          alt=""
          width={400}
          height={400}
          priority
          aria-hidden
          className="h-auto w-[82%] translate-y-1"
        />
      </button>
    </div>
  );
}
