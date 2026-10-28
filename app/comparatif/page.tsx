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
} from "lucide-react";
import { SiteHeader } from "@/components/site/header";

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

const MISSIONS_SECURITE: Array<{ titre: string; description: string }> = [
  {
    titre: "Audit continu de votre site",
    description:
      "Détection des failles connues, CVE actives sur vos plugins et dépendances, versions obsolètes, certificats expirés. Vous êtes alerté avant que ça devienne un problème.",
  },
  {
    titre: "Headers manquants, scripts tiers",
    description:
      "Vérification des headers de sécurité (CSP, HSTS, X-Frame-Options), audit des scripts tiers chargés par votre site, détection de fuites de données silencieuses.",
  },
  {
    titre: "Shield widget temps réel",
    description:
      "Rate limiting + anti-prompt-injection côté widget. Blocage automatique des bots qui tentent d'abuser de votre AxiSolver. Zéro intervention requise.",
  },
];

const TARIFS_SECURITE: Array<{
  label: string;
  detail: string;
  prix: string;
}> = [
  {
    label: "Sucuri Website Security Platform",
    detail: "Scan + firewall + nettoyage malware, offres Basic à Business",
    prix: "20 à 50 €/mois",
  },
  {
    label: "Wordfence Premium (WordPress)",
    detail: "Firewall WAF + scan + alerte temps réel + support premium",
    prix: "10 à 25 €/mois",
  },
  {
    label: "Pentest ponctuel (annuel)",
    detail: "Audit complet par un cabinet spécialisé, périmètre PME",
    prix: "3 000 à 15 000 €",
  },
  {
    label: "Consultant sécurité externe",
    detail: "Mission ponctuelle, tarif journalier marché français",
    prix: "500 à 1 200 €/jour",
  },
  {
    label: "Audit RGPD complet",
    detail: "Vérification conformité données personnelles + registre",
    prix: "2 500 à 8 000 €",
  },
];

const MISSIONS_SEO: Array<{ titre: string; description: string }> = [
  {
    titre: "Audit initial + re-check hebdomadaire",
    description:
      "AxiSolver scanne votre site à l'installation, puis chaque semaine. Mots-clés, structure, balises, maillage interne, performance Core Web Vitals. Tout est documenté.",
  },
  {
    titre: "Pages de fuite et parcours brisés",
    description:
      "Détection des pages qui perdent les visiteurs, des 404 silencieuses, des redirections cassées, des liens morts. Chaque fuite identifiée est une opportunité de revenu récupérée.",
  },
  {
    titre: "Rapport mensuel narratif",
    description:
      "Pas un dashboard de métriques indigeste : un rapport mensuel en français qui raconte votre progression, les actions prioritaires, et le travail déjà fait par AxiSolver.",
  },
];

const TARIFS_SEO: Array<{
  label: string;
  detail: string;
  prix: string;
}> = [
  {
    label: "Agence SEO (full service)",
    detail:
      "Mission mensuelle avec audits, contenu, netlinking, suivi positions",
    prix: "1 500 à 5 000 €/mois",
  },
  {
    label: "Consultant SEO freelance senior",
    detail: "Mission continue 2-3 jours/mois, marché français",
    prix: "800 à 2 500 €/mois",
  },
  {
    label: "Audit SEO ponctuel",
    detail: "Audit technique + stratégique one-shot par un consultant",
    prix: "1 500 à 5 000 €",
  },
  {
    label: "Logiciels dédiés (Semrush, Ahrefs, Moz Pro)",
    detail:
      "Abonnement SaaS pour recherche de mots-clés, backlinks, suivi positions",
    prix: "100 à 400 €/mois",
  },
  {
    label: "Salarié SEO Manager interne",
    detail:
      "Poste junior à mi-carrière, salaire brut + charges employeur",
    prix: "3 000 à 5 000 €/mois",
  },
  {
    label: "Rédacteur SEO freelance",
    detail: "Contenu optimisé publié mensuellement sur votre blog",
    prix: "500 à 2 000 €/mois",
  },
];

const MISSIONS_ADS: Array<{ titre: string; description: string }> = [
  {
    titre: "Montage complet de vos campagnes",
    description:
      "Audience, mots-clés, créatives, budget, enchères. AxiSolver prépare tout. Vous validez d'un clic depuis votre tableau de bord.",
  },
  {
    titre: "Split testing permanent",
    description:
      "Rotation A/B/n sur les variantes qui marchent, pause automatique des campagnes qui gaspillent. Chaque euro travaille mieux que le précédent.",
  },
  {
    titre: "Rebalance budget quotidien",
    description:
      "AxiSolver bascule le budget quotidiennement entre vos campagnes selon le ROAS observé. Les meilleures reçoivent plus, les mauvaises moins.",
  },
];

