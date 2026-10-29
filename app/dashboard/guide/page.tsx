import { redirect } from "next/navigation";
import {
  BookOpenCheck,
  CheckCircle2,
  Compass,
  LineChart,
  MessageSquareText,
  Mic,
  Rocket,
  Settings,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Guide d'AXI · AxiSolver",
};

/**
 * /dashboard/guide — page dédiée Guide d'AXI.
 *
 * Explique les bonnes pratiques, le workflow type d'un paramétrage
 * de site, et les capacités d'AXI pack par pack. Lien y pointant
 * depuis la sidebar gauche (toujours visible) et depuis la page
 * d'accueil (section Guide).
 */
export default async function PageGuide() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  return (
    <div className="flex-1 px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-10 flex items-start gap-4">
        <span
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20"
          aria-hidden
        >
          <Compass className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Guide d&apos;AXI
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Tout ce qu&apos;il faut savoir pour tirer le meilleur parti
            d&apos;AXI sur vos sites. Fondamentaux, workflow de
            paramétrage, capacités pack par pack.
          </p>
        </div>
      </header>

      <SectionFondamentaux />
      <SectionWorkflow />
      <SectionCapacites />
      <SectionBonnesPratiques />
    </div>
  );
}

/* ─── Fondamentaux ─────────────────────────────────────────────── */

function SectionFondamentaux() {
  const items = [
    {
      icone: Sparkles,
      titre: "AXI est un copilote scopé au site",
      corps:
        "Chaque site a son propre AXI, qui ne connaît que ce qu'on lui donne (base de connaissances) et n'agit que dans le périmètre de ce site. Pas de fuite entre vos sites.",
    },
    {
      icone: Shield,
      titre: "Rien n'est fait sans votre validation",
      corps:
        "AXI prépare les audits, les diagnostics, les recommandations. Les actions externes nécessitent une vérification de propriété de domaine préalable.",
    },
    {
      icone: Mic,
      titre: "Voix et écrit, selon votre choix",
      corps:
        "Mode texte uniquement ou mode voix (ElevenLabs). Ajustable site par site dans la configuration.",
    },
  ];
  return (
    <section className="mb-12">
      <h2 className="mb-5 text-lg font-semibold tracking-tight text-slate-900">
        Les fondamentaux
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {items.map((i) => {
          const Icone = i.icone;
          return (
            <li
              key={i.titre}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"
                aria-hidden
              >
                <Icone className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                {i.titre}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {i.corps}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─── Workflow type ────────────────────────────────────────────── */

const WORKFLOW = [
  {
    titre: "Créez votre site",
    corps:
      "Nom, domaine, secteur d'activité, couleur et picto signature. En moins d'une minute.",
    icone: Rocket,
  },
  {
    titre: "Vérifiez la propriété",
    corps:
      "Fichier à la racine ou enregistrement DNS. Débloque les audits externes (SEO, Ads, Sécurité).",
    icone: Shield,
  },
  {
    titre: "Alimentez la base de connaissances",
    corps:
      "URL, sitemap, PDF, documents Word/Excel. AXI s'en nourrit pour répondre juste et sourcé.",
    icone: BookOpenCheck,
  },
  {
    titre: "Configurez options d'accueil + ton",
    corps:
      "Quelques phrases cliquables en vitrine + le ton de votre assistant (chaleureux, pro, concis…).",
    icone: Settings,
  },
  {
    titre: "Installez le snippet",
    corps:
      "Copier-coller une ligne de code sur votre site. WordPress, Shopify, HTML, GTM — tous couverts.",
    icone: MessageSquareText,
  },
  {
    titre: "Laissez AXI piloter",
    corps:
      "Audit SEO + Ads + Sécurité le 1er du mois, rapport quotidien le matin, incidents en temps réel.",
    icone: CheckCircle2,
  },
];

function SectionWorkflow() {
  return (
    <section className="mb-12">
      <h2 className="mb-5 text-lg font-semibold tracking-tight text-slate-900">
        Workflow type d&apos;un nouveau site
      </h2>
      <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
        {WORKFLOW.map((e, i) => {
          const Icone = e.icone;
          return (
            <li key={e.titre} className="relative">
              <span
                className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Icone
                    className="h-4 w-4 text-indigo-700"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                  {e.titre}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {e.corps}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ─── Capacités ────────────────────────────────────────────────── */

const CAPACITES = [
  {
    icone: LineChart,
    titre: "Rapports quotidiens",
    corps:
      "Email chaque matin à 7h avec conversations de la veille, incidents, actions AXI, suggestions.",
  },
  {
    icone: Shield,
    titre: "Sécurité",
    corps:
      "6 piliers audités (headers, TLS, exposition, cookies, contenu, réputation) + monitoring 6h/jour.",
  },
  {
    icone: Compass,
    titre: "SEO",
    corps:
      "5 piliers (contenu, technique, maillage, performance, mobile) + recommandations priorisées.",
  },
  {
    icone: Target,
    titre: "Publicité (Ads)",
    corps:
      "4 piliers (trackers, consentement RGPD, visibilité SERP, remarketing) + diagnostic reprise.",
  },
  {
    icone: Settings,
    titre: "Paramétrages",
    corps:
      "Base de connaissances, options d'accueil, configuration (ton, langues, voix), installation, vérif propriété.",
  },
];

function SectionCapacites() {
  return (
    <section className="mb-12">
      <h2 className="mb-5 text-lg font-semibold tracking-tight text-slate-900">
        Les 5 capacités d&apos;AXI par site
      </h2>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CAPACITES.map((c) => {
          const Icone = c.icone;
          return (
            <li
              key={c.titre}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
                aria-hidden
              >
                <Icone className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                {c.titre}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {c.corps}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─── Bonnes pratiques ─────────────────────────────────────────── */

function SectionBonnesPratiques() {
  const items = [
    "Soyez généreux avec la base de connaissances dès le début. Un AXI sans sources suffisantes se refuge dans « je ne sais pas » — c'est pire que pas d'AXI.",
    "Testez votre interface avec l'aperçu dans la page Paramétrages. Ce que voient vos visiteurs doit refléter ce que vous avez voulu.",
    "N'ayez pas peur du mode voix. Dans certains secteurs (resto, immobilier, cabinet), 3 clients sur 4 préfèrent parler que taper.",
    "Lisez vos rapports quotidiens. Ils remontent toutes les conversations problématiques — c'est là que vous découvrez ce qu'il manque dans votre base de connaissances.",
    "Ne cédez pas à la tentation de laisser AXI agir sans vérifier. Les audits externes nécessitent une vérification de propriété pour une raison : vous êtes seul maître de ce qui part en votre nom.",
  ];
  return (
    <section>
      <h2 className="mb-5 text-lg font-semibold tracking-tight text-slate-900">
        Bonnes pratiques (par expérience)
      </h2>
      <ul className="space-y-3">
        {items.map((t, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600"
              strokeWidth={2.2}
              aria-hidden
            />
            <p className="text-sm leading-relaxed text-slate-700">{t}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
