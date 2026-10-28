"use client";

import { useState } from "react";

/**
 * Composant à 2 onglets en bas de la page /parametrage-et-tarifs :
 *   1. « Pour bien comprendre nos tarifs » — explication du modèle 3
 *      formules (ce qui coûte, c'est la voix ; 3 niveaux proposés).
 *   2. « Nos sources » — bibliographie des taux d'engagement utilisés
 *      par le simulateur, pour transparence.
 *
 * Les deux onglets partagent la même mise en page : un aside de même
 * largeur, bordure amber, padding identique.
 */

type Source = {
  nom: string;
  url: string;
  description: string;
};

const SOURCES_SECTORIELLES: Source[] = [
  {
    nom: "Smartsupp",
    url: "https://www.smartsupp.com/blog/analysing-5-billion-website-visits-how-ecommerce-customers-use-chat/",
    description:
      "« Analysing 5 billion website visits : how ecommerce customers use chat » (2024). Analyse de 5 milliards de visites : 0,84 % des visiteurs engagent une conversation avec un widget réactif typique — base servant de plancher pour les sites éditoriaux et vitrines.",
  },
  {
    nom: "Wisepops",
    url: "https://wisepops.com/blog/state-of-visitor-engagement-on-shopify-stores",
    description:
      "« The State of Visitor Engagement on Shopify Stores ». 54 % des boutiques Shopify sont équipées en 2026 (vs 24 % en 2018). Fourchette e-commerce 1,5 % à 5 % d'engagement selon le panier moyen et le type de produit.",
  },
  {
    nom: "Tidio",
    url: "https://www.tidio.com/blog/live-chat-statistics/",
    description:
      "« Live Chat Statistics » (2024-2025). Les visiteurs qui engagent une conversation sont 2,8 × plus susceptibles de convertir et dépensent 60 % de plus que les non-utilisateurs. Lift de conversion moyen : +20 %.",
  },
  {
    nom: "chatbot.com",
    url: "https://www.chatbot.com/blog/chatbot-statistics/",
    description:
      "« Key Chatbot Statistics » (2026). Widgets réactifs classiques 2-5 % d'engagement, widgets proactifs triggered 8-15 %, pics à 35-40 % sur B2B SaaS avec prompt pertinent (données Drift).",
  },
  {
    nom: "Zoom — 65+ chatbot statistics",
    url: "https://www.zoom.com/en/blog/chatbot-statistics/",
    description:
      "« 65+ chatbot statistics » (2025). Scénarios post-achat et support client : 15 % à 30 % des visiteurs engagent une conversation car ils arrivent avec un besoin concret.",
  },
  {
    nom: "Which-50 / Stealth Agents",
    url: "https://which-50.com/live-chat-engagement-rate-benchmarks/",
    description:
      "« Live Chat Engagement Rate Benchmarks » et « Live Chat Support Statistics 2026 ». Fourchette générale 5-15 % de visiteurs qui chattent ; < 3 % = widget invisible ; 6,6 % = taux d'acceptation moyen d'une invitation proactive.",
  },
  {
    nom: "Realty-AI",
    url: "https://www.realty-ai.com/blog/real-estate-ai-chatbot-statistics",
    description:
      "« Real Estate Chatbot Statistics » (2026). Agence solo 8-12 %, petites 10-15 %, grandes 12-18 %. Case study : 12 % chat vs 2,5 % formulaire (+380 %).",
  },
  {
    nom: "Pareto Legal",
    url: "https://pareto.legal/legal-client-intake-statistics/",
    description:
      "« Legal Client Intake Statistics 2026 ». Cabinets juridiques : chat-to-conversion 10-20 % vs formulaires 2-3 % ; +40 % de prises de RDV avec chatbot (LawSEO 2025) ; 79 % des law firms US ont piloté une IA en 2024 (Lexscale).",
  },
  {
    nom: "Rock Health",
    url: "https://www.fiercehealthcare.com/ai-and-machine-learning/ai-chatbot-use-health-information-16-2024-rock-health-survey",
    description:
      "« 2025 Consumer Adoption of Digital Health Survey ». 32 % des consommateurs utilisent un chatbot IA pour trouver de l'info santé (vs 16 % en 2024). MGMA Stat avril 2025 : 19 % des cabinets médicaux ont déployé un chatbot.",
  },
];

