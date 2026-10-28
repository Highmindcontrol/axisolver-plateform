import type { Metadata } from "next";
import { Questionnaire } from "./_questionnaire";
import { OngletsInformations } from "./_onglets-informations";
import { ChatWidget } from "@/components/chat/chat-widget";
import { SiteHeader } from "@/components/site/header";

export const metadata: Metadata = {
  title: "Paramétrer votre AxiSolver — Tarifs transparents",
  description:
    "Trois formules AxiSolver (Text Only, Classique, Premium), un simulateur en direct selon le volume de visiteurs de votre site. Choisissez la voix, obtenez votre tarif immédiatement.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      {/* ─────────── HERO ─────────── */}
      <section className="relative overflow-hidden border-b border-zinc-900 bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-amber-300"
          >
            <span aria-hidden>←</span> Retour
          </a>

          <div className="mt-10 grid grid-cols-1 items-start gap-10 md:grid-cols-[1fr_auto] md:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Paramétrage et tarifs
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
                Choisissez votre AxiSolver,{" "}
                <span className="text-amber-400">obtenez votre tarif.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                Trois formules, trois niveaux de voix. Le prix
                s&apos;ajuste au volume de visiteurs de votre site. Pas
                de palier caché, pas de surprise.
              </p>
            </div>

            {/* Pastille promo rotative « À partir de 49 € HT/mois » */}
            <div
              aria-label="À partir de 49 euros hors taxe par mois"
              className="relative mx-auto flex h-36 w-36 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-zinc-950 shadow-xl shadow-amber-400/30 md:h-44 md:w-44 lg:h-52 lg:w-52"
              style={{ transform: "rotate(-8deg)" }}
            >
              <div className="pointer-events-none absolute inset-2 rounded-full border-2 border-dashed border-zinc-950/40" />
              <div className="relative px-3 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] md:text-[10px]">
                  À partir de
                </p>
                <p className="mt-1 font-mono text-3xl font-bold leading-none tracking-tight md:text-4xl lg:text-5xl">
                  49 €
                </p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] md:text-[10px]">
                  HT / mois
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── EXPLICATION « POURQUOI 3 FORMULES » (fond ondes dorées) ─────────── */}
      <section
        className="relative overflow-hidden bg-zinc-900 bg-cover bg-center bg-no-repeat px-6 py-16 md:px-10 md:py-24"
        style={{ backgroundImage: "url(/separation-ondes-dorees.png)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-zinc-900/85 via-zinc-900/75 to-zinc-900/90"
        />
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              Ce qui coûte
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              La voix.
            </h3>
            <p className="mt-3 text-base leading-relaxed text-zinc-300">
              Comprendre la demande du visiteur et lui répondre texte,
              c&apos;est quelques centimes. La voix synthétique,
              c&apos;est l&apos;essentiel du coût technique
              d&apos;AxiSolver. On vous laisse le choix.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              Ce qui change
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              Le ressenti.
            </h3>
            <p className="mt-3 text-base leading-relaxed text-zinc-300">
              Une voix bluffante peut tripler votre taux
              d&apos;engagement. Mais elle n&apos;est pas indispensable
              pour tous les sites. L&apos;écrit reste parfait pour la
              plupart des usages.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              Ce qui ne change pas
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              Tout le reste.
            </h3>
            <p className="mt-3 text-base leading-relaxed text-zinc-300">
              Les six missions sont identiques dans les trois formules :
              accueil, SEO, sécurité, Analytics, Ads intelligents,
              bouclier défensif. Seule la voix change.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────── QUESTIONNAIRE GUIDÉ ─────────── */}
      <Questionnaire />

      {/* ─────────── ONGLETS : Pour bien comprendre / Nos sources ─────────── */}
      <OngletsInformations />

      {/* ─────────── FOOTER sobre ─────────── */}
      <footer className="border-t border-zinc-800 bg-zinc-950 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-zinc-400 md:flex-row">
          <div>
            Édité par{" "}
            <a
              href="https://ataraxis.group"
              className="font-medium text-amber-300 hover:text-amber-200"
            >
              Ataraxis Studio
            </a>
            {" — groupe Ataraxis"}
          </div>
          <div className="flex gap-6">
            <a href="/" className="hover:text-amber-300">
              Accueil
            </a>
            <a href="https://axihub.live" className="hover:text-amber-300">
              AxiHub
            </a>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </main>
  );
}
