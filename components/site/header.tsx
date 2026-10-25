import Image from "next/image";
import Link from "next/link";

/**
 * Header de navigation globale axisolver.app — sticky, fond noir
 * opaque pour éviter tout backdrop-blur au-dessus du fond animé
 * (voir mémoire perf 25 oct 2026).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
          aria-label="AxiSolver — accueil"
        >
          <Image
            src="/logo-axisolver-signature.png"
            alt="AxiSolver"
            width={2172}
            height={724}
            priority
            className="h-6 w-auto md:h-7"
          />
        </Link>

        <nav className="flex items-center gap-1 md:gap-2">
          <Link
            href="/parametrage-et-tarifs"
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-amber-300 md:text-base"
          >
            Tarifs
          </Link>
          <a
            href="https://axihub.live"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-amber-300 md:inline-block md:text-base"
          >
            AxiHub
          </a>
          <Link
            href="/parametrage-et-tarifs"
            className="ml-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-zinc-950 shadow-sm shadow-amber-400/20 transition-colors hover:bg-amber-300 md:ml-3 md:px-5"
          >
            Paramétrer
          </Link>
        </nav>
      </div>
    </header>
  );
}
