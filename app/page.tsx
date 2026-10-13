import Image from "next/image";
import { ChatWidget } from "@/components/chat/chat-widget";

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
    dimension: "Mémoire",
    chatbot: "Aucune, session à session.",
    solver: "Historique conservé, brief matinal à l'équipe.",
  },
  {
    dimension: "Mise en route",
    chatbot: "Plusieurs semaines de configuration.",
    solver: "Quelques heures : on nourrit AxiSolver avec votre site.",
  },
];

const CAPACITES: Array<{ titre: string; description: string }> = [
  {
    titre: "Conversation naturelle",
    description:
      "Tournures imprécises, demandes multiples, corrections en cours de dialogue — AxiSolver comprend la vraie intention.",
  },
  {
    titre: "Voix et écrit",
    description:
      "Push-to-talk mobile et desktop, dictée vocale, lecture TTS des réponses. Pour vos visiteurs qui préfèrent parler.",
  },
  {
    titre: "Garde-fous écrits à la main",
    description:
      "N'engage rien, ne signe rien, ne valide aucun prix. Propose et transmet, point.",
  },
  {
    titre: "Dossier qualifié, pas formulaire",
    description:
      "Quand il faut passer la main, votre équipe reçoit prénom, téléphone, résumé, niveau de chaleur. Pas un ticket vide.",
  },
  {
    titre: "Brief matinal",
    description:
      "Synthèse priorisée des conversations de la nuit, à l'écrit ou en vocal. Votre équipe arrive informée.",
  },
  {
    titre: "Mémoire de session",
    description:
      "Reconnaît un visiteur qui revient par email ou téléphone. L'historique est conservé, le contexte n'est jamais perdu.",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* === Hero : identité à gauche + chat live à droite === */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:items-center lg:gap-14">
          {/* Colonne gauche : logo + identité + punchline */}
          <div className="lg:col-span-3">
            <Image
              src="/logo-axisolver.png"
              alt="AxiSolver"
              width={520}
              height={520}
              priority
              className="h-auto w-56 md:w-72 lg:w-96"
            />

            <h1 className="mt-8 text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              Chatbots talk.
              <br />
              <span className="text-blue-600">AxiSolver</span> solves.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 md:text-xl">
              Le remplaçant des chatbots pour les entreprises qui veulent un
              accueil qui résout vraiment. 24h/24, en voix et à l&apos;écrit,
              directement dans votre site.
            </p>

            <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-medium">
                  AxiSolver est en ligne — parlez-lui maintenant
                </span>
              </span>
            </div>
          </div>

          {/* Colonne droite : chat live avec AxiSolver qui accueille */}
          <div className="lg:col-span-2">
            <ChatWidget />
          </div>
        </div>
      </section>

      {/* === Comparatif === */}
      <section className="bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
            Chatbot vs AxiSolver
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            Les chatbots traditionnels filtrent et bloquent. AxiSolver résout
            et transmet.
          </p>

          <div className="mt-12 overflow-hidden rounded-sm border border-slate-200">
            <div className="grid grid-cols-12 bg-slate-50 px-6 py-4 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              <div className="col-span-4">Dimension</div>
              <div className="col-span-4">Chatbot classique</div>
              <div className="col-span-4">AxiSolver</div>
            </div>
            {COMPARATIF.map((row, i) => (
              <div
                key={row.dimension}
                className={`grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-12 md:gap-6 ${
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

      {/* === Capacités === */}
      <section className="bg-slate-50 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
            Ce qu&apos;AxiSolver sait faire
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            Pas un chatbot. Pas un formulaire. Un AXI éduqué pour accueillir,
            résoudre et transmettre.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CAPACITES.map((cap) => (
              <article
                key={cap.titre}
                className="rounded-sm border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {cap.titre}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {cap.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA final === */}
      <section className="bg-slate-900 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Prêt à remplacer votre chatbot ?
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
    </main>
  );
}
