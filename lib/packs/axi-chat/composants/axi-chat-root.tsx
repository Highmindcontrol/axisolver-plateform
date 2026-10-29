"use client";

import { useState } from "react";

import { useTheme } from "../theme/use-theme";
import type { ConfigAxiChat, MessageAxi, SuggestionRapide } from "../types";

import { BulleMessage } from "./bulle-message";
import { EnteteChat } from "./entete-chat";
import { SuggestionsRapides } from "./suggestions-rapides";
import { ZoneSaisie } from "./zone-saisie";

/**
 * Composant racine du pack @axi-chat.
 *
 * Pose les CSS variables de thème sur son conteneur et compose
 * entête + liste de messages + suggestions + zone de saisie.
 *
 * Est utilisé tel quel par les variantes (back-office-copilote,
 * widget-flottant, plein-ecran…) qui lui donnent juste un wrapper
 * de layout spécifique.
 */
export function AxiChatRoot({ config }: { config: ConfigAxiChat }) {
  const { variablesCss } = useTheme(config.theme);

  const [messages, setMessages] = useState<MessageAxi[]>(() => {
    if (config.messagesInitiaux && config.messagesInitiaux.length > 0) {
      return config.messagesInitiaux;
    }
    return [messageAccueil(config)];
  });
  const [brouillon, setBrouillon] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const suggestionsCourantes =
    messages.length > 0 &&
    messages[messages.length - 1].role === "axi" &&
    (messages[messages.length - 1].suggestions?.length ?? 0) > 0
      ? messages[messages.length - 1].suggestions ?? []
      : [];

  function envoyer(texte: string) {
    const contenu = texte.trim();
    if (!contenu || envoiEnCours) return;
    const msgVisiteur: MessageAxi = {
      id: `v-${Date.now()}`,
      role: "visiteur",
      contenu,
      horodatage: new Date(),
    };
    setMessages((prev) => [...prev, msgVisiteur]);
    config.surMessage?.(msgVisiteur);
    setBrouillon("");

    setEnvoiEnCours(true);
    appelerBackend(config, [...messages, msgVisiteur])
      .then((reponse) => {
        setMessages((prev) => [...prev, reponse]);
        config.surMessage?.(reponse);
      })
      .catch((e) => {
        const erreur: MessageAxi = {
          id: `s-${Date.now()}`,
          role: "systeme",
          contenu:
            e instanceof Error && e.message
              ? e.message
              : "AXI est momentanément indisponible. Réessayez.",
        };
        setMessages((prev) => [...prev, erreur]);
      })
      .finally(() => setEnvoiEnCours(false));
  }

  return (
    <div
      className="flex h-full flex-col"
      style={{
        ...variablesCss,
        fontFamily: "var(--axi-chat-police)",
        color: "var(--axi-chat-texte)",
      }}
    >
      <EnteteChat contexte={config.contexte} />

      <div className="flex-1 space-y-3 overflow-y-auto py-2">
        {messages.map((m) => (
          <BulleMessage key={m.id} message={m} />
        ))}
      </div>

      {config.fonctionnalites?.suggestionsRapides &&
        suggestionsCourantes.length > 0 && (
          <SuggestionsRapides
            suggestions={suggestionsCourantes}
            onChoisir={(t) => envoyer(t)}
          />
        )}

      <ZoneSaisie
        valeur={brouillon}
        onChange={setBrouillon}
        onEnvoyer={() => envoyer(brouillon)}
        placeholder={config.placeholderSaisie}
        fonctionnalites={config.fonctionnalites}
        envoiDesactive={envoiEnCours}
      />
    </div>
  );
}

function messageAccueil(config: ConfigAxiChat): MessageAxi {
  const prenom = config.contexte?.prenomUtilisateur;
  const nom = config.contexte?.nomAssistant ?? "AXI";
  const marque = config.contexte?.sousTitre ?? "votre copilote AxiSolver";
  const texte =
    config.accueilPersonnalise ??
    (prenom
      ? `Bonjour ${prenom}. Je suis ${nom}, ${marque}. Dites-moi sur quel sujet vous souhaitez avancer.`
      : `Bonjour. Je suis ${nom}, ${marque}. Dites-moi sur quel sujet vous souhaitez avancer.`);
  return {
    id: "accueil",
    role: "axi",
    contenu: texte,
    horodatage: new Date(),
  };
}

async function appelerBackend(
  config: ConfigAxiChat,
  historique: MessageAxi[],
): Promise<MessageAxi> {
  const reponse = await fetch(config.endpoints.urlChat, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.endpoints.entetes ?? {}),
    },
    body: JSON.stringify({
      messages: historique.map((m) => ({
        role: m.role,
        contenu: m.contenu,
      })),
      contexte: config.contexte,
      siteId: config.contexte?.siteId,
      channel: config.channel,
    }),
  });
  if (!reponse.ok) {
    throw new Error(`AXI indisponible (HTTP ${reponse.status}).`);
  }
  const data = (await reponse.json()) as {
    contenu: string;
    suggestions?: SuggestionRapide[];
  };
  return {
    id: `a-${Date.now()}`,
    role: "axi",
    contenu: data.contenu,
    suggestions: data.suggestions,
    horodatage: new Date(),
  };
}
