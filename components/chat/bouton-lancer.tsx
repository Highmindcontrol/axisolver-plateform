"use client";

/**
 * Bouton externe qui dispatche un CustomEvent `axi:ouvrir` écouté
 * par ChatWidget. Permet d'ouvrir le widget depuis n'importe où
 * dans la page (hero, CTA, section narrative…) sans refactorer
 * la gestion d'état interne du widget.
 */
export function BoutonLancerAxiSolver({
  libelle = "Lancer AxiSolver",
  className = "",
}: {
  libelle?: string;
  className?: string;
}) {
  function onClique() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("axi:ouvrir"));
    }
  }

  return (
    <button
      type="button"
      onClick={onClique}
      className={`group inline-flex items-center justify-center gap-3 rounded-full bg-amber-400 px-8 py-4 text-base font-semibold uppercase tracking-[0.14em] text-zinc-950 shadow-lg shadow-amber-400/30 transition-all hover:bg-amber-300 hover:shadow-amber-400/50 md:text-lg ${className}`}
    >
      {libelle}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
}
