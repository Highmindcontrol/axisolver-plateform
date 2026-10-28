import Link from "next/link";
import {
  ArrowRight,
  Check,
  Minus,
  X,
  Target,
  ShieldCheck,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { ComparatifTarifaire } from "./_comparatif-tarifaire";

export const metadata = {
  title: "AxiSolver vs les chatbots classiques — Comparatif",
  description:
    "Pourquoi AxiSolver remplace Intercom, Crisp, Drift, Hubspot Chat et consorts. Comparatif honnête : prix, capacités, autonomie, maintenance.",
};

/**
 * Page comparatif publique — axisolver.app/comparatif
 *
 * Confronte AxiSolver aux solutions historiques du marché (Intercom,
 * Crisp, Drift, Hubspot Chat). Une page qui dit la vérité sur ce que
 * chaque solution fait vraiment, pas une page marketing qui dénigre les
 * autres gratuitement.
 *
 * V1 stub : grille comparative sommaire + CTA. Rédaction longue à
 * enrichir avec cas d'usage, témoignages, ROI chiffré.
 */

type Capability = {
  label: string;
  axisolver: boolean | "partiel";
  intercom: boolean | "partiel";
  crisp: boolean | "partiel";
  drift: boolean | "partiel";
  hubspot: boolean | "partiel";
};

const CAPABILITIES: Capability[] = [
  {
    label: "Vrai assistant IA (comprend et répond, pas juste des règles)",
    axisolver: true,
    intercom: "partiel",
    crisp: "partiel",
    drift: "partiel",
    hubspot: "partiel",
  },
  {
    label: "Ingestion automatique de votre site (crawl + PDF)",
    axisolver: true,
    intercom: false,
    crisp: false,
    drift: "partiel",
    hubspot: false,
  },
  {
    label: "Audit SEO + Shield sécurité intégrés",
    axisolver: true,
    intercom: false,
    crisp: false,
    drift: false,
    hubspot: false,
  },
  {
    label: "Préparation autonome de vos campagnes Ads (AdWords, AdSense)",
    axisolver: true,
    intercom: false,
    crisp: false,
    drift: false,
    hubspot: false,
  },
  {
    label: "Interface vivante : la fiche visiteur se remplit en direct",
    axisolver: true,
    intercom: false,
    crisp: false,
    drift: false,
    hubspot: false,
  },
  {
    label: "Résolution autonome : dossier qualifié, référence AXI générée",
    axisolver: true,
    intercom: "partiel",
    crisp: false,
    drift: "partiel",
    hubspot: "partiel",
  },
  {
    label: "Mémoire conversationnelle + brief matinal à votre équipe",
    axisolver: true,
    intercom: "partiel",
    crisp: false,
    drift: false,
    hubspot: "partiel",
  },
  {
    label: "Rapports quotidiens avec opportunités détectées",
    axisolver: true,
    intercom: "partiel",
    crisp: false,
    drift: "partiel",
    hubspot: "partiel",
  },
  {
    label: "Prix mensuel sans par-utilisateur ni par-conversation",
    axisolver: true,
    intercom: false,
    crisp: true,
    drift: false,
    hubspot: false,
  },
  {
    label: "Hébergement européen (RGPD natif, pas d'annexe US)",
    axisolver: true,
    intercom: false,
    crisp: true,
    drift: false,
    hubspot: false,
  },
  {
    label: "Installation en 30 secondes (GTM, WordPress, snippet)",
    axisolver: true,
    intercom: true,
    crisp: true,
    drift: true,
    hubspot: true,
  },
  {
    label: "Pas de « version Lite » amputée : tout inclus",
    axisolver: true,
    intercom: false,
    crisp: false,
    drift: false,
    hubspot: false,
  },
];

const EXCLUSIVITES: Array<{
  Icon: typeof ShieldCheck;
  titre: string;
  description: string;
  badge: string;
}> = [
  {
    Icon: ShieldCheck,
    titre: "Protège votre site, en continu",
    description:
      "Audit sécurité à l'installation, surveillance 24/7, blocage temps réel des bots, injections et intrusions. Comme un antivirus actif — mais pour votre présence en ligne tout entière.",
    badge: "Autonomie totale",
  },
  {
    Icon: Search,
    titre: "Pilote votre SEO, sans vous solliciter",
    description:
      "Audit initial, re-check hebdomadaire, détection des pages de fuite, parcours brisés, opportunités de mots-clés. Un rapport mensuel narratif. Vous découvrez les problèmes réglés, pas ceux à régler.",
    badge: "Vigile silencieux",
  },
  {
    Icon: Target,
    titre: "Prépare vos campagnes Ads, jusqu'à validation",
    description:
      "AxiSolver monte vos campagnes AdWords et AdSense : audience, mots-clés, créatives, budget. Vous validez d'un clic. Après 90 jours de confiance, option « carte blanche » dans un plafond que vous fixez.",
    badge: "Jusqu'au clic final",
  },
];


const COUTS_HUMAINS: Array<{
  role: string;
  description: string;
  coutMensuel: string;
}> = [
  {
    role: "Chargé d'accueil visiteurs",
    description:
      "Répond aux visiteurs 24/7, qualifie les demandes, oriente vers les bons produits, transforme en prospects chauds.",
    coutMensuel: "1 000 à 3 000 €",
  },
  {
    role: "Spécialiste SEO",
    description:
      "Audits mensuels, suivi des positions, détection des pages de fuite, parcours brisés, optimisations continues.",
    coutMensuel: "2 500 à 5 000 €",
  },
  {
    role: "Traffic manager Ads",
    description:
      "Création et pilotage des campagnes AdWords/AdSense, split testing permanent, surveillance ROI, ajustements d'enchères.",
    coutMensuel: "3 000 à 5 500 €",
  },
];

const COUT_HUMAIN_MIN = 6500;
const COUT_HUMAIN_MAX = 13500;
const AXISOLVER_PREMIUM_PRIX = 99;
const RATIO_MOINS_CHER = Math.round(
  COUT_HUMAIN_MIN / AXISOLVER_PREMIUM_PRIX,
);

export default function PageComparatif() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-zinc-950 text-white">
        {/* ─── Hero ─── */}
        <section
          className="relative overflow-hidden border-b border-zinc-900 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/hero-comparatif-axi-triomphe.png)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-zinc-950/55 via-zinc-950/20 to-zinc-950"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.08),_transparent_60%)]" />
          <div className="relative mx-auto flex min-h-[640px] max-w-5xl flex-col justify-start px-6 py-24 md:min-h-[760px] md:px-10 md:py-28">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Comparatif
              </p>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)] md:text-6xl lg:text-7xl">
                AxiSolver face aux{" "}
                <span className="text-amber-400">
                  chatbots classiques
                </span>
                .
              </h1>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-zinc-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)] md:text-lg">
                Les Intercom, Crisp, Drift, Hubspot Chat ont été
                construits il y a 10 ans pour un monde pré-IA. Ils ont
                ajouté de l&apos;intelligence après coup — comme on
                repeint une vieille voiture. AxiSolver est né IA. Voici
                ce que ça change concrètement.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Ce que personne d'autre ne fait ─── */}
        <section className="border-b border-zinc-900 bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6 md:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Ce que personne d&apos;autre ne fait
              </p>
              <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
                Un chatbot répond.{" "}
                <span className="text-amber-400">
                  AxiSolver travaille pour vous pendant que vous dormez.
                </span>
              </h2>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                Les autres solutions s&apos;arrêtent à la conversation.
                AxiSolver fait trois métiers de plus — en autonomie, sans
                vous solliciter, et vous présente le résultat chaque matin.
                Trois missions que vous confieriez à trois prestataires
                différents, chacun facturé 500 à 2&nbsp;000&nbsp;€ par
                mois.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-3">
              {EXCLUSIVITES.map((e) => (
                <article
                  key={e.titre}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 transition-all hover:border-amber-400/40 hover:bg-zinc-900/60"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/5 blur-2xl transition-opacity group-hover:bg-amber-400/15" />
                  <e.Icon
                    className="h-10 w-10 text-amber-400"
                    strokeWidth={1.5}
                  />
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-white md:text-2xl">
                    {e.titre}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400 md:text-base">
                    {e.description}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
                    <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                    {e.badge}
                  </p>
                </article>
              ))}
            </div>

            <p className="mx-auto mt-14 max-w-3xl text-center text-sm italic leading-relaxed text-zinc-500">
              Aucun autre acteur du marché ne cumule ces trois autonomies
              dans un seul produit. Les chatbots classiques se concentrent
              sur la conversation. Les outils SEO se concentrent sur le
              SEO. Les régies Ads se concentrent sur les Ads. AxiSolver est
              le premier à tout orchestrer, en autonomie, pour un seul
              tarif.
            </p>
          </div>
        </section>

        {/* ─── Tableau comparatif ─── */}
        <section className="border-b border-zinc-900 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6 md:px-10">
            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-xl">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="w-2/5 px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      Capacité
                    </th>
                    <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
                      AxiSolver
                    </th>
                    <th className="px-4 py-5 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Intercom
                    </th>
                    <th className="px-4 py-5 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Crisp
                    </th>
                    <th className="px-4 py-5 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Drift
                    </th>
                    <th className="px-4 py-5 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Hubspot
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CAPABILITIES.map((c, i) => (
                    <tr
                      key={c.label}
                      className={
                        i % 2 === 0
                          ? "bg-zinc-900/20"
                          : "bg-transparent"
                      }
                    >
                      <td className="px-6 py-5 text-sm leading-relaxed text-zinc-200">
                        {c.label}
                      </td>
                      <Cell value={c.axisolver} vedette />
                      <Cell value={c.intercom} />
                      <Cell value={c.crisp} />
                      <Cell value={c.drift} />
                      <Cell value={c.hubspot} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-8 text-center text-xs text-zinc-500">
              Données compilées depuis les documentations publiques et les
              offres commerciales en octobre 2026. Chaque éditeur fait
              évoluer son produit — n&apos;hésitez pas à vérifier les
              dernières spécificités sur leur site.
            </p>
          </div>
        </section>

        {/* ─── Section Interface ─── */}
        <section className="border-b border-zinc-900 bg-zinc-950">
          <div
            className="relative h-56 w-full bg-cover bg-center bg-no-repeat md:h-72"
            style={{ backgroundImage: "url(/presentation-interface-immersive.png)" }}
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-transparent to-zinc-950/60" />
          </div>
          <div className="mx-auto max-w-6xl px-6 pt-16 md:px-10 md:pt-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Interface
              </p>
              <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
                Une petite bulle de coin.{" "}
                <span className="text-amber-400">Ou un vrai espace de dialogue.</span>
              </h2>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                Les chatbots classiques se contentent d&apos;une{" "}
                <span className="font-semibold text-white">
                  bulle minuscule
                </span>{" "}
                tassée en bas à droite. AxiSolver s&apos;ouvre en{" "}
                <span className="font-semibold text-white">
                  plein cœur de la page
                </span>{" "}
                — un modal immersif à 3 territoires qui dialoguent : contexte à
                gauche, conversation au centre, fiche visiteur à droite.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-2">
              <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Chatbot classique
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">
                  Petite bulle en bas à droite
                </h3>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                  <li className="flex gap-3">
                    <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-700" strokeWidth={2.4} />
                    <span>Fenêtre 320×480 px, écrasée dans un coin</span>
                  </li>
                  <li className="flex gap-3">
                    <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-700" strokeWidth={2.4} />
                    <span>Scrolling vertical qui tasse les anciens messages</span>
                  </li>
                  <li className="flex gap-3">
                    <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-700" strokeWidth={2.4} />
                    <span>Aucune contextualisation (pas de fiche produit, pas d&apos;image)</span>
                  </li>
                  <li className="flex gap-3">
                    <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-700" strokeWidth={2.4} />
                    <span>Boîte noire : le visiteur ne voit pas ce qui est retenu</span>
                  </li>
                </ul>
              </article>

              <article className="rounded-2xl border border-amber-400/40 bg-zinc-900/60 p-7 shadow-lg shadow-amber-400/10 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                  AxiSolver
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">
                  Modal immersif plein écran
                </h3>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-200 md:text-base">
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" strokeWidth={2.8} />
                    <span>Modal centré, cadre généreux, respirations</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" strokeWidth={2.8} />
                    <span>3 territoires qui dialoguent, pas de scrolling frustrant</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" strokeWidth={2.8} />
                    <span>Panneau contextuel : fiche produit Shopify, dossier client, bien immobilier</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" strokeWidth={2.8} />
                    <span>Fiche visiteur en direct : transparence totale sur ce qui est retenu</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" strokeWidth={2.8} />
                    <span>Entièrement paramétrable à votre identité : logo, couleurs, questions d&apos;accueil, ton de voix</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" strokeWidth={2.8} />
                    <span>Mise en ligne sans ligne de code : snippet dans le head et c&apos;est actif</span>
                  </li>
                </ul>
              </article>
            </div>
          </div>

          <div className="h-16 md:h-24" aria-hidden />
        </section>

        {/* ─── Section Base de connaissances ─── */}
        <section className="border-b border-zinc-900 bg-zinc-950">
          <div
            className="relative h-56 w-full bg-cover bg-center bg-no-repeat md:h-72"
            style={{ backgroundImage: "url(/presentation-base-connaissances-axi.png)" }}
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-transparent to-zinc-950/60" />
          </div>
          <div className="mx-auto max-w-6xl px-6 pt-16 md:px-10 md:pt-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Base de connaissances
              </p>
              <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
                Écrire chaque réponse à la main.{" "}
                <span className="text-amber-400">Ou laisser AxiSolver absorber votre site.</span>
              </h2>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                Les chatbots classiques fonctionnent par{" "}
                <span className="font-semibold text-white">
                  arbres de dialogue
                </span>{" "}
                : il faut rédiger chaque réponse, chaque scénario, chaque relance.
                AxiSolver{" "}
                <span className="font-semibold text-white">
                  crawle automatiquement votre site
                </span>{" "}
                et ingère vos PDF. Chaque réponse qu&apos;il donne cite la page
                ou le document précis d&apos;où elle vient.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-2">
              <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Chatbot classique à arbres
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">
                  Chaque réponse rédigée à la main
                </h3>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                  <li className="flex gap-3">
                    <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-700" strokeWidth={2.4} />
                    <span>Un rédacteur FAQ dédié ou une agence pour construire les scripts</span>
                  </li>
                  <li className="flex gap-3">
                    <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-700" strokeWidth={2.4} />
                    <span>Chaque nouvelle offre produit = mise à jour manuelle</span>
                  </li>
                  <li className="flex gap-3">
                    <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-700" strokeWidth={2.4} />
                    <span>Hors scénario : impasse ou renvoi humain</span>
                  </li>
                  <li className="flex gap-3">
                    <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-700" strokeWidth={2.4} />
                    <span>Aucune traçabilité des sources de l&apos;information</span>
                  </li>
                </ul>
              </article>

              <article className="rounded-2xl border border-amber-400/40 bg-zinc-900/60 p-7 shadow-lg shadow-amber-400/10 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                  AxiSolver
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">
                  Absorbe votre site + vos PDF
                </h3>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-200 md:text-base">
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" strokeWidth={2.8} />
                    <span>Crawl auto à l&apos;installation, re-crawl mensuel. Zéro script à rédiger</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" strokeWidth={2.8} />
                    <span>Ingestion PDF : CGV, catalogue, mode d&apos;emploi, docs réglementaires</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" strokeWidth={2.8} />
                    <span>Embeddings vectorisés, recherche sémantique haute précision</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" strokeWidth={2.8} />
                    <span>Chaque réponse cite sa source. Garde-fou honnêteté : jamais d&apos;invention</span>
                  </li>
                </ul>
              </article>
            </div>
          </div>

          <div className="h-16 md:h-24" aria-hidden />
        </section>

        {/* ─── Comparatif tarifaire par mission (onglets) ─── */}
        <ComparatifTarifaire />

        {/* ─── Équipe humaine équivalente (cartes salaires) ─── */}
        <section className="border-b border-zinc-900 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6 md:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/5 px-4 py-1.5">
                <Users className="h-4 w-4 text-amber-400" strokeWidth={2} />
                <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                  Combien ça coûterait en vrais salaires ?
                </span>
              </div>
              <h2 className="mt-8 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
                Imaginez trois personnes à temps plein pour votre site.
              </h2>
              <p className="mt-7 text-base leading-relaxed text-zinc-300 md:text-lg">
                Un chargé d&apos;accueil 24/7, un spécialiste SEO et un
                traffic manager Ads qui travaille en continu votre split
                testing. Ce que vous paieriez chaque mois en charges
                employeur, en France, pour avoir cette équipe à vos côtés.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
              {COUTS_HUMAINS.map((c) => (
                <article
                  key={c.role}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                    {c.role}
                  </p>
                  <p className="mt-6 font-mono text-4xl font-semibold tracking-tight text-white">
                    {c.coutMensuel}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    par mois · charges employeur comprises
                  </p>
                  <p className="mt-6 text-sm leading-relaxed text-zinc-400">
                    {c.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-14 overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-zinc-900 via-amber-400/5 to-zinc-900 p-10 md:p-14">
              <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-5">
                <div className="md:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                    Total équipe humaine équivalente
                  </p>
                  <p className="mt-4 flex items-baseline gap-3">
                    <span className="font-mono text-5xl font-semibold tracking-tight text-white md:text-6xl">
                      {COUT_HUMAIN_MIN.toLocaleString("fr-FR")} à{" "}
                      {COUT_HUMAIN_MAX.toLocaleString("fr-FR")} €
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">par mois</p>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                    Fourchette observée en France, charges employeur
                    comprises, pour 3 postes juniors à mi-carrière. Hors
                    coûts de recrutement, formation, matériel, bureaux et
                    arrêts maladie.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                    AxiSolver Premium
                  </p>
                  <p className="mt-4 font-mono text-6xl font-semibold tracking-tight text-amber-400 md:text-7xl">
                    {AXISOLVER_PREMIUM_PRIX} €
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    par mois · tout inclus
                  </p>
                  <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {RATIO_MOINS_CHER} fois moins cher
                  </p>
                </div>
              </div>
            </div>

            <p className="mx-auto mt-10 max-w-3xl text-center text-sm italic leading-relaxed text-zinc-500">
              Évidemment, AxiSolver ne remplace pas chaque geste humain —
              il remplace la charge opérationnelle qui empêche vos vraies
              équipes de se concentrer sur ce qui compte : la stratégie,
              la relation client incarnée, la décision.
            </p>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Essayer AxiSolver vaut mieux qu&apos;un
              <span className="text-amber-400"> long discours</span>.
            </h2>
            <p className="mt-5 text-base text-zinc-400">
              14 jours d&apos;essai gratuit. Pas de carte bancaire
              demandée. Annulation en 1 clic.
            </p>
            <Link
              href="/parametrage-et-tarifs"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-amber-400 px-8 py-4 text-base font-semibold uppercase tracking-[0.14em] text-zinc-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:shadow-amber-400/50 md:text-lg"
            >
              Paramétrer AxiSolver
              <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function Cell({
  value,
  vedette = false,
}: {
  value: boolean | "partiel";
  vedette?: boolean;
}) {
  const common = "px-4 py-5 text-center";
  if (value === true) {
    return (
      <td className={common}>
        <Check
          className={`mx-auto h-5 w-5 ${vedette ? "text-amber-400" : "text-emerald-500"}`}
          strokeWidth={3}
        />
      </td>
    );
  }
  if (value === "partiel") {
    return (
      <td className={common}>
        <Minus
          className="mx-auto h-5 w-5 text-zinc-600"
          strokeWidth={3}
        />
      </td>
    );
  }
  return (
    <td className={common}>
      <X className="mx-auto h-5 w-5 text-rose-700" strokeWidth={3} />
    </td>
  );
}
