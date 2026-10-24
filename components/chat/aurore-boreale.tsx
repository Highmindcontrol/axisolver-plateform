/**
 * <AuroreBoreale> — fond ambient aurore boréale, repris du design
 * AxiHub (/axi), à utiliser en absolute dans le modal AxiSolver.
 *
 * Palette : vert émeraude, cyan glacier, violet pourpre, bleu profond.
 * Zéro filter CSS, zéro backdrop-filter — gradients radiaux par blob
 * avec animations transform/opacity très lentes (120-160s). GPU-friendly
 * et respectueux du mode `prefers-reduced-motion`.
 */

const BLOBS = [
  {
    couleur: "#10B981",
    width: "75vmin",
    height: "95vmin",
    position: { top: "-20%", left: "-15%" },
    keyframe: 1,
    duree: 120,
    delay: 0,
  },
  {
    couleur: "#14B8A6",
    width: "70vmin",
    height: "90vmin",
    position: { top: "-10%", right: "-10%" },
    keyframe: 2,
    duree: 135,
    delay: -30,
  },
  {
    couleur: "#A855F7",
    width: "65vmin",
    height: "90vmin",
    position: { top: "20%", left: "35%" },
    keyframe: 3,
    duree: 150,
    delay: -50,
  },
  {
    couleur: "#3B82F6",
    width: "70vmin",
    height: "85vmin",
    position: { bottom: "-20%", left: "5%" },
    keyframe: 4,
    duree: 125,
    delay: -15,
  },
  {
    couleur: "#6366F1",
    width: "62vmin",
    height: "85vmin",
    position: { bottom: "-15%", right: "0%" },
    keyframe: 1,
    duree: 160,
    delay: -80,
  },
] as const;

export function AuroreBoreale() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Ciel nocturne — noir profond avec une pointe de bleu en bas. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #000000 0%, #050714 40%, #0a0f28 80%, #0d1b3d 100%)",
        }}
      />
      {/* Voiles d'aurore */}
      {BLOBS.map((b, i) => (
        <div
          key={`blob-${i}`}
          className="absolute will-change-transform"
          style={{
            width: b.width,
            height: b.height,
            ...b.position,
            background: `radial-gradient(ellipse at center, ${b.couleur}55 0%, ${b.couleur}00 55%)`,
            animation: `blob-flot-${b.keyframe} ${b.duree}s ease-in-out infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
