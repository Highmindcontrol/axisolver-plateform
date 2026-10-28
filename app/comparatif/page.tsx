import Link from "next/link";
import { ArrowRight, Check, Minus, X } from "lucide-react";
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

export default function PageComparatif() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-zinc-950 text-white">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden border-b border-zinc-900">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.08),_transparent_60%)]" />
          <div className="relative mx-auto max-w-5xl px-6 py-24 text-center md:px-10 md:py-32">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Comparatif
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
              AxiSolver face aux{" "}
              <span className="text-amber-400">chatbots classiques</span>.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Les Intercom, Crisp, Drift, Hubspot Chat ont été construits
              il y a 10 ans pour un monde pré-IA. Ils ont ajouté de
              l&apos;intelligence après coup — comme on repeint une
              vieille voiture. AxiSolver est né IA. Voici ce que ça
              change concrètement.
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
