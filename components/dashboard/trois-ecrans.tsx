"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { AxiChatCopilote, type ConfigAxiChat } from "@/lib/packs/axi-chat";

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
 * Les deux colonnes latérales (ailettes) sont présentes pour
 * accueillir du contenu dynamique AU FUR ET À MESURE (ex: documents
 * consultés par AXI, ordres pris pendant la conversation) — on ne
 * polLue pas l'écran avec des titres ou des listes statiques.
 *
 * Contextualisation par site : si l'URL contient /dashboard/sites/[slug],
 * la conversation est focalisée sur CE site (son contexte, son
 * historique). Sinon, chat global écosystème.
 */
export function TroisEcrans({
  prenom,
  sites,
}: {
  prenom: string | null;
  sites: ReadonlyArray<SiteChantier>;
}) {
  const pathname = usePathname();

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
      },
      fonctionnalites: {
        dictee: false,
        piecesJointes: false,
        voixSynthese: false,
        suggestionsRapides: false,
      },
      accueilPersonnalise: accueil,
    };
  }, [prenom, siteCourant]);

  // Ailettes volontairement vides à l'ouverture — elles se rempliront
  // au fil de la conversation (actions AXI, documents, ordres). Les
  // deux traits verticaux restent affichés en permanence.
  return (
    <AxiChatCopilote
      config={config}
      aileteGauche={null}
      aileteDroite={null}
    />
  );
}
