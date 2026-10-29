"use client";

import { Check, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { useNotationGaugista } from "../hooks/use-notation-gaugista";
import type {
  JaugeConfig,
  NotationGaugistaConfig,
} from "../types";
import { JAUGES_AXISOLVER_DEFAUT } from "../types";

/**
 * Modal de notation Gaugista affichée en fin de conversation.
 *
 * Rend N jauges (0-10 par défaut) + commentaire libre optionnel. À la
 * validation, POST sur urlGaugista (proxy côté serveur du site hôte).
 *
 * Palette : utilise les CSS variables du pack (hérite du thème parent).
 */
export function ModalNotationGaugista({
  config,
  urlGaugista,
  entetes,
  onFerme,
  onEnvoye,
}: {
  config?: NotationGaugistaConfig;
  urlGaugista: string;
  entetes?: Record<string, string>;
  onFerme: () => void;
  onEnvoye?: (notes: Record<string, number>, commentaire?: string) => void;
}) {
  const jauges: JaugeConfig[] =
    config?.jauges && config.jauges.length > 0
      ? config.jauges
      : JAUGES_AXISOLVER_DEFAUT;

  const [notes, setNotes] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const j of jauges) {
      const min = j.min ?? 0;
      const max = j.max ?? 10;
      init[j.cle] = j.valeurInitiale ?? Math.round((min + max) / 2);
    }
    return init;
  });
  const [commentaire, setCommentaire] = useState("");

  const { etat, erreur, envoyer } = useNotationGaugista({
    urlGaugista,
    entetes,
    sourceRef: config?.sourceRef,
  });

  const titre = config?.titre ?? "Merci de noter cette conversation";
  const sousTitre =
    config?.sousTitre ??
    "Votre retour aide AXI à s'améliorer. Glissez chaque jauge selon votre expérience.";
  const libelleEnvoyer = config?.libelleEnvoyer ?? "Envoyer ma note";

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const ok = await envoyer(
      notes,
      config?.avecCommentaire && commentaire.trim()
        ? commentaire.trim()
        : undefined,
    );
    if (ok && onEnvoye) {
      onEnvoye(
        notes,
        commentaire.trim() ? commentaire.trim() : undefined,
      );
    }
  }

  const moyenne = useMemo(() => {
    const valeurs = Object.values(notes);
    if (valeurs.length === 0) return 0;
    return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
  }, [notes]);

  if (etat === "envoye") {
    return (
      <div
        role="dialog"
        aria-label="Notation envoyée"
        className="flex h-full flex-col items-center justify-center p-8 text-center"
      >
        <span
          className="mb-4 flex h-14 w-14 items-center justify-center"
          style={{
            borderRadius: "9999px",
            background: `linear-gradient(135deg, var(--axi-chat-accent), var(--axi-chat-accent-secondaire))`,
            color: "var(--axi-chat-texte-sur-accent)",
          }}
        >
          <Check className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--axi-chat-texte)" }}
        >
          Merci pour votre retour.
        </h3>
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--axi-chat-texte-secondaire)" }}
        >
          Note moyenne : {moyenne.toFixed(1)} / 10
        </p>
        <button
          type="button"
          onClick={onFerme}
          className="mt-5 px-4 py-2 text-xs font-semibold transition"
          style={{
            borderRadius: "var(--axi-chat-rayon)",
            border: `1px solid var(--axi-chat-bordure)`,
            background: "var(--axi-chat-surface)",
            color: "var(--axi-chat-texte)",
          }}
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={soumettre}
      role="dialog"
      aria-label={titre}
      className="flex h-full flex-col overflow-hidden"
    >
      <header className="relative flex items-start justify-between gap-3 pb-4">
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--axi-chat-texte)" }}
          >
            {titre}
          </h3>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--axi-chat-texte-secondaire)" }}
          >
            {sousTitre}
          </p>
        </div>
        <button
          type="button"
          onClick={onFerme}
          aria-label="Fermer sans noter"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center"
          style={{
            borderRadius: "9999px",
            background: "var(--axi-chat-surface)",
            color: "var(--axi-chat-texte-secondaire)",
          }}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto py-2">
        {jauges.map((j) => (
          <Jauge
            key={j.cle}
            jauge={j}
            valeur={notes[j.cle]}
            onChange={(v) => setNotes((prev) => ({ ...prev, [j.cle]: v }))}
          />
        ))}

        {config?.avecCommentaire && (
          <div>
            <label
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--axi-chat-texte-secondaire)" }}
            >
              Un mot de plus ? (optionnel)
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              placeholder={
                config.placeholderCommentaire ??
                "Ce qui a bien marché, ce qui pourrait être mieux…"
              }
              className="w-full resize-none px-3 py-2 text-sm outline-none"
              style={{
                borderRadius: "var(--axi-chat-rayon)",
                border: `1px solid var(--axi-chat-bordure)`,
                background: "var(--axi-chat-surface-interactive)",
                color: "var(--axi-chat-texte)",
              }}
            />
          </div>
        )}
      </div>

      {erreur && (
        <p
          className="pt-2 text-xs"
          style={{ color: "var(--axi-chat-texte-tertiaire)" }}
        >
          {erreur}
        </p>
      )}

      <footer className="pt-4">
        <button
          type="submit"
          disabled={etat === "envoi"}
          className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold shadow-md transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            borderRadius: "var(--axi-chat-rayon)",
            background: `linear-gradient(135deg, var(--axi-chat-accent), var(--axi-chat-accent-secondaire))`,
            color: "var(--axi-chat-texte-sur-accent)",
          }}
        >
          {etat === "envoi" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
              Envoi…
            </>
          ) : (
            libelleEnvoyer
          )}
        </button>
      </footer>
    </form>
  );
}

function Jauge({
  jauge,
  valeur,
  onChange,
}: {
  jauge: JaugeConfig;
  valeur: number;
  onChange: (v: number) => void;
}) {
  const min = jauge.min ?? 0;
  const max = jauge.max ?? 10;
  const pct = ((valeur - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--axi-chat-texte)" }}
          >
            {jauge.libelle}
          </p>
          {jauge.question && (
            <p
              className="text-[11px]"
              style={{ color: "var(--axi-chat-texte-tertiaire)" }}
            >
              {jauge.question}
            </p>
          )}
        </div>
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: "var(--axi-chat-accent)" }}
        >
          {valeur}
          <span
            className="text-xs font-normal"
            style={{ color: "var(--axi-chat-texte-tertiaire)" }}
          >
            {" "}
            / {max}
          </span>
        </span>
      </div>
      <div
        className="relative h-2 w-full overflow-hidden"
        style={{
          borderRadius: "9999px",
          background: "var(--axi-chat-surface-interactive)",
        }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-[width]"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--axi-chat-accent), var(--axi-chat-accent-secondaire))`,
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={valeur}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="mt-1 h-4 w-full cursor-pointer appearance-none bg-transparent"
        style={{
          // La piste native est cachée par la jauge visuelle au-dessus ;
          // on garde le slider pour le drag + accessibilité clavier.
          accentColor: "transparent",
        }}
        aria-label={jauge.libelle}
      />
    </div>
  );
}
