import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Eye,
  History,
  LayoutDashboard,
  MousePointerClick,
  Plug,
  Route,
  Scale,
  Sliders,
  Users,
} from "lucide-react";
import { ChatWidget } from "@/components/chat/chat-widget";
import { SiteHeader } from "@/components/site/header";
import { BoutonLancerAxiSolver } from "@/components/chat/bouton-lancer";
import { SliderMissions } from "./_slider-missions";

type IconType = typeof Scale;

export const metadata: Metadata = {
  title: "Présentation détaillée — AxiSolver",
  description:
    "Tout ce qu'AxiSolver fait, pourquoi il n'est pas un chatbot, comment il s'installe, comment il protège votre site, et ce qu'il ne fait jamais.",
};

const LIGNES_ROUGES = [
  {
    titre: "N'engage rien, ne signe rien",
    detail:
      "Pas de prix fermes, pas de dates confirmées, pas de validation de commande, pas de SAV litigieux. AxiSolver propose et transmet — c'est tout.",
  },
  {
    titre: "Scope strict à votre entreprise",
    detail:
      "Les questions hors sujet sont renvoyées avec gentillesse. AxiSolver ne devient pas un chatbot généraliste.",
  },
  {
    titre: "Pas d'actions dans vos outils internes",
    detail:
      "Pas d'agenda, pas de mails, pas d'écriture dans votre CRM ou votre Pennylane. Il accueille, résume, transmet. Les actions passent par votre AXI maison (via AxiHub) ou votre équipe humaine.",
  },
  {
    titre: "Mémoire opérationnelle, pas personnelle",
    detail:
      "Il reconnaît un visiteur qui revient grâce à son email ou son téléphone, mais ne construit pas de profil psychologique durable.",
  },
  {
    titre: "Pas de rôle organisationnel",
    detail:
      "AxiSolver ne pilote pas d'équipe, ne gère pas de KPI business. Son brief matinal est limité aux tickets qu'il a lui-même générés la veille.",
  },
  {
    titre: "Conversation courte, orientée résolution",
    detail:
      "3 à 5 messages puis fermeture avec référence AXI-XXXX. L'objectif est de résoudre, pas de bavarder.",
  },
];

const DOCTRINE: Array<{ titre: string; detail: string; Icon: IconType }> = [
  {
    titre: "Obligation de moyens, pas de résultat",
    Icon: Scale,
    detail:
      "AxiSolver s'engage sur la qualité d'exécution et la vigilance continue. Jamais sur un classement SEO précis ni sur une absence totale de failles. Google reste souverain sur les enchères et les classements, les attaquants évoluent chaque jour.",
  },
  {
    titre: "Honnêteté absolue sur les audits",
    Icon: BadgeCheck,
    detail:
      "AxiSolver cite les positions exactes qu'il mesure. Pas d'arrondi, pas d'enjolivement, pas d'invention. Si une requête n'est pas classée dans les 20 premiers résultats, il le dit sans détour. Si une erreur d'audit lui est signalée, il reconnaît et refait — jamais de minimisation.",
  },
  {
    titre: "Validation humaine systématique",
    Icon: MousePointerClick,
    detail:
      "Toute action qui engage de l'argent (campagnes publicitaires) ou qui modifie votre site activement (règles de blocage de sécurité) passe par un bouton Valider dans votre dashboard. AxiSolver prépare, vous décidez.",
  },
  {
    titre: "Interface vivante, pas une boîte noire",
    Icon: Eye,
    detail:
      "Vos visiteurs voient leur fiche se remplir au fil de la conversation. Ils tapent leur email de leur main. Ils confirment leur demande. Fin du « allô, vous m'avez noté ? ».",
  },
];

