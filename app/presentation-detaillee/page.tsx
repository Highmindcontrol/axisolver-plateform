import type { Metadata } from "next";
import Link from "next/link";
import { ChatWidget } from "@/components/chat/chat-widget";
import { SiteHeader } from "@/components/site/header";
import { BoutonLancerAxiSolver } from "@/components/chat/bouton-lancer";

export const metadata: Metadata = {
  title: "Présentation détaillée — AxiSolver",
  description:
    "Tout ce qu'AxiSolver fait, pourquoi il n'est pas un chatbot, comment il s'installe, comment il protège votre site, et ce qu'il ne fait jamais.",
};

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

const MISSIONS_DETAILLEES: Array<{
  numero: string;
  titre: string;
  pitch: string;
  bullets: string[];
  Icon: (p: IconProps) => React.JSX.Element;
  avenir?: boolean;
}> = [
  {
    numero: "01",
    titre: "Accueil visiteur 24 heures sur 24 et 7 jours sur 7",
    pitch:
      "AxiSolver prend la parole dès qu'un visiteur arrive. En voix ou à l'écrit, dans toutes les langues européennes.",
    bullets: [
      "Comprend la vraie demande (pas juste des mots-clés)",
      "Résout seul la majorité des demandes récurrentes",
      "Transmet un dossier qualifié à votre équipe quand c'est nécessaire (prénom, téléphone, email, résumé, niveau d'urgence)",
      "Reconnaît un visiteur qui revient (sans profil psychologique durable)",
      "Fermeture de ticket avec référence AXI-XXXX copiable",
    ],
    Icon: IconChat,
  },
  {
    numero: "02",
    titre: "Veille SEO passive",
    pitch:
      "À l'installation, AxiSolver audite votre site de A à Z. Puis il remet un rapport honnête chaque mois.",
    bullets: [
      "Audit on-page initial complet (balises, structure, maillage, images)",
      "Re-check hebdomadaire des indicateurs clés",
      "Rapport mensuel narratif, en langage humain",
      "Chaque faille vient avec trois solutions : agence partenaire, voie dev interne, méthode pas-à-pas 15 minutes",
    ],
    Icon: IconSearch,
  },
  {
    numero: "03",
    titre: "Veille sécurité passive",
    pitch:
      "AxiSolver surveille votre site comme un ingénieur sécurité qui regarde par-dessus votre épaule.",
    bullets: [
      "Scan sécurité à l'installation : failles, CVE actives, plugins obsolètes, headers manquants",
      "Monitoring continu",
      "Alerte immédiate si régression détectée",
      "Chaque alerte accompagnée de la procédure de correction",
    ],
    Icon: IconShield,
  },
  {
    numero: "04",
    titre: "Veille Analytics narrative",
    pitch:
      "Connecté à votre Google Analytics ou Plausible, AxiSolver lit vos chiffres et vous les raconte en français.",
    bullets: [
      "Pages de fuite identifiées (où les visiteurs quittent)",
      "Parcours brisés (où ils s'arrêtent avant la conversion)",
      "Moments de bascule mois après mois",
      "Pas de dashboard cryptique à décoder : une narration claire",
    ],
    Icon: IconBarChart,
  },
  {
    numero: "05",
    titre: "SEO et Ads intelligents",
    pitch:
      "AxiSolver prépare vos campagnes AdWords et AdSense directement sur votre compte Google Ads. Vous validez d'un clic. Il ne touche jamais à votre budget sans votre feu vert explicite.",
    bullets: [
      "Suit les mots-clés les plus tapés par vos visiteurs",
      "Repère les requêtes à faible concurrence (longue traîne)",
      "Produit des recommandations SEO concrètes (balises, structure, maillage, contenu à produire)",
      "Prépare les groupes d'annonces AdWords (mots-clés, enchères suggérées, textes d'annonce)",
      "Prépare les emplacements AdSense (optimisation revenus publicitaires)",
      "Garde-fou absolu : aucune dépense sans validation humaine depuis votre dashboard",
      "Option « carte blanche » après 90 jours de validation réussie, dans un budget que vous plafonnez",
    ],
    Icon: IconTarget,
  },
  {
    numero: "06",
    titre: "Bouclier défensif actif",
    pitch:
      "AxiSolver se comporte comme un antivirus pour votre site. Il bloque, il détecte, il alerte.",
    bullets: [
      "Détection temps réel des patterns malveillants (prompt injection sur le chat, bots agressifs, scraping, comportements anormaux)",
      "Blocage immédiat côté widget — le visiteur hostile n'arrive même pas à vous atteindre",
      "Côté serveur, si vous donnez accès à vos logs : détection des tentatives d'intrusion (bruteforce, SQL injection, path traversal)",
      "Alerte en langage humain : « Hier à 3h47, 847 tentatives de login sur /admin depuis 12 IPs — voulez-vous que je les bloque ? »",
      "Après validation, règles de blocage exécutées en autonomie",
      "Preuve de propriété DNS requise avant toute action côté serveur",
    ],
    Icon: IconShieldCheck,
  },
];

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

