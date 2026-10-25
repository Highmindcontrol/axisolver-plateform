"use client";

import { useMemo, useState } from "react";
import { BoutonLancerAxiSolver } from "@/components/chat/bouton-lancer";

/**
 * Simulateur tarifaire AxiSolver — client component.
 *
 * Hypothèses modèle (à valider avec François) :
 *   - 2% des visiteurs engagent une conversation
 *   - 1 conversation ≈ 3 min d'échange
 *   - Text Only : pas de TTS → coût technique faible
 *   - Classique : TTS Azure (voix neuronale) → coût moyen
 *   - Premium : TTS ElevenLabs (voix bluffante) → coût élevé
 *
 * Formule par formule : abonnement de base + supplément proportionnel
 * au volume de conversations au-delà du seuil inclus.
 */

type SlugFormule = "text" | "classique" | "premium";

type Formule = {
  slug: SlugFormule;
  nom: string;
  sousTitre: string;
  voix: string;
  abonnementBase: number; // € HT / mois
  conversationsIncluses: number;
  prixConversationSupp: number; // € HT / conversation au-delà du seuil
  points: string[];
};

const FORMULES: Formule[] = [
  {
    slug: "text",
    nom: "AxiSolver Text Only",
    sousTitre: "L'essentiel sans la voix.",
    voix: "Écrit uniquement",
    abonnementBase: 39,
    conversationsIncluses: 200,
    prixConversationSupp: 0.08,
    points: [
      "Les six missions AxiSolver",
      "Chat écrit multilingue",
      "Compréhension et résolution complètes",
      "Aucune voix synthétique",
    ],
  },
  {
    slug: "classique",
    nom: "AxiSolver Classique",
    sousTitre: "Voix neuronale premium Azure.",
    voix: "Voix neuronale Azure",
    abonnementBase: 59,
    conversationsIncluses: 150,
    prixConversationSupp: 0.35,
    points: [
      "Les six missions AxiSolver",
      "Chat écrit + voix synthétique Azure",
      "Qualité vocale professionnelle",
      "Toutes langues européennes",
    ],
  },
  {
    slug: "premium",
    nom: "AxiSolver Premium",
    sousTitre: "La voix bluffante ElevenLabs.",
    voix: "Voix ultra-réaliste ElevenLabs",
    abonnementBase: 149,
    conversationsIncluses: 100,
    prixConversationSupp: 1.8,
    points: [
      "Les six missions AxiSolver",
      "Chat écrit + voix ElevenLabs",
      "Rendu vocal indiscernable d'un humain",
      "Idéal pour sites premium et marques fortes",
    ],
  },
];

const TAUX_CONVERSATION = 0.02; // 2% des visiteurs engagent une conversation

function calculerPrix(formule: Formule, visiteursMois: number): number {
  const conversationsMois = Math.ceil(visiteursMois * TAUX_CONVERSATION);
  const sup = Math.max(0, conversationsMois - formule.conversationsIncluses);
  const prix = formule.abonnementBase + sup * formule.prixConversationSupp;
  return Math.round(prix);
}

function formaterEuros(n: number): string {
  return `${n.toLocaleString("fr-FR")} €`;
}

function formaterVisiteurs(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    })} k`;
  }
  return n.toLocaleString("fr-FR");
}

export function Simulateur() {
  const [visiteurs, setVisiteurs] = useState(5000);
  const [choix, setChoix] = useState<SlugFormule>("classique");

  const conversationsEstimees = useMemo(
    () => Math.ceil(visiteurs * TAUX_CONVERSATION),
    [visiteurs],
  );

  const prixParFormule = useMemo(
    () =>
      Object.fromEntries(
        FORMULES.map((f) => [f.slug, calculerPrix(f, visiteurs)]),
      ) as Record<SlugFormule, number>,
    [visiteurs],
  );

  return (
    <section className="bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Simulateur
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
            Votre tarif,{" "}
            <span className="text-amber-400">en direct.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Faites bouger le volume de visiteurs mensuels de votre
            site. Chaque formule s&apos;ajuste. Vous voyez
            instantanément ce que paie votre site.
          </p>
        </div>

        {/* ─── Potard volumétrie ─── */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Volume de visiteurs
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:max-w-md">
                Combien de visiteurs mensuels pour votre site ? On
                estime qu&apos;environ 2 % engagent une conversation
                avec AxiSolver.
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-mono text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {formaterVisiteurs(visiteurs)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                Visiteurs / mois
              </p>
            </div>
          </div>

          <div className="mt-8">
            <input
              type="range"
              min={100}
              max={50000}
              step={100}
              value={visiteurs}
              onChange={(e) => setVisiteurs(Number(e.target.value))}
              className="w-full accent-amber-400"
              aria-label="Nombre de visiteurs mensuels"
            />
            <div className="mt-2 flex justify-between text-[11px] uppercase tracking-widest text-zinc-500">
              <span>100</span>
              <span>50 000</span>
            </div>
          </div>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/5 px-4 py-1.5 text-xs text-amber-200">
            Soit environ{" "}
            <span className="font-semibold text-white">
              {conversationsEstimees.toLocaleString("fr-FR")}
            </span>{" "}
            conversations par mois.
          </p>
        </div>

        {/* ─── 3 formules côte à côte ─── */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FORMULES.map((f) => {
            const estSelectionne = choix === f.slug;
            return (
              <button
                key={f.slug}
                type="button"
                onClick={() => setChoix(f.slug)}
                className={`group relative overflow-hidden rounded-3xl border p-7 text-left transition-all ${
                  estSelectionne
                    ? "border-amber-400 bg-zinc-900 shadow-xl shadow-amber-400/10"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-amber-400/40 hover:bg-zinc-900"
                }`}
                aria-pressed={estSelectionne}
              >
                {estSelectionne && (
                  <span className="absolute right-5 top-5 inline-flex rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-950">
                    Choisi
                  </span>
                )}
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                  {f.voix}
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                  {f.nom}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {f.sousTitre}
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-mono text-5xl font-semibold tracking-tight text-white">
                    {formaterEuros(prixParFormule[f.slug])}
                  </span>
                  <span className="text-sm text-zinc-400">
                    HT / mois
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  pour {formaterVisiteurs(visiteurs)} visiteurs / mois
                </p>

                <ul className="mt-6 space-y-2.5 text-sm text-zinc-300">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400"
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
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-[11px] uppercase tracking-widest text-zinc-500">
                  Base : {formaterEuros(f.abonnementBase)} ·{" "}
                  {f.conversationsIncluses} conversations incluses
                </p>
              </button>
            );
          })}
        </div>

        {/* ─── Récap et CTA ─── */}
        <div className="mt-14 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 md:p-12">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-5">
            <div className="md:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Votre formule sélectionnée
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {FORMULES.find((f) => f.slug === choix)?.nom}{" "}
                <span className="text-amber-400">
                  — {formaterEuros(prixParFormule[choix])}/mois HT
                </span>
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
                Tarif estimatif sur la base de{" "}
                {formaterVisiteurs(visiteurs)} visiteurs par mois.
                Prêt à passer à l&apos;action ? AxiSolver vous
                explique tout en direct et prend votre souscription.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 md:col-span-2 md:items-center">
              <BoutonLancerAxiSolver libelle="Parlez à AxiSolver" />
              <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                Vocal ou écrit · Toutes langues
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-zinc-500">
          Les tarifs présentés sont indicatifs et HT. Devis
          personnalisé à la signature.
        </p>
      </div>
    </section>
  );
}