export function OngletsInformations() {
  const [onglet, setOnglet] = useState<"comprendre" | "sources">(
    "comprendre",
  );

  return (
    <section className="border-t border-zinc-900 bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setOnglet("comprendre")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-widest transition-colors ${
              onglet === "comprendre"
                ? "bg-amber-400 text-zinc-950"
                : "border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-amber-400/40 hover:text-amber-300"
            }`}
            aria-pressed={onglet === "comprendre"}
          >
            Pour bien comprendre nos tarifs
          </button>
          <button
            type="button"
            onClick={() => setOnglet("sources")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-widest transition-colors ${
              onglet === "sources"
                ? "bg-amber-400 text-zinc-950"
                : "border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-amber-400/40 hover:text-amber-300"
            }`}
            aria-pressed={onglet === "sources"}
          >
            Nos sources
          </button>
        </div>

        <aside className="rounded-2xl border-l-4 border-amber-400 border-y border-r border-zinc-800 bg-zinc-900/60 p-6 md:p-10">
          {onglet === "comprendre" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Pour bien comprendre nos tarifs
              </p>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-zinc-200 md:text-lg">
                <p>
                  Dans le domaine de l&apos;intelligence artificielle, ce
                  qui compte et qui{" "}
                  <span className="font-semibold text-white">
                    coûte le plus
                  </span>
                  , c&apos;est la{" "}
                  <span className="font-semibold text-white">
                    diffusion vocale
                  </span>{" "}
                  — en particulier lorsqu&apos;on utilise des voix de
                  haute qualité.
                </p>
                <p>
                  C&apos;est pour cette raison que, afin
                  qu&apos;AxiSolver soit accessible à{" "}
                  <span className="font-semibold text-white">
                    tous les budgets
                  </span>
                  , nous vous le proposons en{" "}
                  <span className="text-amber-300">trois versions</span>{" "}
                  :
                </p>
                <ul className="ml-1 space-y-2.5">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                    <span>
                      la version{" "}
                      <span className="font-semibold text-white">
                        sans voix
                      </span>{" "}
                      — tout à l&apos;écrit, aucune diffusion vocale ;
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                    <span>
                      la version avec une{" "}
                      <span className="font-semibold text-white">
                        voix de grande qualité
                      </span>
                      , mais encore légèrement robotisée ;
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                    <span>
                      et les{" "}
                      <span className="font-semibold text-white">
                        voix précieuses de chez ElevenLabs
                      </span>{" "}
                      — ultra-réalistes, indiscernables d&apos;un
                      humain.
                    </span>
                  </li>
                </ul>
                <p>
                  Votre tarif sera{" "}
                  <span className="font-semibold text-white">
                    directement lié à ce choix
                  </span>
                  . Les sources des taux d&apos;engagement utilisés par
                  notre simulateur sont consultables dans l&apos;onglet
                  voisin.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                D&apos;où viennent nos chiffres ?
              </p>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Tous les taux par secteur sont{" "}
                <span className="text-amber-400">
                  sourcés publiquement.
                </span>
              </h3>
              <p className="mt-5 text-base leading-relaxed text-zinc-300 md:text-lg">
                Les taux d&apos;utilisation proposés dans le
                questionnaire sont calibrés à partir de neuf études
                publiques et rapports de benchmark 2024-2026 sur
                l&apos;usage réel des chatbots et widgets de chat.
              </p>

              <ul className="mt-8 space-y-5 text-sm leading-relaxed text-zinc-300 md:text-base">
                {SOURCES_SECTORIELLES.map((s) => (
                  <li key={s.nom} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                    <span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-amber-300 hover:text-amber-200"
                      >
                        {s.nom}
                      </a>{" "}
                      — {s.description}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-xs leading-relaxed text-zinc-500">
                AxiSolver, par son modèle d&apos;ouverture modale plein
                écran et sa promesse « AXI qui résout vraiment », se
                positionne en haut de fourchette vs un chatbot
                classique. Les taux par défaut représentent une
                estimation prudente — l&apos;usage réel se mesure avec
                les premiers mois de production.
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
