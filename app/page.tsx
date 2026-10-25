import Image from "next/image";
import { ChatWidget } from "@/components/chat/chat-widget";
import { BoutonLancerAxiSolver } from "@/components/chat/bouton-lancer";
import { SiteHeader } from "@/components/site/header";

type IconProps = { className?: string };

function IconChat({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconSearch({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function IconShield({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
function IconBarChart({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
function IconTarget({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconShieldCheck({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconMonitor({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}
function IconClipboard({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}
function IconLayers({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="m22 12.08-9.17 4.18a2 2 0 0 1-1.66 0L2 12.08" />
      <path d="m22 17.08-9.17 4.18a2 2 0 0 1-1.66 0L2 17.08" />
    </svg>
  );
}
function IconSparkles({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18l1.9-5.4 5.8-1.9-5.8-1.9z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

// ─── Données ────────────────────────────────────────────────────── //

const CAPACITES: Array<{
  numero: string;
  titre: string;
  resume: string;
  Icon: (p: IconProps) => React.JSX.Element;
  avenir?: boolean;
}> = [
  {
    numero: "01",
    titre: "Accueil visiteur",
    resume:
      "24 heures sur 24 et 7 jours sur 7, voix et écrit, toutes langues. Comprend, résout, qualifie, transmet.",
    Icon: IconChat,
  },
  {
    numero: "02",
    titre: "Veille SEO",
    resume:
      "Audit à l'installation, re-check hebdomadaire, rapport mensuel narratif.",
    Icon: IconSearch,
  },
  {
    numero: "03",
    titre: "Veille sécurité",
    resume:
      "Failles, plugins obsolètes, CVE actives, headers manquants. Alerte immédiate.",
    Icon: IconShield,
  },
  {
    numero: "04",
    titre: "Veille Analytics",
    resume:
      "Chaque mois, votre trafic raconté en langage humain. Pages de fuite, parcours brisés.",
    Icon: IconBarChart,
  },
  {
    numero: "05",
    titre: "SEO + Ads intelligents",
    resume:
      "Préparation complète de vos campagnes AdWords et AdSense. Vous validez d'un clic.",
    Icon: IconTarget,
    avenir: true,
  },
  {
    numero: "06",
    titre: "Bouclier défensif",
    resume:
      "Comme un antivirus actif. Blocage temps réel des bots, injections et intrusions.",
    Icon: IconShieldCheck,
    avenir: true,
  },
];

const COMPARATIF: Array<{ dimension: string; chatbot: string; solver: string }> = [
  {
    dimension: "Compréhension",
    chatbot: "Décroche sur un mot-clé.",
    solver: "Lit le vrai problème et le reformule.",
  },
  {
    dimension: "Résolution",
    chatbot: "Ne résout rien, bascule vers un humain.",
    solver: "Résout seul la majorité des demandes.",
  },
  {
    dimension: "Humain quand il faut",
    chatbot: "Formulaire vide, bot en boucle.",
    solver: "Dossier qualifié, référence AXI générée.",
  },
  {
    dimension: "Visibilité du travail",
    chatbot: "Bulle fermée, boîte noire.",
    solver: "Interface vivante — la fiche visiteur se remplit en direct.",
  },
  {
    dimension: "Veille technique",
    chatbot: "Aucune.",
    solver: "SEO, sécurité, Analytics, Ads intelligents, bouclier défensif.",
  },
  {
    dimension: "Mémoire",
    chatbot: "Aucune, session à session.",
    solver: "Historique conservé, brief matinal à l'équipe.",
  },
  {
    dimension: "Mise en route",
    chatbot: "Plusieurs semaines de configuration.",
    solver: "Snippet dans le head, quelques heures d'éducation.",
  },
];

const FEATURES_SIGNATURE: Array<{
  Icon: (p: IconProps) => React.JSX.Element;
  titre: string;
  description: string;
}> = [
  {
    Icon: IconMonitor,
    titre: "Interface vivante",
    description:
      "Vos visiteurs ne parlent plus à une boîte noire. Ils voient leur fiche se remplir, tapent leur email de leur main, confirment leur demande.",
  },
  {
    Icon: IconClipboard,
    titre: "Rapport triple-voie",
    description:
      "Chaque faille vient avec trois issues : agence partenaire, voie dev interne, ou méthode pas-à-pas en 15 minutes.",
  },
  {
    Icon: IconLayers,
    titre: "Six missions, un tarif",
    description:
      "Vos concurrents paient six prestataires. Vous, un seul produit indivisible.",
  },
  {
    Icon: IconSparkles,
    titre: "Et sait aussi s'amuser",
    description:
      "À la fin d'une conversation résolue, AxiSolver propose parfois une partie de morpion. Les grandes idées se diffusent par les détails inattendus.",
  },
];

// ─── Composant ──────────────────────────────────────────────────── //

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      {/* ─────────── HERO épuré ─────────── */}
      <section
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-mascotte-demo.png)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/35 to-zinc-950"
        />

        <div className="relative z-10 flex min-h-[640px] flex-col justify-between py-10 md:min-h-[820px] md:py-16">
          {/* Accroche collée à gauche, pas de centrage, pas de max-w serré */}
          <div className="max-w-3xl pl-4 pt-2 pr-6 md:pl-10 md:pt-6">
            <h1 className="text-left text-3xl font-semibold leading-[1.1] tracking-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)] md:text-5xl lg:text-6xl">
              Votre site internet va prendre{" "}
              <span className="text-amber-400">un sacré coup de jeune</span>…
            </h1>
          </div>

          <div aria-hidden />
        </div>
      </section>

      {/* ─────────── MUR DES SIX CAPACITÉS ─────────── */}
      <section className="relative bg-zinc-950 px-6 py-20 md:px-10 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-3xl md:mb-20">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Les six capacités
            </p>
            <h2
              className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl"
            >
              Un seul AxiSolver.{" "}
              <span className="text-amber-400">
                Six territoires simultanés.
              </span>
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
              La métamorphose de votre présence en ligne, dans un seul
              produit indivisible. Pas de version Lite. Pas de pack à
              composer. Juste AxiSolver, qui fait tout.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {CAPACITES.map((c) => (
              <article key={c.numero} className="group">
                <div className="flex items-start gap-5">
                  <c.Icon className="h-10 w-10 flex-shrink-0 text-amber-400 transition-transform group-hover:scale-110" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[11px] font-medium tracking-widest text-zinc-500">
                        {c.numero}
                      </span>
                      <h3 className="text-xl font-semibold tracking-tight text-white">
                        {c.titre}
                      </h3>
                      {c.avenir && (
                        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                          À venir
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                      {c.resume}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── AXI PREND LA PAROLE — moment éditorial ─────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 px-6 py-24 md:px-10 md:py-40">
        {/* Halo doré subtil derrière la citation */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/5 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            La voix d&apos;AXI
          </p>

          <blockquote
            className="mt-10 text-balance text-2xl font-medium leading-[1.4] text-white md:text-3xl lg:text-4xl"
          >
            <span className="text-amber-400">«</span>{" "}
            Je suis une intelligence artificielle qui fait de votre site
            web son territoire. Dès que je m&apos;installe, je déploie
            mes compétences 24 heures sur 24 et 7 jours sur 7, en toute
            autonomie.{" "}
            <span className="text-amber-400">»</span>
          </blockquote>

          <div className="mx-auto mt-14 max-w-2xl space-y-6 text-base leading-relaxed text-zinc-300 md:text-lg">
            <p>
              J&apos;accueille et je gère les demandes de vos visiteurs.
              Je les transforme en contacts qualifiés pour vos équipes
              de vente.
            </p>
            <p>
              Je travaille aussi votre référencement pour vous faire
              monter dans les résultats de recherche, et je vous remets
              des comptes-rendus réguliers sur mes performances.
            </p>
            <p>
              Et ce n&apos;est pas tout : je me comporte en gardien
              actif de votre site, en surveillant en permanence tout
              ce qui pourrait le menacer.
            </p>
          </div>

          {/* Pivot émotionnel : question d'invite + CTA central */}
          <div className="mt-20 flex flex-col items-center gap-10 text-center">
            <p
              className="max-w-2xl text-balance text-2xl font-medium leading-snug text-amber-300 md:text-3xl lg:text-4xl"
            >
              Et si vous me laissiez vous expliquer tout ça
              moi-même&nbsp;?
            </p>
            <BoutonLancerAxiSolver libelle="Parlez à AxiSolver" />
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Vocal ou écrit · Toutes langues · Zéro engagement
            </p>
          </div>
        </div>
      </section>

      {/* ─────────── FEATURES SIGNATURE ─────────── */}
      <section className="bg-zinc-950 px-6 py-20 md:px-10 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-3xl md:mb-20">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Signatures
            </p>
            <h2
              className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl"
            >
              Ce qui n&apos;existe{" "}
              <span className="text-amber-400">
                nulle part ailleurs.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2">
            {FEATURES_SIGNATURE.map((f) => (
              <article
                key={f.titre}
                className="group border-t border-zinc-800 pt-8"
              >
                <f.Icon className="h-9 w-9 text-amber-400 transition-transform group-hover:scale-110" />
                <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                  {f.titre}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-zinc-400">
                  {f.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── COMPARATIF ─────────── */}
      <section className="bg-zinc-900 px-6 py-20 md:px-10 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Comparaison
            </p>
            <h2
              className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl"
            >
              Chatbot classique{" "}
              <span className="text-amber-400">vs</span> AxiSolver
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400">
              Les chatbots filtrent et bloquent. AxiSolver résout, veille
              et transforme.
            </p>
          </div>

          <div className="overflow-hidden rounded-sm border border-zinc-800">
            <div className="grid grid-cols-12 bg-zinc-950 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              <div className="col-span-4">Dimension</div>
              <div className="col-span-4">Chatbot classique</div>
              <div className="col-span-4">AxiSolver</div>
            </div>
            {COMPARATIF.map((row, i) => (
              <div
                key={row.dimension}
                className={`grid grid-cols-1 gap-4 bg-zinc-900 px-6 py-5 md:grid-cols-12 md:gap-6 ${
                  i !== 0 ? "border-t border-zinc-800" : ""
                }`}
              >
                <div className="font-semibold tracking-tight text-amber-300 md:col-span-4">
                  {row.dimension}
                </div>
                <div className="text-sm text-zinc-500 line-through decoration-zinc-700 md:col-span-4">
                  {row.chatbot}
                </div>
                <div className="text-sm font-medium text-white md:col-span-4">
                  {row.solver}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── CTA FINAL ─────────── */}
      <section className="bg-zinc-950 px-6 py-24 md:px-10 md:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl"
          >
            Prêt à transformer{" "}
            <span className="text-amber-400">
              votre présence en ligne&nbsp;?
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Choisissez votre formule, ajustez le volume de visiteurs
            de votre site et obtenez votre tarif en direct.
          </p>
          <div className="mt-12">
            <a
              href="/parametrage-et-tarifs"
              className="inline-flex items-center gap-3 rounded-full bg-amber-400 px-8 py-4 text-base font-semibold uppercase tracking-[0.14em] text-zinc-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:shadow-amber-400/50 md:text-lg"
            >
              Paramétrer votre AxiSolver
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
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
            <a
              href="https://axihub.live"
              className="hover:text-amber-300"
            >
              AxiHub
            </a>
            <a
              href="https://ataraxis.group/mentions-legales"
              className="hover:text-amber-300"
            >
              Mentions légales
            </a>
          </div>
        </div>
      </footer>

      {/* Widget AxiSolver — pastille flottante + modal centré au clic. */}
      <ChatWidget />
    </main>
  );
}
