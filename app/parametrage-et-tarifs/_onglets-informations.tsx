"use client";

import { useState } from "react";
import { AsideSources } from "./_sources";

/**
 * Composant à 2 onglets en bas de la page /parametrage-et-tarifs :
 *   1. « Pour bien comprendre nos tarifs » — explication du modèle 3
 *      formules (ce qui coûte, c'est la voix ; 3 niveaux proposés).
 *   2. « Nos sources » — bibliographie des taux d'engagement utilisés
 *      par le simulateur, pour transparence.
 *
 * Les sources justifient la grille — logiquement regroupées avec
 * la pédagogie tarifaire. Un seul encadré visuel, deux onglets.
 */
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

        {onglet === "comprendre" ? (
          <aside className="rounded-2xl border-l-4 border-amber-400 border-y border-r border-zinc-800 bg-zinc-900/60 p-6 md:p-10">
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
                C&apos;est pour cette raison que, afin qu&apos;AxiSolver
                soit accessible à{" "}
                <span className="font-semibold text-white">
                  tous les budgets
                </span>
                , nous vous le proposons en{" "}
                <span className="text-amber-300">trois versions</span> :
              </p>
              <ul className="ml-1 space-y-2.5">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                  <span>
                    la version{" "}
                    <span className="font-semibold text-white">
                      sans voix
                    </span>{" "}
                    — tout l&apos;écrit, aucune diffusion vocale ;
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
                    — ultra-réalistes, indiscernables d&apos;un humain.
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
          </aside>
        ) : (
          <AsideSources />
        )}
      </div>
    </section>
  );
}
