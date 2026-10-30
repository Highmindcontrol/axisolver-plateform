"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AxiChatCopilote,
  type ConfigAxiChat,
  type OrdreAxi,
  type RepereAxi,
} from "@/lib/packs/axi-chat";

import { AiletteOrdres } from "./ailette-ordres";
import { AiletteReperes } from "./ailette-reperes";

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
 *
 * Multi-conversations : on garde en localStorage le filId actif par
 * site (clé `axichat::fil-courant::<slug ou GLOBAL>`). Un
 * CustomEvent `axichat-fil-change` est écouté pour détecter les
 * bascules déclenchées depuis le journal des conversations.
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
  const [reperes, setReperes] = useState<RepereAxi[]>([]);
  const [filIdActif, setFilIdActif] = useState<string | null>(null);

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

  const cleStorage = `axichat::fil-courant::${siteCourant?.slug ?? "GLOBAL"}`;

  // Hydrate depuis localStorage à chaque changement de site
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stocke = window.localStorage.getItem(cleStorage);
    setFilIdActif(stocke);
    // On réinitialise aussi l'ailette d'ordres au changement de site
    setOrdres([]);
    setReperes([]);
  }, [cleStorage]);

  // Écoute les bascules de fil depuis le journal
  useEffect(() => {
    function surChange(ev: Event) {
      const e = ev as CustomEvent<string>;
      const nouveauId = typeof e.detail === "string" ? e.detail : null;
      if (nouveauId) setFilIdActif(nouveauId);
      setOrdres([]);
    setReperes([]);
    }
    window.addEventListener("axichat-fil-change", surChange);
    return () => window.removeEventListener("axichat-fil-change", surChange);
  }, []);

  const surOrdre = useCallback((ordre: OrdreAxi) => {
    setOrdres((prev) => {
      if (prev.some((o) => o.id === ordre.id)) return prev;
      return [...prev, ordre];
    });
  }, []);

  const surRepere = useCallback((repere: RepereAxi) => {
    setReperes((prev) => {
      if (prev.some((r) => r.id === repere.id)) return prev;
      return [...prev, repere];
    });
  }, []);

  const config: ConfigAxiChat = useMemo(() => {
    const nomSiteCourant = siteCourant?.nomEntreprise;
    const accueil = nomSiteCourant
      ? `Bonjour. On regarde ${nomSiteCourant} ensemble ? Dites-moi ce que vous voulez voir ou faire.`
      : `Bonjour. Dites-moi ce que vous voulez voir ou faire.`;

    // Header X-Axi-Fil-Id : si on a un fil actif, on l'envoie côté
    // serveur pour qu'il recharge CE fil précis (bascule depuis
    // journal) au lieu du dernier fil actif du site.
    const entetes: Record<string, string> = {};
    if (filIdActif) {
      entetes["X-Axi-Fil-Id"] = filIdActif;
    }

    // urlHistorique : utilise /fil/[id] si un fil précis est sélectionné,
    // sinon /fil?siteSlug=... pour prendre le dernier actif du site.
    const urlHistorique = filIdActif
      ? `/api/dashboard/chat/fil/${filIdActif}`
      : siteCourant
        ? `/api/dashboard/chat/fil?siteSlug=${encodeURIComponent(siteCourant.slug)}`
        : "/api/dashboard/chat/fil";

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
        urlHistorique,
        urlDictee: "/api/transcrire",
        urlVoix: "/api/synthese-vocale",
        entetes: Object.keys(entetes).length > 0 ? entetes : undefined,
      },
      fonctionnalites: {
        dictee: true,
        piecesJointes: false,
        voixSynthese: true,
        suggestionsRapides: false,
      },
      accueilPersonnalise: accueil,
      surOrdre,
      surRepere,
      // Pas d'entête interne au chat : le bouton « Nouvelle conversation »
      // vit dans la barre toggle au-dessus, et le titre AXI serait
      // redondant avec « Conversation avec AXI ».
      avecEntete: false,
      // cleReload change à chaque bascule → force le re-fetch de
      // l'historique et le reset du brouillon dans le pack.
      cleReload: `${siteCourant?.slug ?? "GLOBAL"}::${filIdActif ?? "DEFAUT"}`,
    };
  }, [prenom, siteCourant, surOrdre, surRepere, filIdActif]);

  return (
    <AxiChatCopilote
      config={config}
      aileteGauche={<AiletteReperes reperes={reperes} />}
      aileteDroite={<AiletteOrdres ordres={ordres} />}
    />
  );
}
