"use client";

import { useMemo, useState } from "react";
import { BoutonLancerAxiSolver } from "@/components/chat/bouton-lancer";
import { SECTEURS, type SlugSecteur } from "@/lib/axi-solver/secteurs";

/**
 * Simulateur tarifaire AxiSolver — client component.
 *
 * Modèle :
 *   - Taux d'utilisation (visiteurs qui engagent une conversation)
 *     calibré selon le type d'activité du site (voir lib/secteurs.ts
 *     pour les sources). Peut être ajusté manuellement.
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

function calculerPrix(
  formule: Formule,
  visiteursMois: number,
  tauxPct: number,
): number {
  const conversationsMois = Math.ceil(visiteursMois * (tauxPct / 100));
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
  const [secteurSlug, setSecteurSlug] = useState<SlugSecteur>("ecommerce");

  const secteur = useMemo(
    () =>
      SECTEURS.find((s) => s.slug === secteurSlug) ?? SECTEURS[0],
    [secteurSlug],
  );

  // Taux ajustable manuellement, initialisé sur la valeur typique
  // du secteur. Resynchronisé quand le secteur change.
  const [tauxPct, setTauxPct] = useState(secteur.tauxUtilisation);
  const [tauxManuel, setTauxManuel] = useState(false);

  // Si l'utilisateur change de secteur, on remet le taux par défaut
  // du secteur SAUF s'il a explicitement bougé le taux.
  function changerSecteur(slug: SlugSecteur) {
    setSecteurSlug(slug);
    const sec = SECTEURS.find((s) => s.slug === slug);
    if (sec) {
      setTauxPct(sec.tauxUtilisation);
      setTauxManuel(false);
    }
  }

  const conversationsEstimees = useMemo(
    () => Math.ceil(visiteurs * (tauxPct / 100)),
    [visiteurs, tauxPct],
  );

  const prixParFormule = useMemo(
    () =>
      Object.fromEntries(
        FORMULES.map((f) => [f.slug, calculerPrix(f, visiteurs, tauxPct)]),
      ) as Record<SlugFormule, number>,
    [visiteurs, tauxPct],
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

        {/* ─── Type d'activité ─── */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
            Votre type d&apos;activité
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:max-w-xl">
            Chaque activité a son propre taux d&apos;utilisation
            typique. Choisissez celle qui correspond le mieux —
            AxiSolver pré-remplira le taux moyen observé dans
            l&apos;industrie pour ce secteur.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SECTEURS.map((s) => {
              const estSelectionne = secteurSlug === s.slug;
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => changerSecteur(s.slug)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                    estSelectionne
                      ? "border-amber-400 bg-amber-400/10 text-white"
                      : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-amber-400/40 hover:bg-zinc-900"
                  }`}
                  aria-pressed={estSelectionne}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{s.nom}</span>
                    <span
                      className={`font-mono text-xs ${
                        estSelectionne ? "text-amber-300" : "text-zinc-500"
                      }`}
                    >
                      ~{s.tauxUtilisation}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs leading-relaxed text-zinc-400">
            {secteur.description}{" "}
            <span className="text-zinc-300">
              Fourchette typique observée : {secteur.fourchette[0]}%
              à {secteur.fourchette[1]}%.
            </span>
          </p>
        </div>

        {/* ─── Potard volumétrie ─── */}
        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Volume de visiteurs
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:max-w-md">
                Combien de visiteurs mensuels pour votre site ?
                Avec le secteur{" "}
                <span className="text-white">« {secteur.nom} »</span>,
                on estime qu&apos;environ{" "}
                <span className="text-white">{tauxPct}%</span>{" "}
                engagent une conversation.
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

          {/* Ajustement manuel du taux d'utilisation */}
          <div className="mt-8 border-t border-zinc-800 pt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Taux d&apos;utilisation{" "}
                {tauxManuel && (
                  <span className="normal-case tracking-normal text-zinc-500">
                    (ajusté manuellement)
                  </span>
                )}
              </p>
              <p className="font-mono text-lg font-semibold text-white">
                {tauxPct}%
              </p>
            </div>
            <input
              type="range"
              min={0.1}
              max={30}
              step={0.1}
              value={tauxPct}
              onChange={(e) => {
                setTauxPct(Number(e.target.value));
                setTauxManuel(true);
              }}
              className="mt-3 w-full accent-amber-400"
              aria-label="Taux d'utilisation en pourcentage"
            />
            <div className="mt-2 flex justify-between text-[11px] uppercase tracking-widest text-zinc-500">
              <span>0,1%</span>
              <span>30%</span>
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

        {/* ─── Sources des taux d'utilisation ─── */}
        <aside className="mt-14 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
            D&apos;où viennent nos chiffres ?
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            Les taux d&apos;utilisation proposés par activité sont
            calibrés à partir de plusieurs études publiques et
            rapports de benchmark sur l&apos;usage réel des chatbots
            et widgets de chat sur les sites web :
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-400 md:text-base">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              <span>
                <a
                  href="https://www.smartsupp.com/blog/analysing-5-billion-website-visits-how-ecommerce-customers-use-chat/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-300 hover:text-amber-200"
                >
                  Smartsupp
                </a>{" "}
                — « Analysing 5 billion website visits : how ecommerce
                customers use chat » (2024). Analyse de 5 milliards de
                visites : 0,84 % des visiteurs engagent une
                conversation avec un widget réactif typique, base
                servant de plancher pour les sites éditoriaux et
                vitrines.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              <span>
                <a
                  href="https://wisepops.com/blog/state-of-visitor-engagement-on-shopify-stores"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-300 hover:text-amber-200"
                >
                  Wisepops
                </a>{" "}
                — « The State of Visitor Engagement on Shopify Stores ».
                54 % des boutiques Shopify sont équipées en 2026 (vs
                24 % en 2018). Fourchette e-commerce 1,5 % à 5 %
                d&apos;engagement selon le panier moyen et le type de
                produit.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              <span>
                <a
                  href="https://www.tidio.com/blog/live-chat-statistics/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-300 hover:text-amber-200"
                >
                  Tidio
                </a>{" "}
                — « Live Chat Statistics » (2024-2025). Les visiteurs
                qui engagent une conversation sont 2,8 × plus
                susceptibles de convertir et dépensent 60 % de plus
                que les non-utilisateurs. Lift de conversion moyen
                : +20 %.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              <span>
                <a
                  href="https://www.chatbot.com/blog/chatbot-statistics/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-300 hover:text-amber-200"
                >
                  chatbot.com
                </a>{" "}
                — « Key Chatbot Statistics » (2026). Widgets réactifs
                classiques 2-5 % d&apos;engagement, widgets proactifs
                triggered 8-15 %, pics à 35-40 % sur B2B SaaS avec
                prompt pertinent (données Drift).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              <span>
                <a
                  href="https://www.zoom.com/en/blog/chatbot-statistics/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-300 hover:text-amber-200"
                >
                  Zoom — 65+ chatbot statistics
                </a>{" "}
                (2025). Scénarios post-achat et support client :
                15 % à 30 % des visiteurs engagent une conversation
                car ils arrivent avec un besoin concret.
              </span>
            </li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-zinc-500">
            AxiSolver, par son modèle d&apos;ouverture modale
            plein écran et sa promesse « AXI qui résout vraiment »,
            se positionne en haut de fourchette vs un chatbot
            classique. Les chiffres par défaut représentent une
            estimation prudente — l&apos;usage réel se mesurera
            avec les premiers mois de production.
          </p>
        </aside>

        <p className="mt-10 text-center text-xs text-zinc-500">
          Les tarifs présentés sont indicatifs et HT. Devis
          personnalisé à la signature.
        </p>
      </div>
    </section>
  );
}
