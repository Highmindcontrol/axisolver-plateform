import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShoppingBag,
  Globe,
  Package,
  TrendingUp,
  Users,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site/header";

export const metadata = {
  title: "AxiSolver pour Shopify, WordPress ou site classique — Cas d'usage",
  description:
    "Scénarios d'installation détaillés : Shopify, WordPress, site classique. Taux d'utilisation réels, conversations attendues selon trafic, comparatif coût équivalent humain.",
};

type Scenario = {
  slug: "shopify" | "wordpress" | "classique";
  nom: string;
  tagline: string;
  Icon: typeof ShoppingBag;
  installation: string[];
  tauxEngagement: {
    valeur: number;
    source: string;
  };
  profilsTypes: Array<{
    label: string;
    visiteurs: number;
    conversationsEstimees: number;
    verdict: "confort" | "limite" | "depassement";
  }>;
  recommandation: string;
};

const SCENARIOS: Scenario[] = [
  {
    slug: "shopify",
    nom: "Vous avez une boutique Shopify",
    tagline:
      "App Store Shopify + Theme App Extension. Installation en 3 clics, zéro code.",
    Icon: ShoppingBag,
    installation: [
      "Rechercher « AxiSolver » dans le Shopify App Store",
      "Cliquer sur « Installer » (OAuth automatique)",
      "AxiSolver crawle automatiquement votre catalogue + collections",
      "Activation du widget dans le thème via Theme Editor",
      "Première conversation possible 10 minutes après installation",
    ],
    tauxEngagement: {
      valeur: 2.0,
      source:
        "Baseline Shopify (Smartsupp 5 Md visites + Drift B2C 2-5%). AxiSolver se positionne en haut de fourchette grâce à sa modale plein écran.",
    },
    profilsTypes: [
      {
        label: "Petite boutique qui démarre",
        visiteurs: 2000,
        conversationsEstimees: 60,
        verdict: "confort",
      },
      {
        label: "Shopify établi",
        visiteurs: 5000,
        conversationsEstimees: 150,
        verdict: "confort",
      },
      {
        label: "Shopify qui marche",
        visiteurs: 10000,
        conversationsEstimees: 300,
        verdict: "limite",
      },
      {
        label: "Gros Shopify qui scale",
        visiteurs: 20000,
        conversationsEstimees: 600,
        verdict: "depassement",
      },
    ],
    recommandation:
      "AxiSolver Premium (99 €/mois, voix ElevenLabs) couvre jusqu'à 10 000 visiteurs mensuels dans son quota de 300 conversations. Au-delà, le dépassement est facturé 0,45 €/conv supplémentaire — un Shopify à 20 000 visiteurs paiera ~234 €/mois tout compris, à comparer à son CA et sa marge sur conversion.",
  },
  {
    slug: "wordpress",
    nom: "Vous avez un site WordPress",
    tagline:
      "Plugin officiel sur WordPress.org. Un clic pour installer, zéro ligne de code.",
    Icon: Package,
    installation: [
      "Depuis votre tableau de bord WordPress → Extensions → Ajouter",
      "Rechercher « AxiSolver » puis cliquer sur « Installer »",
      "Activer le plugin et renseigner votre identifiant AxiSolver",
      "AxiSolver crawle votre site + les PDFs de la médiathèque",
      "Widget actif sur toutes les pages, personnalisable depuis l'admin",
    ],
    tauxEngagement: {
      valeur: 1.5,
      source:
        "WordPress couvre vitrine + blog + e-commerce WooCommerce. Fourchette moyenne 0,8 à 3 % selon le type de site. AxiSolver optimise la conversion par sa pastille animée.",
    },
    profilsTypes: [
      {
        label: "Site vitrine artisan / consultant",
        visiteurs: 1500,
        conversationsEstimees: 23,
        verdict: "confort",
      },
      {
        label: "Blog / site de contenu",
        visiteurs: 8000,
        conversationsEstimees: 120,
        verdict: "confort",
      },
      {
        label: "WooCommerce qui fonctionne",
        visiteurs: 15000,
        conversationsEstimees: 300,
        verdict: "limite",
      },
      {
        label: "Portail média / forte audience",
        visiteurs: 30000,
        conversationsEstimees: 450,
        verdict: "depassement",
      },
    ],
    recommandation:
      "AxiSolver Classique (69 €/mois, voix Azure) couvre très largement les sites vitrines et blogs classiques dans ses 400 conversations incluses. Les WooCommerce qui scalent peuvent passer sur Premium si l'image de voix compte.",
  },
  {
    slug: "classique",
    nom: "Vous avez un site classique",
    tagline:
      "React, Vue, HTML statique, Webflow, Framer, custom… Un snippet JavaScript dans le head.",
    Icon: Globe,
    installation: [
      "Récupérer votre snippet AxiSolver depuis le dashboard",
      "Coller le snippet dans la balise <head> de votre site",
      "AxiSolver crawle le site + les PDFs que vous importez",
      "Widget actif immédiatement, 100 % personnalisable",
      "Compatible Google Tag Manager (template officiel validé)",
    ],
    tauxEngagement: {
      valeur: 1.2,
      source:
        "Site non catégorisé : fourchette large 0,5 à 3 %. Baseline conservatrice retenue, à ajuster selon votre secteur réel (vitrine, SaaS, services).",
    },
    profilsTypes: [
      {
        label: "Site vitrine corporate",
        visiteurs: 3000,
        conversationsEstimees: 36,
        verdict: "confort",
      },
      {
        label: "SaaS B2B avec démos",
        visiteurs: 8000,
        conversationsEstimees: 240,
        verdict: "confort",
      },
      {
        label: "Site de services (immobilier, juridique)",
        visiteurs: 5000,
        conversationsEstimees: 400,
        verdict: "limite",
      },
      {
        label: "Portail à forte audience",
        visiteurs: 15000,
        conversationsEstimees: 450,
        verdict: "depassement",
      },
    ],
    recommandation:
      "AxiSolver Text Only (49 €/mois) convient parfaitement aux sites vitrines et portails informatifs. Les SaaS B2B et services passeront sur Classique ou Premium pour l'effet voix sur la qualification de leads.",
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
    coutMensuel: "3 200 €",
  },
  {
    role: "Spécialiste SEO",
    description:
      "Audits mensuels, suivi des positions, détection des pages de fuite, parcours brisés, optimisations continues.",
    coutMensuel: "3 400 €",
  },
  {
    role: "Traffic manager Ads",
    description:
      "Création et pilotage des campagnes AdWords/AdSense, split testing permanent, surveillance ROI, ajustements d'enchères.",
    coutMensuel: "4 100 €",
  },
];

