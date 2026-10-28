import type { Metadata } from "next";
import { Simulateur } from "./_simulateur";
import { OngletsInformations } from "./_onglets-informations";
import { ChatWidget } from "@/components/chat/chat-widget";
import { SiteHeader } from "@/components/site/header";

export const metadata: Metadata = {
  title: "Paramétrer votre AxiSolver — Tarifs transparents",
  description:
    "Quatre formules AxiSolver (Text Only et Premium ElevenLabs, en petit ou grand volume). Simulateur de recommandation selon votre type de site et votre trafic.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      {/* ─────────── HERO ─────────── */}
      <section className="relative overflow-hidden border-b border-zinc-900 bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-[1fr_auto] md:gap-14">
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

      {/* ─────────── NOS 3 FORFAITS (fond ondes dorées) ─────────── */}
      <section
        className="relative overflow-hidden bg-zinc-900 bg-cover bg-center bg-no-repeat px-6 py-20 md:px-10 md:py-28"
        style={{ backgroundImage: "url(/separation-ondes-dorees.png)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-900/85"
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Nos quatre formules
            </p>
            <h2 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
              Voix ou écrit, petit ou grand.{" "}
              <span className="text-amber-400">
                Vous choisissez, le reste suit.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {[
              {
                nom: "AxiSolver Text Only",
                sub: "Petit volume · Écrit seul",
                prix: 49,
                conv: 300,
                phare: false,
                desc:
                  "Les 6 missions AxiSolver en version écrite. Idéal pour les sites de moins de 10 000 visiteurs mensuels.",
              },
              {
                nom: "AxiSolver Text Only",
                sub: "Grand volume · Écrit seul",
                prix: 69,
                conv: 500,
                phare: false,
                desc:
                  "La version écrite dimensionnée pour les sites à forte audience. Au-delà de 10 000 visiteurs mensuels.",
              },
              {
                nom: "AxiSolver Premium",
                sub: "Petit volume · Voix ElevenLabs",
                prix: 99,
                conv: 300,
                phare: true,
                desc:
                  "La voix ElevenLabs ultra-réaliste pour la majorité des sites. Notre produit phare.",
              },
              {
                nom: "AxiSolver Premium",
                sub: "Grand volume · Voix ElevenLabs",
                prix: 129,
                conv: 500,
                phare: false,
                desc:
                  "La voix ElevenLabs pour les sites qui scalent. Au-delà de 10 000 visiteurs mensuels.",
              },
            ].map((f) => (
              <article
                key={`${f.nom}-${f.prix}`}
                className={`relative rounded-2xl border p-7 backdrop-blur-sm transition-all md:p-6 ${
                  f.phare
                    ? "border-amber-400/60 bg-zinc-950/70 shadow-lg shadow-amber-400/10"
                    : "border-zinc-700/60 bg-zinc-950/55 hover:border-amber-400/40"
                }`}
              >
                {f.phare && (
                  <span className="absolute -top-3 right-6 inline-flex rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-950">
                    Phare
                  </span>
                )}
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                  {f.sub}
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">
                  {f.nom}
                </h3>
                <p className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-mono text-4xl font-semibold tracking-tight text-white">
                    {f.prix} €
                  </span>
                  <span className="text-sm text-zinc-400">HT / mois</span>
                </p>
                <p className="mt-5 text-sm leading-relaxed text-zinc-300">
                  {f.desc}
                </p>
                <p className="mt-5 text-[11px] uppercase tracking-widest text-zinc-500">
                  {f.conv} conversations incluses / mois
                </p>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center text-xs leading-relaxed text-zinc-500">
            Palier à 10 000 visiteurs/mois : conseil, pas une
            contrainte. Packs supplémentaires de 100 conv à la
            demande (10 € en Text Only, 20 € en Premium), reportables
            jusqu&apos;à 3 mois.
          </p>
        </div>
      </section>

      {/* ─────────── SIMULATEUR / QUESTIONNAIRE DE RECOMMANDATION ─────────── */}
      <Simulateur />

      {/* ─────────── INSTALLATION — deux chemins ─────────── */}
      <section className="border-t border-zinc-900 bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Installation
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              Deux chemins pour l&apos;installer.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              La formule que vous choisissez ici détermine ensuite votre
              parcours d&apos;installation : simple et autonome pour la
              grande majorité des cas, accompagné pour les configurations
              particulières.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Installation simple — 80 % des cas
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">
                Souscription directe depuis cette page
              </h3>
              <ol className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-300 md:text-base">
                <li>
                  <span className="font-mono text-amber-400">1.</span>{" "}
                  Vous choisissez votre formule et votre volumétrie dans
                  le simulateur ci-dessus
                </li>
                <li>
                  <span className="font-mono text-amber-400">2.</span>{" "}
                  Un AXI d&apos;onboarding vous interroge 15 à 30 minutes
                  à l&apos;oral ou à l&apos;écrit : métier, ton, services,
                  sujets sensibles
                </li>
                <li>
                  <span className="font-mono text-amber-400">3.</span>{" "}
                  AxiSolver parcourt votre site public, vos documents,
                  vos CGV, votre FAQ, apprend votre métier
                </li>
                <li>
                  <span className="font-mono text-amber-400">4.</span>{" "}
                  Vous récupérez un snippet JavaScript à coller dans le
                  head de votre site (3 lignes, comme Google Analytics)
                </li>
                <li>
                  <span className="font-mono text-amber-400">5.</span>{" "}
                  AxiSolver prend la parole dès le premier visiteur
                </li>
              </ol>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Installation accompagnée — cas particuliers
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">
                Intégration dédiée via Ataraxis Bridge
              </h3>
              <ol className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-300 md:text-base">
                <li>
                  <span className="font-mono text-amber-400">1.</span>{" "}
                  Audit préalable approfondi de votre site, de votre
                  métier et de vos processus
                </li>
                <li>
                  <span className="font-mono text-amber-400">2.</span>{" "}
                  Scope personnalisé des 6 missions selon vos besoins
                  réels
                </li>
                <li>
                  <span className="font-mono text-amber-400">3.</span>{" "}
                  Branchement CRM, SSO, outils métier, flux spécifiques
                </li>
                <li>
                  <span className="font-mono text-amber-400">4.</span>{" "}
                  Formation de vos équipes à la réception des dossiers
                  qualifiés
                </li>
                <li>
                  <span className="font-mono text-amber-400">5.</span>{" "}
                  Suivi d&apos;optimisation sur 3 mois
                </li>
              </ol>
            </article>
          </div>
        </div>
      </section>

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
