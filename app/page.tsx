import Image from "next/image";
import { ChatWidget } from "@/components/chat/chat-widget";
import { BoutonLancerAxiSolver } from "@/components/chat/bouton-lancer";

type IconProps = { className?: string };

function IconChat({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconSearch({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function IconShield({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
function IconBarChart({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
function IconTarget({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconShieldCheck({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconMonitor({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}
function IconClipboard({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}
function IconLayers({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="m22 12.08-9.17 4.18a2 2 0 0 1-1.66 0L2 12.08" />
      <path d="m22 17.08-9.17 4.18a2 2 0 0 1-1.66 0L2 17.08" />
    </svg>
  );
}
function IconSparkles({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18l1.9-5.4 5.8-1.9-5.8-1.9z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

const MISSIONS: Array<{
  numero: string;
  titre: string;
  description: string;
  mode: string;
  Icon: (p: IconProps) => React.JSX.Element;
  avenir?: boolean;
}> = [
  {
    numero: "01",
    titre: "Accueille vos visiteurs",
    description:
      "24 heures sur 24 et 7 jours sur 7, en voix et à l'écrit, dans toutes les langues européennes. Comprend, résout, qualifie, transmet un dossier chaud à votre équipe. Pas un chatbot — un AXI éduqué sur votre métier.",
    mode: "En continu",
    Icon: IconChat,
  },
  {
    numero: "02",
    titre: "Veille sur votre SEO",
    description:
      "À l'installation, audit on-page complet. Chaque semaine, re-check des indicateurs clés. Chaque mois, rapport narratif de ce qui marche et de ce qui coince.",
    mode: "Initial + hebdomadaire",
    Icon: IconSearch,
  },
  {
    numero: "03",
    titre: "Veille sur votre sécurité",
    description:
      "Audit sécurité à l'installation : failles, CVE actives, plugins obsolètes, headers manquants. Monitoring continu. Alerte immédiate si régression détectée.",
    mode: "Initial + continu",
    Icon: IconShield,
  },
  {
    numero: "04",
    titre: "Lit vos métriques pour vous",
    description:
      "Connecté à votre Analytics, AxiSolver lit vos chiffres chaque mois et vous les raconte en langage humain. Pages de fuite, parcours brisés, moments de bascule.",
    mode: "Mensuel",
    Icon: IconBarChart,
  },
  {
    numero: "05",
    titre: "SEO et Ads intelligents",
    description:
      "Suit les mots-clés les plus tapés, repère les requêtes à faible concurrence, produit des recommandations concrètes et prépare vos campagnes AdWords et AdSense sur votre compte Google Ads. Vous validez d'un clic — AxiSolver ne touche jamais à votre budget sans votre feu vert explicite.",
    mode: "En déploiement",
    Icon: IconTarget,
    avenir: true,
  },
  {
    numero: "06",
    titre: "Protège votre site activement",
    description:
      "Comme un antivirus qui veille en permanence. Bloque en temps réel les patterns malveillants, les bots agressifs, les tentatives d'injection. Côté serveur, détecte les intrusions et alerte en langage humain, avec validation avant chaque règle de blocage.",
    mode: "En déploiement",
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
    solver: "Interface vivante — vos visiteurs voient leur fiche se remplir.",
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
      "Vos visiteurs ne parlent plus à une boîte noire. Pendant la conversation, ils voient leur fiche se remplir, tapent leur email de leur main, confirment leur demande. Fin du « allô, vous m'avez noté ? ».",
  },
  {
    Icon: IconClipboard,
    titre: "Rapport triple-voie",
    description:
      "Chaque faille détectée vient avec trois solutions : « faire par une agence » (avec partenaire recommandé), « faire vous-même » (si vous avez un dev), ou méthode pas-à-pas détaillée pour la faire soi-même en 15 minutes.",
  },
  {
    Icon: IconLayers,
    titre: "Six missions, un tarif",
    description:
      "Accueil, SEO, Sécurité, Analytics, Ads intelligents et Bouclier défensif dans un seul produit. Vos concurrents paient six prestataires différents. Vous, un seul.",
  },
  {
    Icon: IconSparkles,
    titre: "Et sait aussi s'amuser",
    description:
      "À la fin d'une conversation résolue, AxiSolver propose parfois une partie de morpion. Les grandes idées se diffusent par les détails inattendus.",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* === Hero — image en background, logo + baselines en overlay === */}
      <section
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-mascotte-demo.png)" }}
      >
        {/* Voile sombre dégradé pour garantir la lisibilité du texte */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/40 to-zinc-950"
        />

        <div className="relative z-10 mx-auto flex min-h-[620px] max-w-[1600px] flex-col justify-between px-6 py-10 md:min-h-[780px] md:px-16 md:py-14 lg:px-20">
          {/* Logo + baseline — décalé vers la droite et descendu */}
          <div className="max-w-2xl pl-8 pt-10 md:pl-20 md:pt-14">
            <Image
              src="/logo-axisolver.png"
              alt="AxiSolver"
              width={2172}
              height={724}
              priority
              className="h-auto w-72 drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)] md:w-96 lg:w-[28rem]"
            />
            {/* Baseline tendue sous le logo */}
            <div className="mt-5 flex items-center gap-3 md:mt-7">
              <span
                aria-hidden
                className="h-px w-10 bg-amber-400/70 md:w-14"
              />
              <p className="text-base font-medium uppercase leading-tight tracking-[0.22em] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] md:text-lg">
                <span className="text-amber-400">Game Changer</span>
                <span className="mx-2 text-white/50">·</span>
                pour votre site web
              </p>
            </div>
          </div>

          {/* Zone basse — 6 pictos à gauche + signature publicitaire à droite */}
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            {/* 6 pictos AxiSolver avec libellés */}
            <div className="max-w-xl rounded-2xl border border-white/10 bg-zinc-950/60 p-5 backdrop-blur-sm md:p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                Ce qu&apos;AxiSolver fait pour vous
              </p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-4 md:grid-cols-6">
                {[
                  { Icon: IconChat, libelle: "Accueil" },
                  { Icon: IconSearch, libelle: "SEO" },
                  { Icon: IconShield, libelle: "Sécurité" },
                  { Icon: IconBarChart, libelle: "Analytics" },
                  { Icon: IconTarget, libelle: "Ads" },
                  { Icon: IconShieldCheck, libelle: "Bouclier" },
                ].map((p) => (
                  <div
                    key={p.libelle}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <p.Icon className="h-6 w-6 text-amber-400 md:h-7 md:w-7" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/80 md:text-xs">
                      {p.libelle}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature publicitaire en caractères normaux */}
            <div className="text-right">
              <p className="text-2xl font-bold uppercase leading-tight tracking-tight text-amber-400 drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)] md:text-4xl lg:text-5xl">
                Aucun équivalent
                <br />
                sur le marché.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === Zone narrative sous l'image — AXI présenté + CTA === */}
      <section className="bg-zinc-950 px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-5 md:gap-14">
          {/* Texte à gauche (3/5) */}
          <div className="md:col-span-3">
            <p className="text-base leading-relaxed text-zinc-200 md:text-lg">
              <span className="font-semibold text-amber-400">AXI</span> est une
              intelligence artificielle qui fait de votre site web son
              territoire. Dès qu&apos;il s&apos;installe, il déploie ses
              compétences{" "}
              <span className="font-semibold text-white">
                24 heures sur 24 et 7 jours sur 7
              </span>
              , en toute autonomie.
            </p>
            <p className="mt-5 text-base leading-relaxed text-zinc-300 md:text-lg">
              Il accueille et gère les demandes de vos visiteurs, puis les
              transforme en contacts qualifiés pour vos équipes de vente. Il
              travaille aussi votre référencement pour vous faire monter dans
              les résultats de recherche, et vous remet des comptes-rendus
              réguliers sur ses performances.
            </p>
            <p className="mt-5 text-base leading-relaxed text-zinc-300 md:text-lg">
              Et ce n&apos;est pas tout : il se comporte en{" "}
              <span className="font-semibold text-white">
                gardien actif de votre site
              </span>
              , en surveillant en permanence tout ce qui pourrait le menacer.
            </p>
            <p className="mt-6 text-lg font-medium italic leading-snug text-amber-300 md:text-xl">
              Et si vous le laissiez vous expliquer tout ça lui-même ?
            </p>
          </div>

          {/* Bouton à droite (2/5) */}
          <div className="flex flex-col items-start gap-4 md:col-span-2 md:items-center md:justify-center">
            <BoutonLancerAxiSolver libelle="Parlez à AxiSolver" />
            <p className="text-xs text-zinc-500">
              Vocal ou écrit, dans votre langue.
            </p>
          </div>
        </div>
      </section>

      {/* === Les 6 missions === */}
      <section className="bg-zinc-900 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-950">
              Les six missions
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Un seul AxiSolver,
              <br className="hidden md:block" />
              <span className="text-amber-400"> six services simultanés</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-zinc-300">
              La métamorphose de votre présence en ligne, dans un seul produit
              indivisible. Pas de version Lite. Pas de pack à composer. Juste
              AxiSolver, qui fait tout.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            {MISSIONS.map((m) => (
              <article
                key={m.numero}
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 p-7 transition-all hover:border-amber-400/40 hover:bg-zinc-950 hover:shadow-lg hover:shadow-amber-400/5"
              >
                <div className="flex items-start gap-5">
                  <div className="flex flex-col items-center gap-2">
                    <m.Icon className="h-7 w-7 text-amber-400" />
                    <div className="font-mono text-xs tracking-wider text-zinc-500 group-hover:text-amber-300">
                      {m.numero}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold text-white">
                        {m.titre}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                          m.avenir
                            ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                            : "border-zinc-700 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {m.mode}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                      {m.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-3xl text-center text-sm italic leading-relaxed text-zinc-400">
            «&nbsp;AxiSolver, c&apos;est la caissière, le vigile, le consultant
            SEO, l&apos;analyste trafic, le média buyer et le garde du
            corps numérique. Un seul produit, six missions, un seul
            tarif.&nbsp;»
          </div>
        </div>
      </section>

      {/* === Features signature === */}
      <section className="bg-zinc-950 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-950">
              Features signature
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Ce qui n&apos;existe
              <span className="text-amber-400"> nulle part ailleurs</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-zinc-300">
              Quatre singularités qui placent AxiSolver dans une catégorie à
              part. Pas une version améliorée du chatbot. Un produit nouveau.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {FEATURES_SIGNATURE.map((f) => (
              <article
                key={f.titre}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7 transition-all hover:border-amber-400/40 hover:bg-zinc-900 hover:shadow-lg hover:shadow-amber-400/5"
              >
                <f.Icon className="h-8 w-8 text-amber-400" />
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {f.titre}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  {f.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* === Comparatif chatbot vs AxiSolver === */}
      <section className="bg-zinc-900 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-950">
              Comparaison
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Chatbot classique vs AxiSolver
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-300">
              Les chatbots filtrent et bloquent. AxiSolver résout, veille et
              transforme.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-sm border border-zinc-800">
            <div className="grid grid-cols-12 bg-zinc-950 px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
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
                <div className="font-semibold text-amber-300 md:col-span-4">
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

      {/* === CTA final === */}
      <section className="bg-zinc-950 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Prêt à transformer
            <br />
            votre présence en ligne ?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">
            Rencontrez AXI sur AxiHub. Il décompose les packs, répond à vos
            questions, prend votre souscription en direct.
          </p>
          <div className="mt-10">
            <a
              href="https://axihub.live"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:shadow-amber-400/40"
            >
              Composez votre équipe sur AxiHub
              <span aria-hidden>→</span>
            </a>
          </div>
          <p className="mt-10 text-xs italic text-zinc-400">
            « AxiSolver parle avec vos visiteurs. Veille sur votre site.
            Travaille à côté de vous. Et sait aussi s&apos;amuser. »
          </p>
        </div>
      </section>

      {/* === Footer === */}
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
