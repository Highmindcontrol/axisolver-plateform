"use client";

import { ChevronDown, MessagesSquare, Sparkles } from "lucide-react";
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
 * Enveloppe « replié par défaut » autour du bloc 3 écrans.
 *
 * À l'arrivée sur /dashboard, seul le gros bouton « Converser avec
 * AXI » s'affiche. Un clic déplie le triptyque (ailette sites + chat
 * AXI + carnet de session). Un second clic replie.
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
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        aria-controls="panneau-conversation-axi"
        className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-white/50 bg-white/80 px-6 py-5 text-left shadow-sm backdrop-blur transition-all hover:border-indigo-300 hover:shadow-md"
      >
        <div className="flex items-center gap-4">
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 text-white shadow-md shadow-indigo-500/30"
            aria-hidden
          >
            <Sparkles className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">
              {ouvert
                ? "Conversation avec AXI"
                : "Converser avec AXI"}
            </p>
            <p className="mt-0.5 text-sm text-slate-600">
              {ouvert
                ? "Fermer la fenêtre de conversation pour revenir au tableau de bord."
                : "Ouvrez le copilote AxiSolver pour configurer vos sites, poser des questions, piloter vos actions."}
            </p>
          </div>
        </div>
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all group-hover:border-indigo-300 group-hover:text-indigo-700 ${
            ouvert ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </button>

      {ouvert && (
        <div id="panneau-conversation-axi" className="mt-6 animate-fadeIn">
          <TroisEcrans prenom={prenom} sites={sites} />
        </div>
      )}

      {!ouvert && (
        <PanneauReplie prenom={prenom} nbSites={sites.length} />
      )}
    </div>
  );
}

function PanneauReplie({
  prenom,
  nbSites,
}: {
  prenom: string | null;
  nbSites: number;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-white/40 bg-white/60 p-6 text-sm text-slate-700 shadow-sm backdrop-blur">
      <div className="flex items-start gap-3">
        <MessagesSquare
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-700"
          strokeWidth={2}
          aria-hidden
        />
        <div>
          <p className="font-medium text-slate-900">
            {prenom ? `Bonjour ${prenom}.` : "Bonjour."} Votre tableau
            de bord est prêt.
          </p>
          <p className="mt-1 leading-relaxed text-slate-600">
            Vous gérez{" "}
            <strong className="font-semibold text-slate-900">
              {nbSites} site{nbSites > 1 ? "s" : ""}
            </strong>
            . Utilisez les onglets de la barre du bas pour naviguer, ou
            lancez une conversation avec AXI quand vous en avez besoin.
          </p>
        </div>
      </div>
    </div>
  );
}
