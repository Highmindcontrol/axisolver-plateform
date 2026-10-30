"use client";

import { useEffect, useState } from "react";

import { useDictee } from "../hooks/use-dictee";
import { usePiecesJointes } from "../hooks/use-pieces-jointes";
import { useVoixSynthese } from "../hooks/use-voix-synthese";
import { useTheme } from "../theme/use-theme";
import type {
  ConfigAxiChat,
  MessageAxi,
  PieceJointe,
  SuggestionRapide,
} from "../types";

import { ApercuPiecesJointes } from "./apercu-pieces-jointes";
import { BulleMessage } from "./bulle-message";
import { EnteteChat } from "./entete-chat";
import { ModalNotationGaugista } from "./modal-notation-gaugista";
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

  // ─── Chargement de l'historique persisté au mount ────────
  // Si urlHistorique est fournie, on remplace les messages locaux par
  // le fil réel récupéré depuis le serveur. Garantit que l'admin
  // retrouve sa conversation exactement là où il l'avait laissée,
  // même après fermeture complète du navigateur.
  useEffect(() => {
    const url = config.endpoints.urlHistorique;
    if (!url) return;
    let annule = false;
    fetch(url, { headers: config.endpoints.entetes })
      .then(async (resp) => {
        if (!resp.ok) return;
        const data = (await resp.json()) as { messages?: MessageAxi[] };
        if (annule) return;
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((m) => ({
              ...m,
              horodatage: m.horodatage ? new Date(m.horodatage) : undefined,
            })),
          );
        }
      })
      .catch(() => {
        // Silence : si le chargement échoue, on garde les messages
        // par défaut (accueil). L'admin pourra toujours écrire.
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.endpoints.urlHistorique]);

  // ─── Dictée (STT) ─────────────────────────────────────────
  const dictee = useDictee({
    langue: localeDepuisLangue(config.contexte?.langue),
    urlDictee: config.endpoints.urlDictee,
    entetes: config.endpoints.entetes,
  });
  useEffect(() => {
    if (dictee.transcription) setBrouillon((prev) =>
      prev ? `${prev} ${dictee.transcription}`.trim() : dictee.transcription,
    );
  }, [dictee.transcription]);

  // ─── Voix synthèse (TTS) ──────────────────────────────────
  const voix = useVoixSynthese({
    urlVoix: config.endpoints.urlVoix,
    entetes: config.endpoints.entetes,
    langue: localeDepuisLangue(config.contexte?.langue),
  });

  // ─── Pièces jointes ───────────────────────────────────────
  const piecesJointes = usePiecesJointes({
    urlUpload: config.endpoints.urlUpload ?? "",
    entetes: config.endpoints.entetes,
  });

  // ─── Notation Gaugista ────────────────────────────────────
  const [notationOuverte, setNotationOuverte] = useState(false);
  const peutNoter =
    !!config.fonctionnalites?.notationGaugista &&
    !!config.endpoints.urlGaugista;
  const declencheurs = config.notationGaugista?.declencheurs ?? [
    "bouton",
    "fermeture",
  ];

  const suggestionsCourantes =
    messages.length > 0 &&
    messages[messages.length - 1].role === "axi" &&
    (messages[messages.length - 1].suggestions?.length ?? 0) > 0
      ? messages[messages.length - 1].suggestions ?? []
      : [];

  function envoyer(texte: string) {
    const contenu = texte.trim();
    const pieces = piecesJointes.pieces;
    if ((!contenu && pieces.length === 0) || envoiEnCours) return;
    if (dictee.etat !== "repos") dictee.arreter();

    const msgVisiteur: MessageAxi = {
      id: `v-${Date.now()}`,
      role: "visiteur",
      contenu,
      piecesJointes: pieces.length > 0 ? pieces : undefined,
      horodatage: new Date(),
    };
    setMessages((prev) => [...prev, msgVisiteur]);
    config.surMessage?.(msgVisiteur);
    setBrouillon("");
    piecesJointes.vider();
    dictee.reinitialiser();

    setEnvoiEnCours(true);
    appelerBackend(config, [...messages, msgVisiteur])
      .then((reponse) => {
        setMessages((prev) => [...prev, reponse]);
        config.surMessage?.(reponse);
        if (reponse.ordres && config.surOrdre) {
          for (const o of reponse.ordres) config.surOrdre(o);
        }
        if (config.fonctionnalites?.voixSynthese) {
          voix.lire(reponse.contenu).catch(() => undefined);
        }
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

  function toggleDictee() {
    if (dictee.etat === "repos") {
      dictee.demarrer().catch(() => undefined);
    } else {
      dictee.arreter();
    }
  }

  const peutDeclencherParBouton =
    peutNoter && declencheurs.includes("bouton");

  return (
    <div
      className="flex h-full flex-col"
      style={{
        ...variablesCss,
        fontFamily: "var(--axi-chat-police)",
        color: "var(--axi-chat-texte)",
      }}
    >
      {notationOuverte && config.endpoints.urlGaugista ? (
        <ModalNotationGaugista
          config={config.notationGaugista}
          urlGaugista={config.endpoints.urlGaugista}
          entetes={config.endpoints.entetes}
          onFerme={() => setNotationOuverte(false)}
          onEnvoye={(n, c) => config.surNotation?.(n, c)}
        />
      ) : (
        <>
          <EnteteChat
            contexte={config.contexte}
            onTerminer={
              peutDeclencherParBouton
                ? () => setNotationOuverte(true)
                : undefined
            }
          />

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

      {config.fonctionnalites?.piecesJointes && (
        <ApercuPiecesJointes
          pieces={piecesJointes.pieces}
          enCours={piecesJointes.enCours}
          onRetirer={piecesJointes.retirer}
        />
      )}

      {dictee.erreur && (
        <p
          className="pt-2 text-xs"
          style={{ color: "var(--axi-chat-texte-tertiaire)" }}
        >
          {dictee.erreur}
        </p>
      )}

      <ZoneSaisie
        valeur={brouillon}
        onChange={setBrouillon}
        onEnvoyer={() => envoyer(brouillon)}
        placeholder={config.placeholderSaisie}
        fonctionnalites={config.fonctionnalites}
        envoiDesactive={envoiEnCours}
        onDictee={config.fonctionnalites?.dictee ? toggleDictee : undefined}
        dicteeActive={dictee.etat !== "repos"}
        onPiecesJointes={
          config.fonctionnalites?.piecesJointes && config.endpoints.urlUpload
            ? piecesJointes.ouvrir
            : undefined
        }
      />

      {config.fonctionnalites?.piecesJointes && config.endpoints.urlUpload && (
        <input
          ref={piecesJointes.input.ref}
          type="file"
          multiple
          hidden
          accept={piecesJointes.input.accept}
          onChange={piecesJointes.input.onChange}
        />
      )}
        </>
      )}
    </div>
  );
}

function localeDepuisLangue(langue: ConfigAxiChat["contexte"] extends infer _
  ? NonNullable<ConfigAxiChat["contexte"]>["langue"] | undefined
  : never): string {
  const map: Record<string, string> = {
    fr: "fr-FR",
    en: "en-US",
    es: "es-ES",
    de: "de-DE",
    it: "it-IT",
  };
  return (langue && map[langue]) ?? "fr-FR";
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
        piecesJointes: m.piecesJointes?.map((p) => ({
          id: p.id,
          type: p.type,
          url: p.url,
          nom: p.nom,
        })),
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
    ordres?: Array<{
      id: string;
      libelle: string;
      statut: "propose" | "en_cours" | "termine" | "echoue" | "refuse";
      horodatage?: string;
    }>;
  };
  return {
    id: `a-${Date.now()}`,
    role: "axi",
    contenu: data.contenu,
    suggestions: data.suggestions,
    ordres: data.ordres?.map((o) => ({
      id: o.id,
      libelle: o.libelle,
      statut: o.statut,
      horodatage: o.horodatage ? new Date(o.horodatage) : undefined,
    })),
    horodatage: new Date(),
  };
}
