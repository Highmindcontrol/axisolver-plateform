"use client";

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  AxiChatCopilote,
  type ConfigAxiChat,
  type OrdreAxi,
} from "@/lib/packs/axi-chat";

import { AiletteOrdres } from "./ailette-ordres";

type SiteChantier = {
  slug: string;
  nomEntreprise: string;
};

/**
 * Triptyque dashboard — consomme le pack @axi-chat (variante
 * back-office-copilote).
 *
 * Doctrine UI : à l'ouverture, l'écran est volontairement vide.
 * Seul le message d'accueil d'AXI et la zone de saisie sont visibles.
 * L'ailette droite se remplit AU FUR ET À MESURE que AXI prend des
 * actions (appels de tools côté serveur).
 */
export function TroisEcrans({
  prenom,
  sites,
}: {
  prenom: string | null;
  sites: ReadonlyArray<SiteChantier>;
}) {
  const pathname = usePathname();
  const [ordres, setOrdres] = useState<OrdreAxi[]>([]);

  // Détection du site courant via l'URL
  const siteCourant = useMemo(() => {
    if (!pathname) return null;
    const m = pathname.match(/\/dashboard\/sites\/([^/]+)/);
    if (!m) return null;
    const slug = m[1];
    if (slug === "nouveau") return null;
    const site = sites.find((s) => s.slug === slug);
    return site ?? { slug, nomEntreprise: slug };
  }, [pathname, sites]);

  const surOrdre = useCallback((ordre: OrdreAxi) => {
    setOrdres((prev) => {
      // Dédup par id (évite doublons si AXI renvoie le même ordre)
      if (prev.some((o) => o.id === ordre.id)) return prev;
      return [...prev, ordre];
    });
  }, []);

  const config: ConfigAxiChat = useMemo(() => {
    const nomSiteCourant = siteCourant?.nomEntreprise;
    const accueil = nomSiteCourant
      ? `Bonjour. On regarde ${nomSiteCourant} ensemble ? Dites-moi ce que vous voulez voir ou faire.`
      : `Bonjour. Dites-moi ce que vous voulez voir ou faire.`;

    return {
      channel: "back-office-copilote",
      theme: { mode: "sombre" },
      contexte: {
        prenomUtilisateur: prenom,
        nomAssistant: "AXI",
        sousTitre: siteCourant
          ? `Copilote — ${siteCourant.nomEntreprise}`
          : "Copilote AxiSolver",
        langue: "fr",
        siteId: siteCourant?.slug ?? undefined,
      },
      endpoints: {
        urlChat: "/api/dashboard/chat",
        urlHistorique: siteCourant
          ? `/api/dashboard/chat/fil?siteSlug=${encodeURIComponent(siteCourant.slug)}`
          : "/api/dashboard/chat/fil",
        urlDictee: "/api/transcrire",
        urlVoix: "/api/synthese-vocale",
      },
      fonctionnalites: {
        dictee: true,
        piecesJointes: false,
        voixSynthese: true,
        suggestionsRapides: false,
      },
      accueilPersonnalise: accueil,
      surOrdre,
    };
  }, [prenom, siteCourant, surOrdre]);

  return (
    <AxiChatCopilote
      config={config}
      aileteGauche={null}
      aileteDroite={<AiletteOrdres ordres={ordres} />}
    />
  );
}
