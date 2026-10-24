import Image from "next/image";
import { ChatWidget } from "@/components/chat/chat-widget";

const MISSIONS: Array<{
  numero: string;
  titre: string;
  description: string;
  mode: string;
}> = [
  {
    numero: "01",
    titre: "Accueille vos visiteurs",
    description:
      "24h/24, en voix et à l'écrit, dans toutes les langues européennes. Comprend, résout, qualifie, transmet un dossier chaud à votre équipe. Pas un chatbot — un AXI éduqué sur votre métier.",
    mode: "En continu",
  },
  {
    numero: "02",
    titre: "Veille sur votre SEO",
    description:
      "À l'installation, audit on-page complet. Chaque semaine, re-check des indicateurs clés. Chaque mois, rapport narratif de ce qui marche et de ce qui coince.",
    mode: "Initial + hebdomadaire",
  },
  {
    numero: "03",
    titre: "Veille sur votre sécurité",
    description:
      "Audit sécurité à l'installation : failles, CVE actives, plugins obsolètes, headers manquants. Monitoring continu. Alerte immédiate si régression détectée.",
    mode: "Initial + continu",
  },
  {
    numero: "04",
    titre: "Lit vos métriques pour vous",
    description:
      "Connecté à votre Analytics, AxiSolver lit vos chiffres chaque mois et vous les raconte en langage humain. Pages de fuite, parcours brisés, moments de bascule.",
    mode: "Mensuel",
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
    solver: "Audit SEO + sécurité + métriques, inclus par défaut.",
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
  emoji: string;
  titre: string;
  description: string;
}> = [
  {
    emoji: "🪞",
    titre: "Interface vivante",
    description:
      "Vos visiteurs ne parlent plus à une boîte noire. Pendant la conversation, ils voient leur fiche se remplir, tapent leur email de leur main, confirment leur demande. Fin du « allô, vous m'avez noté ? ».",
  },
  {
    emoji: "📋",
    titre: "Rapport triple-voie",
    description:
      "Chaque faille détectée vient avec trois solutions : « faire par une agence » (avec partenaire recommandé), « faire vous-même » (si vous avez un dev), ou méthode pas-à-pas détaillée pour la faire soi-même en 15 minutes.",
  },
  {
    emoji: "🧐",
    titre: "Quatre missions, un tarif",
    description:
      "Accueil + SEO + Sécurité + Métriques dans un seul produit. Vos concurrents paient quatre prestataires différents. Vous, un seul.",
  },
  {
    emoji: "🎯",
    titre: "Et sait aussi s'amuser",
    description:
      "À la fin d'une conversation résolue, AxiSolver propose parfois une partie de morpion. Les grandes idées se diffusent par les détails inattendus.",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* === Hero : identité centrée en haut + triptyque pleine largeur en dessous === */}
      <section className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 md:py-12">
        {/* Identité (en haut) */}
        <div className="mx-auto max-w-4xl text-center">
          <Image
            src="/logo-axisolver.png"
            alt="AxiSolver"
            width={520}
            height={520}
            priority
            className="mx-auto h-auto w-32 md:w-40 lg:w-48"
          />

          <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
            Un seul produit.{" "}
            <span className="text-blue-600">Quatre missions.</span>{" "}
            Zéro équivalent au monde.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            AxiSolver parle avec vos visiteurs. Veille sur votre site.
            Travaille à côté de vous. Et sait aussi s&apos;amuser.
          </p>

          <div className="mt-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-medium">
                AxiSolver vous attend — parlez-lui maintenant
              </span>
            </span>
          </div>
        </div>

        {/* Call-to-action vers le bouton flottant — le vrai widget vit
            désormais en overlay (pastille mascotte en bas à droite). */}
        <div className="mt-12 flex justify-center md:mt-16">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </span>
            AxiSolver vous attend —&nbsp;
            <span className="font-medium text-slate-900">
              cliquez sur la pastille en bas à droite
            </span>
          </div>
        </div>
      </section>

      {/* === Les 4 missions === */}
      <section className="bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-blue-700">
              Les quatre missions
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
              Un seul AxiSolver,
              <br className="hidden md:block" />
              <span className="text-blue-600"> quatre services simultanés</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-slate-600">
              La métamorphose de votre présence en ligne, dans un seul produit
              indivisible. Pas de version Lite. Pas de pack à composer. Juste
              AxiSolver, qui fait tout.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            {MISSIONS.map((m) => (
              <article
                key={m.numero}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-7 transition-all hover:border-blue-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start gap-5">
                  <div className="font-mono text-5xl font-light text-blue-600/80 group-hover:text-blue-600">
                    {m.numero}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {m.titre}
                      </h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                        {m.mode}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {m.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-3xl text-center text-sm italic leading-relaxed text-slate-500">
            «&nbsp;AxiSolver, c&apos;est la caissière, le vigile, le consultant
            SEO et l&apos;analyste trafic. Un seul produit, quatre missions, un
            seul tarif.&nbsp;»
          </div>
        </div>
      </section>

      {/* === Features signature === */}
      <section className="bg-slate-50 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-blue-700">
              Features signature
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
              Ce qui n&apos;existe
              <span className="text-blue-600"> nulle part ailleurs</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-slate-600">
              Quatre singularités qui placent AxiSolver dans une catégorie à
              part. Pas une version améliorée du chatbot. Un produit nouveau.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {FEATURES_SIGNATURE.map((f) => (
              <article
                key={f.titre}
                className="rounded-2xl border border-slate-200 bg-white p-7 transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="text-3xl">{f.emoji}</div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {f.titre}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {f.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* === Comparatif chatbot vs AxiSolver === */}
      <section className="bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-blue-700">
              Comparaison
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              Chatbot classique vs AxiSolver
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Les chatbots filtrent et bloquent. AxiSolver résout, veille et
              transforme.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-sm border border-slate-200">
            <div className="grid grid-cols-12 bg-slate-50 px-6 py-4 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              <div className="col-span-4">Dimension</div>
              <div className="col-span-4">Chatbot classique</div>
              <div className="col-span-4">AxiSolver</div>
            </div>
            {COMPARATIF.map((row, i) => (
              <div
                key={row.dimension}
                className={`grid grid-cols-1 gap-4 bg-white px-6 py-5 md:grid-cols-12 md:gap-6 ${
                  i !== 0 ? "border-t border-slate-100" : ""
                }`}
              >
                <div className="font-medium text-slate-900 md:col-span-4">
                  {row.dimension}
                </div>
                <div className="text-sm text-slate-500 md:col-span-4">
                  {row.chatbot}
                </div>
                <div className="text-sm text-slate-900 md:col-span-4">
                  {row.solver}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA final === */}
      <section className="bg-slate-900 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Prêt à transformer
            <br />
            votre présence en ligne ?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            Rencontrez AXI sur AxiHub. Il décompose les packs, répond à vos
            questions, prend votre souscription en direct.
          </p>
          <div className="mt-10">
            <a
              href="https://axihub.live"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium uppercase tracking-[0.14em] text-slate-900 transition-all hover:bg-blue-50"
            >
              Composez votre équipe sur AxiHub
              <span aria-hidden>→</span>
            </a>
          </div>
          <p className="mt-10 text-xs italic text-slate-500">
            « AxiSolver parle avec vos visiteurs. Veille sur votre site.
            Travaille à côté de vous. Et sait aussi s&apos;amuser. »
          </p>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="border-t border-slate-200 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <div>
            Édité par{" "}
            <a
              href="https://ataraxis.group"
              className="font-medium text-slate-900 hover:text-blue-600"
            >
              Ataraxis Studio
            </a>
            {" — groupe Ataraxis"}
          </div>
          <div className="flex gap-6">
            <a href="https://axihub.live" className="hover:text-blue-600">
              AxiHub
            </a>
            <a
              href="https://ataraxis.group/mentions-legales"
              className="hover:text-blue-600"
            >
              Mentions légales
            </a>
          </div>
        </div>
      </footer>

      {/* Widget AxiSolver — pastille flottante + modal centré au clic.
          Monté en bout de page, se positionne via `fixed` partout. */}
      <ChatWidget />
    </main>
  );
}
