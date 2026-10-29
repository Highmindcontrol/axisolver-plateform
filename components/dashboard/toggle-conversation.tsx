"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { TroisEcrans } from "./trois-ecrans";

type SiteChantier = {
  slug: string;
  nomEntreprise: string;
  domainePrincipal: string;
  verifie: boolean;
  conversationsMois: number;
};

/**
 * Barre « Converser avec AXI » qui remplace l'ancienne BandePouls.
 *
 * Pleine largeur, collée en haut du contenu principal, sans radius —
 * elle fait office de header de la zone centrale. Clic → déplie le
 * triptyque (ailette sites + chat AXI + carnet de session) juste en
 * dessous. Second clic → replie. Rien d'autre entre la sidebar et
 * cette barre.
 */
export function ToggleConversation({
  prenom,
  sites,
}: {
  prenom: string | null;
  sites: ReadonlyArray<SiteChantier>;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        aria-controls="panneau-conversation-axi"
        className="group relative flex w-full items-center justify-between gap-5 overflow-hidden border-b border-slate-200 bg-white px-6 py-6 text-left transition-colors hover:bg-slate-50 md:px-14 lg:px-16"
      >
        {/* Reflet lumineux fin qui traverse de gauche à droite toutes
            les 7 secondes pour signaler que le bouton est vivant.
            Blanc translucide + léger blur, effet verre. */}
        {!ouvert && (
          <span
            aria-hidden
            className="animate-toggleShine pointer-events-none absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-[2px]"
          />
        )}

        <div className="relative flex items-center gap-5">
          <span
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 p-1.5 shadow-md ring-1 ring-slate-900/10"
            aria-hidden
          >
            <Image
              src="/axi-mascotte-bouton.png"
              alt=""
              width={160}
              height={160}
              priority
              className="h-full w-full object-contain"
            />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">
              {ouvert ? "Conversation avec AXI" : "Converser avec AXI"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {ouvert
                ? "Fermer la fenêtre de conversation."
                : "Ouvrez le copilote AxiSolver — configuration, questions, actions."}
            </p>
          </div>
        </div>
        <span
          className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all group-hover:border-indigo-300 group-hover:text-indigo-700 ${
            ouvert ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </button>

      {ouvert && (
        <div
          id="panneau-conversation-axi"
          className="relative flex flex-col overflow-hidden border-b border-slate-200"
        >
          <BackdropFondu />
          <div className="relative z-10 px-6 py-10 md:px-14 lg:px-16">
            <TroisEcrans prenom={prenom} sites={sites} />
          </div>
        </div>
      )}
    </>
  );
}

function BackdropFondu() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50" />
      <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-violet-300/25 blur-3xl" />
    </div>
  );
}