const COUT_HUMAIN_TOTAL = 10700; // somme en € HT, charges employeur comprises

function BadgeVerdict({ verdict }: { verdict: Scenario["profilsTypes"][number]["verdict"] }) {
  const config = {
    confort: {
      label: "Confortablement couvert",
      className:
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    },
    limite: {
      label: "Pile dans le quota",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    },
    depassement: {
      label: "Dépassement : supp facturé",
      className: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    },
  }[verdict];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default function PageCasUsage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-zinc-950 text-white">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden border-b border-zinc-900">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.08),_transparent_60%)]" />
          <div className="relative mx-auto max-w-5xl px-6 py-24 text-center md:px-10 md:py-32">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Cas d&apos;usage
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
              AxiSolver est{" "}
              <span className="text-amber-400">prêt pour votre site</span>,
              quel qu&apos;il soit.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Shopify, WordPress, React, Framer, Webflow, HTML
              statique — AxiSolver s&apos;installe en quelques minutes.
              Voici concrètement ce qu&apos;on a préparé pour vous selon
              votre type de site, et le trafic que chaque formule couvre.
            </p>
          </div>
        </section>

        {/* ─── 3 scénarios ─── */}
        {SCENARIOS.map((s, index) => (
          <section
            key={s.slug}
            className={`border-b border-zinc-900 py-20 md:py-28 ${
              index % 2 === 1 ? "bg-zinc-900/40" : ""
            }`}
          >
            <div className="mx-auto max-w-6xl px-6 md:px-10">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
                {/* Colonne gauche : identité + installation */}
                <div className="lg:col-span-2">
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/5 px-4 py-3">
                    <s.Icon
                      className="h-6 w-6 text-amber-400"
                      strokeWidth={1.5}
                    />
                    <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                      Scénario {index + 1}
                    </span>
                  </div>

                  <h2 className="mt-6 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                    {s.nom}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-zinc-300">
                    {s.tagline}
                  </p>

                  <div className="mt-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                      Installation
                    </p>
                    <ol className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-300">
                      {s.installation.map((etape, i) => (
                        <li key={etape} className="flex gap-3">
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-xs font-semibold text-amber-300">
                            {i + 1}
                          </span>
                          <span>{etape}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Colonne droite : taux + table + reco */}
                <div className="lg:col-span-3">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                      Taux d&apos;engagement observé
                    </p>
                    <p className="mt-4 flex items-baseline gap-3">
                      <span className="font-mono text-6xl font-semibold tracking-tight text-white md:text-7xl">
                        {s.tauxEngagement.valeur.toLocaleString("fr-FR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        <span className="text-4xl text-amber-300">%</span>
                      </span>
                    </p>
                    <p className="mt-4 text-xl font-medium leading-snug text-zinc-200 md:text-2xl">
                      des visiteurs engagent une conversation avec
                      AxiSolver.
                    </p>
                    <p className="mt-5 text-xs leading-relaxed text-zinc-500">
                      {s.tauxEngagement.source}
                    </p>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950">
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                            Profil
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                            Visiteurs/mois
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                            Conv. estimées
                          </th>
                          <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                            Verdict
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.profilsTypes.map((profil, i) => (
                          <tr
                            key={profil.label}
                            className={
                              i % 2 === 0
                                ? "bg-zinc-900/40"
                                : "bg-transparent"
                            }
                          >
                            <td className="px-4 py-4 text-zinc-200">
                              {profil.label}
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-zinc-300">
                              {profil.visiteurs.toLocaleString("fr-FR")}
                            </td>
                            <td className="px-4 py-4 text-right font-mono font-semibold text-white">
                              {profil.conversationsEstimees.toLocaleString(
                                "fr-FR",
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <BadgeVerdict verdict={profil.verdict} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex gap-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6">
                    <Sparkles
                      className="h-5 w-5 flex-shrink-0 text-amber-400"
                      strokeWidth={2}
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                        Notre recommandation
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                        {s.recommandation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* ─── Section croissance ─── */}
        <section className="border-b border-zinc-900 bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 text-center md:px-10">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/5 px-4 py-1.5">
              <TrendingUp className="h-4 w-4 text-amber-400" strokeWidth={2} />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                Et si votre trafic triplait ?
              </span>
            </div>

            <h2 className="mt-8 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              Vous êtes à 3 000 visites/mois ? AxiSolver prépare votre site
              pour en{" "}
              <span className="text-amber-400">
                recevoir 8 000.
              </span>
            </h2>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Installer AxiSolver, ce n&apos;est pas juste poser un
              chatbot. Les 6 missions tournent en autonomie : la veille
              SEO améliore votre positionnement, le bouclier défensif
              protège votre réputation, et surtout AxiSolver prépare vos
              campagnes AdWords et AdSense avec un split testing
              permanent, exactement comme le ferait un traffic manager à
              temps plein.
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Résultat observé sur un cycle de 6 à 12 mois :
              multiplication du trafic organique par 2 à 3, du taux
              d&apos;engagement par 1,5 à 2. La formule que vous choisissez
              aujourd&apos;hui doit anticiper cette croissance.
            </p>
          </div>
        </section>

        {/* ─── Section équipe humaine équivalente ─── */}
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
                traffic manager Ads qui travaille en continu votre
                split testing. Ce que vous paieriez chaque mois en charges
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
                    <span className="font-mono text-6xl font-semibold tracking-tight text-white md:text-7xl">
                      {COUT_HUMAIN_TOTAL.toLocaleString("fr-FR")} €
                    </span>
                    <span className="text-base text-zinc-400">
                      par mois
                    </span>
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                    Hypothèse conservatrice en France, charges employeur
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
                    99 €
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    par mois · tout inclus
                  </p>
                  <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                    108 fois moins cher
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
              Votre scénario est{" "}
              <span className="text-amber-400">clair.</span> Simulez votre
              tarif.
            </h2>
            <p className="mt-5 text-base text-zinc-400">
              5 questions courtes, votre tarif précis en direct.
              14 jours d&apos;essai sans carte bancaire.
            </p>
            <Link
              href="/parametrage-et-tarifs"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-amber-400 px-8 py-4 text-base font-semibold uppercase tracking-[0.14em] text-zinc-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:shadow-amber-400/50 md:text-lg"
            >
              Paramétrer votre AxiSolver
              <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