const BACK_OFFICE: Array<{ titre: string; detail: string; Icon: IconType }> = [
  {
    titre: "Un tableau de bord unique pour toute l'entreprise",
    Icon: LayoutDashboard,
    detail:
      "Vous accédez à votre back office AxiSolver depuis n'importe quel navigateur. Vue d'ensemble du mois en cours, visiteurs reçus, tickets ouverts, tickets fermés, interlocuteurs sollicités. Un seul endroit pour tout voir.",
  },
  {
    titre: "Paramétrage sans ligne de code",
    Icon: Sliders,
    detail:
      "Le ton, les options d'accueil cliquables, les sujets sensibles à éviter, la voix, les langues acceptées — tout se règle depuis une interface visuelle. Les modifications sont actives immédiatement sur votre site, sans redéploiement.",
  },
  {
    titre: "Vous définissez votre équipe et leurs périmètres",
    Icon: Users,
    detail:
      "Ajoutez vos collaborateurs, précisez le périmètre de chacun (commercial, support, SAV, direction, comptabilité). AxiSolver connaît votre organigramme et sait vers qui pousser chaque dossier.",
  },
  {
    titre: "Routage intelligent des alertes",
    Icon: Route,
    detail:
      "Chaque ticket est classé par thème (devis, SAV, technique, administratif, carrière…), par urgence (froid / tiède / chaud / urgent) et dirigé vers le bon interlocuteur. Un visiteur furieux d'un bug de livraison ? Alerte immédiate à votre responsable logistique. Un prospect chaud sur un gros projet ? Mail au commercial dédié avec le dossier complet.",
  },
  {
    titre: "Journal consultable de chaque conversation",
    Icon: History,
    detail:
      "Toutes les conversations sont archivées, consultables par mot-clé, par thème, par date ou par interlocuteur. Vous pouvez relire une interaction six mois après, voir ce qui a été dit et promis, comprendre pourquoi un lead n'a pas été converti.",
  },
  {
    titre: "Modes de notification au choix",
    Icon: Bell,
    detail:
      "Email, SMS, notification push, appel vocal — à vous de dire comment chacun de vos collaborateurs souhaite être alerté selon le niveau d'urgence. Un responsable commercial reçoit un SMS pour un lead chaud, un mail pour un froid, une alerte hebdomadaire pour les tièdes.",
  },
  {
    titre: "Rapports hebdomadaires et mensuels téléchargeables",
    Icon: BarChart3,
    detail:
      "Chaque semaine, chaque mois, votre rapport d'activité est généré automatiquement : volume de conversations, taux de résolution autonome, tickets transmis, résultats de la veille SEO, alertes sécurité, lecture Analytics. Format PDF prêt à partager en comité.",
  },
  {
    titre: "Intégration avec vos outils existants",
    Icon: Plug,
    detail:
      "CRM, logiciel de ticketing, boîte mail partagée, calendrier — AxiSolver se branche sur ce qui existe déjà chez vous. Pas besoin de migrer vos équipes vers un nouvel outil. Les tickets qualifiés atterrissent là où vos collaborateurs ont déjà leurs habitudes de travail.",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />

      {/* ─────────── HERO court centré au-dessus du slider ─────────── */}
      <section className="bg-zinc-950 px-6 pb-16 pt-10 md:px-10 md:pb-24 md:pt-14">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-balance text-3xl font-semibold leading-[1.05] tracking-tight text-white md:text-4xl lg:text-5xl">
            Tout ce qu&apos;AxiSolver{" "}
            <span className="text-amber-400">fait pour vous.</span>
          </h1>
        </div>
      </section>

      {/* ─────────── Slider des missions principales ─────────── */}
      <SliderMissions />

      {/* ─────────── LES 6 LIGNES ROUGES ─────────── */}
      <section className="bg-zinc-900 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Les six lignes rouges
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              …et tout ce qu&apos;AxiSolver{" "}
              <span className="text-amber-400">ne fait pas.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              AxiSolver est éduqué pour la mission accueil visiteur.
              Il n&apos;est pas un AXI généraliste. Chaque limite
              ci-dessous est inscrite dans son prompt système.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
            {LIGNES_ROUGES.map((l, i) => (
              <article
                key={l.titre}
                className="border-t border-zinc-800 pt-6"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-medium tracking-widest text-zinc-500">
                    0{i + 1}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight text-white">
                    {l.titre}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                  {l.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── DOCTRINE ─────────── */}
      <section className="bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Doctrine
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              Quatre règles non négociables.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
            {DOCTRINE.map((d) => (
              <article
                key={d.titre}
                className="border-t border-zinc-800 pt-6"
              >
                <div className="flex items-start gap-4">
                  <d.Icon
                    className="mt-1 h-8 w-8 flex-shrink-0 text-amber-400"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                      {d.titre}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300 md:text-base">
                      {d.detail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── SI VOUS AVEZ DÉJÀ UN ASSISTANT AXI ─────────── */}
      <section className="bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Famille AXI
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              Si vous avez déjà un assistant AXI,{" "}
              <span className="text-amber-400">ils se parlent.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              AxiSolver fait partie de la famille des applications AXI.
              Quand votre entreprise a déjà adopté l&apos;écosystème AXI
              via{" "}
              <a
                href="https://axihub.live"
                className="font-semibold text-amber-300 underline-offset-4 hover:underline"
              >
                AxiHub
              </a>{" "}
              — un AXI assistant, un AXI commercial, un AXI maison —
              AxiSolver se branche en Duo. Deux cercles qui se
              recouvrent, pas un cercle qui s&apos;agrandit.
            </p>
          </div>

          <ul className="space-y-5 text-sm leading-relaxed text-zinc-300 md:text-base">
            <li className="border-t border-zinc-800 pt-5">
              <strong className="text-white">
                Interrogation en direct
              </strong>{" "}
              — « Un visiteur demande livraison samedi, as-tu capacité
              ? » Votre assistant AXI répond. AxiSolver reformule au
              visiteur.
            </li>
            <li className="border-t border-zinc-800 pt-5">
              <strong className="text-white">
                Délégation d&apos;action
              </strong>{" "}
              — prise de RDV réel, envoi de mail de suivi, création
              de devis. Votre assistant AXI agit avec son autorité.
              AxiSolver reste dans son scope accueil.
            </li>
            <li className="border-t border-zinc-800 pt-5">
              <strong className="text-white">
                Enrichissement contextuel
              </strong>{" "}
              — reconnaissance d&apos;un client existant, injection
              de son historique dans la conversation.
            </li>
            <li className="border-t border-zinc-800 pt-5">
              <strong className="text-white">
                Validation en deux temps
              </strong>{" "}
              — prix personnalisé ou délai spécifique validés par
              votre assistant AXI avant diffusion au visiteur.
            </li>
            <li className="border-t border-zinc-800 pt-5">
              <strong className="text-white">
                Debriefing bidirectionnel
              </strong>{" "}
              — AxiSolver apprend comment ses tickets ont été traités.
            </li>
          </ul>

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Pas encore d&apos;assistant AXI ? Pas de problème. AxiSolver
            se vend et se gère directement ici, de façon totalement
            autonome. Vous souscrivez, vous paramétrez, vous pilotez.
            Point.
          </p>
        </div>
      </section>

      {/* ─────────── CÔTÉ BACK OFFICE ─────────── */}
      <section className="bg-zinc-900 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Côté back office
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              Vous gardez la main.{" "}
              <span className="text-amber-400">
                Sans ligne de code.
              </span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              AxiSolver vit sur votre site, mais vous le pilotez
              depuis un tableau de bord dédié. Paramétrage, routage
              des alertes, consultation des conversations, rapports —
              tout se fait à la souris, par vous ou par qui vous
              désignez.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
            {BACK_OFFICE.map((b) => (
              <article
                key={b.titre}
                className="border-t border-zinc-800 pt-6"
              >
                <div className="flex items-start gap-4">
                  <b.Icon
                    className="mt-1 h-8 w-8 flex-shrink-0 text-amber-400"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-white">
                      {b.titre}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                      {b.detail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── CTA FINAL ─────────── */}
      <section className="bg-zinc-900 px-6 py-24 md:px-10 md:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
            Vous avez vu le détail.{" "}
            <span className="text-amber-400">La suite est à vous.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Parlez à AxiSolver maintenant pour tester, ou passez à
            la configuration et au tarif adapté à votre volume.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-5 md:flex-row">
            <BoutonLancerAxiSolver libelle="Parlez à AxiSolver" />
            <Link
              href="/parametrage-et-tarifs"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-amber-300 transition-colors hover:border-amber-400 hover:bg-amber-400/10 md:text-base"
            >
              Voir les tarifs
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

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
            <Link href="/" className="hover:text-amber-300">
              Accueil
            </Link>
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
