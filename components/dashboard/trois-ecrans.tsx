"use client";

import { useState } from "react";

import { AiletteCarnet, type OrdreSession } from "./ailette-carnet";
import { AiletteChantiers } from "./ailette-chantiers";
import { ChatAxiInterne } from "./chat-axi-interne";

type SiteChantier = {
  slug: string;
  nomEntreprise: string;
  domainePrincipal: string;
  verifie: boolean;
  conversationsMois: number;
};

/**
 * <TroisEcrans> — bloc 3 colonnes dashboard : ailette sites (gauche)
 * + chat AXI permanent (centre) + carnet de session (droite).
 *
 * Reproduit la structure AxiHub pour homogénéiser l'écosystème.
 */
export function TroisEcrans({
  prenom,
  sites,
}: {
  prenom: string | null;
  sites: ReadonlyArray<SiteChantier>;
}) {
  // Les ordres pris pendant la session courante — vides au prochain
  // rendu server. Le chat AXI alimentera cette liste lorsqu'il
  // orchestrera des actions (ingérer un PDF, créer un site, etc.).
  const [ordresSession] = useState<OrdreSession[]>([]);

  return (
    <section
      className="relative flex items-stretch gap-4 md:gap-6"
      style={{ height: "68vh", minHeight: "600px" }}
    >
      <aside className="hidden min-w-0 flex-[0_0_29%] self-stretch pt-10 md:block">
        <AiletteChantiers sites={sites} />
      </aside>

      <div
        aria-hidden
        className="hidden w-px self-stretch bg-gradient-to-b from-transparent via-slate-600/40 to-transparent md:block"
      />

      <main className="relative z-10 flex min-w-0 flex-1 flex-col pt-10">
        <ChatAxiInterne prenom={prenom} />
      </main>

      <div
        aria-hidden
        className="hidden w-px self-stretch bg-gradient-to-b from-transparent via-slate-600/40 to-transparent md:block"
      />

      <aside className="hidden min-w-0 flex-[0_0_29%] self-stretch pt-10 md:block">
        <AiletteCarnet ordres={ordresSession} />
      </aside>
    </section>
  );
}