const TARIFS_ADS: Array<{
  label: string;
  detail: string;
  prix: string;
}> = [
  {
    label: "Agence SEA (Google Ads certifiée)",
    detail:
      "Fee gestion mensuel + commission 10-20 % du budget médias",
    prix: "1 500 à 5 000 €/mois",
  },
  {
    label: "Traffic manager freelance senior",
    detail: "Mission continue 2-3 jours/semaine, marché français",
    prix: "1 500 à 3 000 €/mois",
  },
  {
    label: "Traffic manager freelance junior",
    detail: "Mission continue 1-2 jours/semaine, marché français",
    prix: "800 à 1 500 €/mois",
  },
  {
    label: "Logiciels dédiés de gestion (AdEspresso, Smartly, Marin)",
    detail: "Abonnement SaaS sans la main humaine qui pilote",
    prix: "49 à 1 500 €/mois",
  },
  {
    label: "Salarié traffic manager interne",
    detail:
      "Poste junior à mi-carrière, salaire brut + charges employeur",
    prix: "3 500 à 5 500 €/mois",
  },
];

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

        {/* ─── Section Sécurité ─── */}
        <section className="border-b border-zinc-900 bg-zinc-950">
          <div className="mx-auto max-w-6xl px-6 pt-24 md:px-10 md:pt-32">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Sécurité
              </p>
              <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
                Partenaire supplémentaire de la{" "}
                <span className="text-amber-400">
                  sécurité de votre site
                </span>
                .
              </h2>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                AxiSolver ne remplace pas vos antivirus de site, votre
                firewall ou votre hébergeur sécurisé. Il vient en{" "}
                <span className="font-semibold text-white">
                  renfort permanent
                </span>{" "}
                — avec une veille continue que personne d&apos;autre ne
                fait au prix d&apos;un abonnement mensuel. Comme un
                second rempart, discret et actif en arrière-plan.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-3">
              {MISSIONS_SECURITE.map((m) => (
                <article
                  key={m.titre}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 md:p-8"
                >
                  <ShieldCheck
                    className="h-9 w-9 text-amber-400"
                    strokeWidth={1.5}
                  />
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-white md:text-2xl">
                    {m.titre}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300 md:text-base">
                    {m.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {/* Bandeau image Axi + bouclier + antivirus */}
          <div
            className="relative mt-16 h-56 w-full bg-cover bg-center bg-no-repeat md:mt-20 md:h-72"
            style={{
              backgroundImage:
                "url(/comparatif-securite-axi-bouclier.png)",
            }}
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-transparent to-zinc-950/60" />
          </div>

          <div className="mx-auto max-w-6xl px-6 pb-24 md:px-10 md:pb-32">
            {/* Comparatif tarifaire sécurité */}
            <div className="mt-16 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <div className="border-b border-zinc-800 bg-zinc-950/90 px-6 py-5 md:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Combien coûte une sécurité de site professionnelle
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
                  AxiSolver ajoute sa couche de veille pour une fraction
                  de ces budgets.
                </h3>
              </div>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:px-8">
                      Solution
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:px-6">
                      Prix marché
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {TARIFS_SECURITE.map((t, i) => (
                    <tr
                      key={t.label}
                      className={
                        i % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent"
                      }
                    >
                      <td className="px-6 py-5 text-zinc-200 md:px-8">
                        <p className="font-medium">{t.label}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {t.detail}
                        </p>
                      </td>
                      <td className="px-4 py-5 text-right font-mono font-semibold text-white md:px-6">
                        {t.prix}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-400/10">
                    <td className="px-6 py-5 md:px-8">
                      <p className="font-semibold text-amber-300">
                        AxiSolver (toutes formules)
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Audit sécurité initial · surveillance 24/7 ·
                        rapport mensuel · blocage temps réel
                      </p>
                    </td>
                    <td className="px-4 py-5 text-right font-mono text-lg font-bold text-amber-300 md:px-6">
                      inclus
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── Section SEO ─── */}
        <section className="border-b border-zinc-900 bg-zinc-950">
          <div className="mx-auto max-w-6xl px-6 pt-24 md:px-10 md:pt-32">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Référencement
              </p>
              <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
                Fini le chaos SEO.{" "}
                <span className="text-amber-400">
                  AxiSolver orchestre tout.
                </span>
              </h2>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                Mots-clés, contenu, netlinking, indexation, performance,
                suivi des positions… Faire du SEO sérieusement, c&apos;est{" "}
                <span className="font-semibold text-white">
                  un métier à temps plein
                </span>{" "}
                ou une agence spécialisée. AxiSolver automatise la veille,
                détecte les failles, et vous présente chaque mois un
                rapport clair pour décider.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-3">
              {MISSIONS_SEO.map((m) => (
                <article
                  key={m.titre}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 md:p-8"
                >
                  <Search
                    className="h-9 w-9 text-amber-400"
                    strokeWidth={1.5}
                  />
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-white md:text-2xl">
                    {m.titre}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300 md:text-base">
                    {m.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {/* Bandeau image chaos SEO vs AXI */}
          <div
            className="relative mt-16 h-56 w-full bg-cover bg-center bg-no-repeat md:mt-20 md:h-72"
            style={{
              backgroundImage: "url(/comparatif-seo-chaos-vs-axi.png)",
            }}
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-transparent to-zinc-950/60" />
          </div>

          <div className="mx-auto max-w-6xl px-6 pb-24 md:px-10 md:pb-32">
            {/* Comparatif tarifaire SEO */}
            <div className="mt-16 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <div className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-5 md:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Combien coûte un vrai SEO suivi
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
                  AxiSolver automatise la veille et vous présente les
                  priorités chaque mois.
                </h3>
              </div>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:px-8">
                      Solution
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:px-6">
                      Prix marché
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {TARIFS_SEO.map((t, i) => (
                    <tr
                      key={t.label}
                      className={
                        i % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent"
                      }
                    >
                      <td className="px-6 py-5 text-zinc-200 md:px-8">
                        <p className="font-medium">{t.label}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {t.detail}
                        </p>
                      </td>
                      <td className="px-4 py-5 text-right font-mono font-semibold text-white md:px-6">
                        {t.prix}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-400/10">
                    <td className="px-6 py-5 md:px-8">
                      <p className="font-semibold text-amber-300">
                        AxiSolver (toutes formules)
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Audit SEO initial · re-check hebdomadaire ·
                        détection pages de fuite · rapport mensuel
                        narratif
                      </p>
                    </td>
                    <td className="px-4 py-5 text-right font-mono text-lg font-bold text-amber-300 md:px-6">
                      inclus
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── Section Ads ─── */}
        <section className="relative overflow-hidden border-b border-zinc-900 bg-zinc-950">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(251,191,36,0.08),_transparent_60%)]" />
          <div className="relative mx-auto max-w-6xl px-6 pt-24 md:px-10 md:pt-32">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Publicité en ligne
              </p>
              <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
                Agence Ads&nbsp;? Freelance traffic manager&nbsp;?{" "}
                <span className="text-amber-400">
                  AxiSolver fait leur travail.
                </span>
              </h2>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                Piloter sérieusement des campagnes Google Ads, Facebook
                Ads ou AdSense demande une{" "}
                <span className="font-semibold text-white">
                  personne dédiée à temps plein
                </span>{" "}
                ou une agence spécialisée. Les tarifs du marché sont
                prohibitifs pour la plupart des PME. AxiSolver monte,
                teste et optimise vos campagnes en continu, et vous
                validez d&apos;un clic.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-3">
              {MISSIONS_ADS.map((m) => (
                <article
                  key={m.titre}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 md:p-8"
                >
                  <Target
                    className="h-9 w-9 text-amber-400"
                    strokeWidth={1.5}
                  />
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-white md:text-2xl">
                    {m.titre}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300 md:text-base">
                    {m.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {/* Bandeau image AxiSolver vs agence SEO/Ads */}
          <div
            className="relative mt-16 h-56 w-full bg-cover bg-center bg-no-repeat md:mt-20 md:h-72"
            style={{
              backgroundImage: "url(/comparatif-ads-axi-agence.png)",
            }}
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-transparent to-zinc-950/60" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 pb-24 md:px-10 md:pb-32">
            {/* Comparatif tarifaire Ads */}
            <div className="mt-16 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <div className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-5 md:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Combien coûte une gestion Ads professionnelle
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
                  AxiSolver inclut la préparation complète de vos
                  campagnes, à valider d&apos;un clic.
                </h3>
              </div>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:px-8">
                      Solution
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:px-6">
                      Prix marché
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {TARIFS_ADS.map((t, i) => (
                    <tr
                      key={t.label}
                      className={
                        i % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent"
                      }
                    >
                      <td className="px-6 py-5 text-zinc-200 md:px-8">
                        <p className="font-medium">{t.label}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {t.detail}
                        </p>
                      </td>
                      <td className="px-4 py-5 text-right font-mono font-semibold text-white md:px-6">
                        {t.prix}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-400/10">
                    <td className="px-6 py-5 md:px-8">
                      <p className="font-semibold text-amber-300">
                        AxiSolver (toutes formules)
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Audience · mots-clés · créatives · budget ·
                        split testing permanent · validation d&apos;un
                        clic
                      </p>
                    </td>
                    <td className="px-4 py-5 text-right font-mono text-lg font-bold text-amber-300 md:px-6">
                      inclus
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mx-auto mt-10 max-w-3xl text-center text-xs italic leading-relaxed text-zinc-500">
              Les tarifs cités reflètent les fourchettes marché
              observées en France sur les agences SEA et traffic
              managers freelances en octobre 2026. Un devis précis
              dépend du périmètre, des plateformes ciblées (Google,
              Meta, LinkedIn, TikTok) et du volume de budget géré.
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