const DOCTRINE = [
  {
    titre: "Obligation de moyens, pas de résultat",
    detail:
      "AxiSolver s'engage sur la qualité d'exécution et la vigilance continue. Jamais sur un classement SEO précis ni sur une absence totale de failles. Google reste souverain sur les enchères et les classements, les attaquants évoluent chaque jour.",
  },
  {
    titre: "Honnêteté absolue sur les audits",
    detail:
      "AxiSolver cite les positions exactes qu'il mesure. Pas d'arrondi, pas d'enjolivement, pas d'invention. Si une requête n'est pas classée dans les 20 premiers résultats, il le dit sans détour. Si une erreur d'audit lui est signalée, il reconnaît et refait — jamais de minimisation.",
  },
  {
    titre: "Validation humaine systématique",
    detail:
      "Toute action qui engage de l'argent (campagnes publicitaires) ou qui modifie votre site activement (règles de blocage de sécurité) passe par un bouton Valider dans votre dashboard. AxiSolver prépare, vous décidez.",
  },
  {
    titre: "Interface vivante, pas une boîte noire",
    detail:
      "Vos visiteurs voient leur fiche se remplir au fil de la conversation. Ils tapent leur email de leur main. Ils confirment leur demande. Fin du « allô, vous m'avez noté ? ».",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />

      {/* ─────────── HERO ─────────── */}
      <section className="border-b border-zinc-900 bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-amber-300"
          >
            <span aria-hidden>←</span> Retour
          </Link>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Présentation détaillée
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
            Tout ce qu&apos;AxiSolver fait,{" "}
            <span className="text-amber-400">
              et tout ce qu&apos;il ne fait pas.
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Un seul produit, six missions, une doctrine stricte. Ici,
            pas de promesse marketing — le détail de chaque capacité,
            de chaque ligne rouge, de chaque garde-fou.
          </p>
        </div>
      </section>

      {/* ─────────── 6 MISSIONS DÉTAILLÉES ─────────── */}
      <section className="bg-zinc-900 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Les six missions
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              Les six capacités d&apos;AxiSolver,{" "}
              <span className="text-amber-400">en détail.</span>
            </h2>
          </div>

          <div className="space-y-16">
            {MISSIONS_DETAILLEES.map((m) => (
              <article
                key={m.numero}
                className="border-t border-zinc-800 pt-10"
              >
                <div className="flex items-start gap-6">
                  <m.Icon className="mt-1 h-10 w-10 flex-shrink-0 text-amber-400" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-mono text-xs font-medium tracking-widest text-zinc-500">
                        {m.numero}
                      </span>
                      <h3 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                        {m.titre}
                      </h3>
                      {m.avenir && (
                        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-300">
                          À venir
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-base leading-relaxed text-zinc-300 md:text-lg">
                      {m.pitch}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {m.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300 md:text-base"
                        >
                          <svg
                            className="mt-1 h-4 w-4 flex-shrink-0 text-amber-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="m5 12 5 5L20 7" />
                          </svg>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── INTERFACE ─────────── */}
      <section className="bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Interface
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              Une interface immersive et moderne,{" "}
              <span className="text-amber-400">
                pensée pour la concentration.
              </span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Oubliez la petite bulle de chat perdue dans un coin.
              Quand un visiteur ouvre AxiSolver, il entre dans un
              véritable espace de dialogue — centré, calme, cadré.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Et cette interface est{" "}
              <span className="font-semibold text-white">
                entièrement paramétrable
              </span>{" "}
              à votre identité : votre logo, vos couleurs, vos
              questions d&apos;accueil, le ton de voix. Un vrai
              habillage sur-mesure, posé avec vous{" "}
              <span className="font-semibold text-amber-300">
                pendant la session de réglage avant mise en ligne.
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Un modal centré, pas une bulle de coin
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                AxiSolver s&apos;ouvre en plein cœur de la page, dans
                un cadre généreux. Fini le petit chat tassé en bas à
                droite que personne ne lit. Le visiteur est au centre
                de l&apos;attention — comme face à un interlocuteur
                qui prend le temps.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Trois écrans qui dialoguent entre eux
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                À gauche, le panneau d&apos;action. Au centre, la
                conversation. À droite, la fiche visiteur qui se
                remplit en direct. Trois territoires qui bougent
                ensemble au rythme de l&apos;échange, sans jamais se
                marcher dessus.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Fond aurore boréale apaisant
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Pas d&apos;autoplay vidéo, pas de bannière agressive,
                pas d&apos;animation qui fatigue. Juste un fond qui
                respire — des voiles de couleur qui glissent très
                lentement, pensés pour ne pas distraire. Un
                environnement sombre et doux qui met en avant les
                mots et les visages.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Voix ou écrit, au choix du visiteur
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Un bouton micro pour parler, un clavier pour écrire.
                AxiSolver bascule naturellement entre les deux. Il
                lit ses réponses à voix haute si le visiteur le
                souhaite, dans une voix neuronale française
                professionnelle.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Des options cliquables pour démarrer
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                À l&apos;ouverture, quatre à six phrases
                pré-rédigées sont proposées. Le visiteur hésitant
                clique sur celle qui lui correspond et la
                conversation démarre. Les options sont
                paramétrables par vous — vos propres accroches, pour
                votre propre métier.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Boutons de validation, pas de saisie forcée
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Pour chaque question fermée (oui ou non, choix d&apos;option,
                validation d&apos;une proposition), AxiSolver affiche
                des boutons cliquables. Le visiteur ne tape jamais ce
                qui peut se dire d&apos;un clic. Email et téléphone
                saisis dans des champs lisibles — jamais dictés à
                voix haute pour éviter les erreurs.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                La fiche visiteur se remplit en direct
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Prénom, secteur, demande, contexte, urgence
                apparaissent dans l&apos;ailette droite au fil de la
                conversation. Le visiteur voit ce qu&apos;AxiSolver
                retient, en toute transparence. Fin de la boîte noire.
                Fin du « allô, vous m&apos;avez noté ? ».
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Clôture propre, sans spam
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                À la fin, la fenêtre se ferme en douceur. Pas de pop-up
                de relance, pas de « êtes-vous sûr », pas de newsletter
                à cocher. Si le visiteur veut recevoir le compte-rendu
                par email, il le dit — AxiSolver le lui envoie.
              </p>
            </article>

            <article className="border-t border-amber-400/40 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Votre logo, vos couleurs, vos questions d&apos;accueil
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                L&apos;interface se pare de votre identité visuelle :
                logo posé dans l&apos;en-tête, teinte dominante de
                marque sur les éléments actifs, questions
                d&apos;ouverture rédigées pour votre métier. Chaque
                visiteur reconnaît votre maison dès la première
                seconde — AxiSolver est{" "}
                <span className="text-white">votre</span> accueil, pas
                un chatbot générique posé à côté.
              </p>
            </article>

            <article className="border-t border-amber-400/40 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Session de réglage dédiée avant mise en ligne
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Avant la pose du script sur votre site, nous passons
                une session ensemble — logo, couleurs, questions
                d&apos;accueil, choix de voix, personnalité
                conversationnelle, lignes rouges métier. AxiSolver est
                nourri avec vos documents, vos pages produits, vos
                procédures internes. Il n&apos;est jamais déployé
                brut — il arrive sur votre site{" "}
                <span className="text-white">déjà réglé pour vous.</span>
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ─────────── LES 6 LIGNES ROUGES ─────────── */}
      <section className="bg-zinc-900 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Les six lignes rouges
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              Ce qu&apos;AxiSolver{" "}
              <span className="text-amber-400">ne fait jamais.</span>
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

          <div className="space-y-10">
            {DOCTRINE.map((d) => (
              <article
                key={d.titre}
                className="border-t border-zinc-800 pt-6"
              >
                <h3 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                  {d.titre}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300 md:text-base">
                  {d.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── INSTALLATION ─────────── */}
      <section className="bg-zinc-900 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Installation
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              Deux chemins pour l&apos;installer.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Chemin recommandé — 80 % des cas
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">
                Souscription directe sur axisolver.app
              </h3>
              <ol className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-300 md:text-base">
                <li>
                  <span className="font-mono text-amber-400">1.</span>{" "}
                  Choix de votre formule et volumétrie sur la page
                  paramétrage et tarifs
                </li>
                <li>
                  <span className="font-mono text-amber-400">2.</span>{" "}
                  AXI d&apos;onboarding vous interroge 15 à 30
                  minutes à l&apos;oral ou à l&apos;écrit : métier,
                  ton, services, sujets sensibles
                </li>
                <li>
                  <span className="font-mono text-amber-400">3.</span>{" "}
                  AXI parcourt votre site public, vos documents, vos
                  CGV, votre FAQ, apprend votre métier
                </li>
                <li>
                  <span className="font-mono text-amber-400">4.</span>{" "}
                  Vous récupérez un snippet JavaScript à coller dans
                  le head de votre site (3 lignes, comme Google
                  Analytics)
                </li>
                <li>
                  <span className="font-mono text-amber-400">5.</span>{" "}
                  AxiSolver prend la parole dès le premier visiteur
                </li>
              </ol>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Chemin accompagné — projets complexes
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
                  Intégration dédiée (branchement CRM, SSO, outils
                  métier, flux spécifiques)
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

      {/* ─────────── PROTOCOLE DUO ─────────── */}
      <section className="bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Protocole Duo
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              Si vous avez aussi un AXI maison,{" "}
              <span className="text-amber-400">ils se parlent.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Quand votre entreprise a adopté l&apos;écosystème AXI
              complet via AxiHub, AxiSolver se branche en Duo avec
              votre AXI maison. Deux cercles qui se recouvrent, pas
              un cercle qui s&apos;agrandit.
            </p>
          </div>

          <ul className="space-y-5 text-sm leading-relaxed text-zinc-300 md:text-base">
            <li className="border-t border-zinc-800 pt-5">
              <strong className="text-white">
                Interrogation en direct
              </strong>{" "}
              — « Un visiteur demande livraison samedi, as-tu capacité
              ? » Votre AXI maison répond. AxiSolver reformule au
              visiteur.
            </li>
            <li className="border-t border-zinc-800 pt-5">
              <strong className="text-white">
                Délégation d&apos;action
              </strong>{" "}
              — prise de RDV réel, envoi de mail de suivi, création
              de devis. Votre AXI maison agit avec son autorité.
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
              votre AXI maison avant diffusion au visiteur.
            </li>
            <li className="border-t border-zinc-800 pt-5">
              <strong className="text-white">
                Debriefing bidirectionnel
              </strong>{" "}
              — AxiSolver apprend comment ses tickets ont été traités.
            </li>
          </ul>
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
            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Un tableau de bord unique pour toute l&apos;entreprise
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Vous accédez à votre back office AxiSolver depuis
                n&apos;importe quel navigateur. Vue d&apos;ensemble
                du mois en cours, visiteurs reçus, tickets ouverts,
                tickets fermés, interlocuteurs sollicités. Un seul
                endroit pour tout voir.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Paramétrage sans ligne de code
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Le ton, les options d&apos;accueil cliquables, les
                sujets sensibles à éviter, la voix, les langues
                acceptées — tout se règle depuis une interface
                visuelle. Les modifications sont actives
                immédiatement sur votre site, sans redéploiement.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Vous définissez votre équipe et leurs périmètres
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Ajoutez vos collaborateurs, précisez le périmètre de
                chacun (commercial, support, SAV, direction,
                comptabilité). AxiSolver connaît votre
                organigramme et sait vers qui pousser chaque dossier.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Routage intelligent des alertes
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Chaque ticket est classé par thème (devis, SAV,
                technique, administratif, carrière…), par urgence
                (froid / tiède / chaud / urgent) et dirigé vers le
                bon interlocuteur. Un visiteur furieux d&apos;un bug
                de livraison ? Alerte immédiate à votre
                responsable logistique. Un prospect chaud sur un gros
                projet ? Mail au commercial dédié avec le dossier
                complet.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Journal consultable de chaque conversation
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Toutes les conversations sont archivées, consultables
                par mot-clé, par thème, par date ou par
                interlocuteur. Vous pouvez relire une interaction
                six mois après, voir ce qui a été dit et promis,
                comprendre pourquoi un lead n&apos;a pas été
                converti.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Modes de notification au choix
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Email, SMS, notification push, appel vocal — à vous
                de dire comment chacun de vos collaborateurs
                souhaite être alerté selon le niveau d&apos;urgence.
                Un responsable commercial reçoit un SMS pour un lead
                chaud, un mail pour un froid, une alerte
                hebdomadaire pour les tièdes.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Rapports hebdomadaires et mensuels téléchargeables
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Chaque semaine, chaque mois, votre rapport
                d&apos;activité est généré automatiquement : volume
                de conversations, taux de résolution autonome,
                tickets transmis, résultats de la veille SEO, alertes
                sécurité, lecture Analytics. Format PDF prêt à
                partager en comité.
              </p>
            </article>

            <article className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Intégration avec vos outils existants
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                CRM, logiciel de ticketing, boîte mail partagée,
                calendrier — AxiSolver se branche sur ce qui existe
                déjà chez vous. Pas besoin de migrer vos équipes
                vers un nouvel outil. Les tickets qualifiés
                atterrissent là où vos collaborateurs ont déjà
                leurs habitudes de travail.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ─────────── FAMILLE AXI ─────────── */}
      <section className="bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-4xl">
          <aside className="rounded-2xl border-l-4 border-amber-400 border-y border-r border-zinc-800 bg-zinc-900/60 p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Famille AXI
            </p>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              AxiSolver fait partie de la famille des applications{" "}
              <span className="text-amber-400">AXI</span>.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-200 md:text-lg">
              AxiSolver se vend et se gère directement ici, sur son
              propre site. Vous souscrivez, vous paramétrez, vous
              pilotez. Point.
            </p>
            <p className="mt-4 text-base leading-relaxed text-zinc-300 md:text-lg">
              On le retrouve également sur{" "}
              <a
                href="https://axihub.live"
                className="font-semibold text-amber-300 underline-offset-4 hover:underline"
              >
                AxiHub
              </a>
              , le hub de l&apos;écosystème AXI, pour les entreprises
              qui veulent l&apos;écosystème complet — AxiSolver y
              apparaît alors en Duo avec un AXI maison, un AXI
              commercial, un AXI assistant, et toutes les autres
              briques d&apos;intelligence disponibles à la carte.
            </p>
          </aside>
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
