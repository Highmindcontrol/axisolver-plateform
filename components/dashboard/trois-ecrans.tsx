"use client";

import { useState } from "react";

import { AxiChatCopilote, type ConfigAxiChat } from "@/lib/packs/axi-chat";

import { AiletteCarnet, type OrdreSession } from "./ailette-carnet";
import { AiletteChantiers } from "./ailette-chantiers";

type SiteChantier = {
  slug: string;
  nomEntreprise: string;
  domainePrincipal: string;
  verifie: boolean;
  conversationsMois: number;
};

/**
 * Triptyque dashboard — consomme le pack @axi-chat (variante
 * back-office-copilote) et lui fournit les ailettes gauche (sites) +
 * droite (carnet de session) via les slots du composant.
 *
 * Toute la logique de chat (messages, saisie, envoi backend, thème)
 * vit maintenant dans le pack. Ce composant ne connaît QUE les
 * spécificités AxiSolver (sites, carnet).
 */
export function TroisEcrans({
  prenom,
  sites,
}: {
  prenom: string | null;
  sites: ReadonlyArray<SiteChantier>;
}) {
  const [ordresSession] = useState<OrdreSession[]>([]);

  const config: ConfigAxiChat = {
    channel: "back-office-copilote",
    theme: { mode: "sombre" },
    contexte: {
      prenomUtilisateur: prenom,
      nomAssistant: "AXI",
      sousTitre: "Votre copilote AxiSolver",
      langue: "fr",
    },
    endpoints: {
      // Endpoint à brancher dans un prochain lot ; tant qu'il n'existe
      // pas, le composant affiche l'accueil et récupère une erreur
      // propre si l'utilisateur envoie un message.
      urlChat: "/api/dashboard/chat",
    },
    fonctionnalites: {
      dictee: false,
      piecesJointes: false,
      voixSynthese: false,
      suggestionsRapides: false,
    },
  };

  return (
    <AxiChatCopilote
      config={config}
      aileteGauche={<AiletteChantiers sites={sites} />}
      aileteDroite={<AiletteCarnet ordres={ordresSession} />}
    />
  );
}
