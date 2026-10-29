"use client";

import { useActionState } from "react";
import {
  CheckCircle2,
  Loader2,
  Zap,
  Hand,
  PauseCircle,
  AlertCircle,
} from "lucide-react";
import {
  definirModeRemediationAction,
  type EtatModeRemediation,
} from "./actions";

type Mode = "desactive" | "validation" | "automatique";

const ETAT_INITIAL: EtatModeRemediation = { erreur: null };

/**
 * Toggle 3 états pour le mode de remédiation AXI Security Shield.
 * Affiché dans la carte score global (colonne droite), à côté des
 * boutons Audit et Rapport webmaster.
 */
export function SelecteurModeRemediation({
  slug,
  modeActuel,
}: {
  slug: string;
  modeActuel: Mode;
}) {
  const [etat, action, pending] = useActionState(
    definirModeRemediationAction,
    ETAT_INITIAL,
  );

  const modeAffiche: Mode = etat.ok && etat.mode ? etat.mode : modeActuel;

  const modes: Array<{
    id: Mode;
    label: string;
    sousTitre: string;
    icone: typeof Zap;
  }> = [
    {
      id: "automatique",
      label: "Automatique",
      sousTitre: "AXI corrige dès qu'il détecte",
      icone: Zap,
    },
    {
      id: "validation",
      label: "Avec validation",
      sousTitre: "AXI propose, tu valides",
      icone: Hand,
    },
    {
      id: "desactive",
      label: "Désactivé",
      sousTitre: "Audit seul, pas d'intervention",
      icone: PauseCircle,
    },
  ];

  return (
    <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
      <p className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider opacity-90">
        <span>Mode AXI Security Shield</span>
        {pending && (
          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
        )}
      </p>
      <form action={action} className="flex flex-col gap-1.5">
        <input type="hidden" name="slug" value={slug} />
        {modes.map((m) => {
          const Icone = m.icone;
          const estActif = modeAffiche === m.id;
          return (
            <button
              key={m.id}
              type="submit"
              name="mode"
              value={m.id}
              disabled={pending || estActif}
              className={`group flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left transition disabled:cursor-default ${
                estActif
                  ? "border-white/60 bg-white/25"
                  : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/15"
              }`}
            >
              <Icone
                className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                strokeWidth={2.4}
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                  {m.label}
                  {estActif && (
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                  )}
                </p>
                <p className="text-[10px] opacity-75">{m.sousTitre}</p>
              </div>
            </button>
          );
        })}
      </form>
      {etat.erreur && (
        <p className="mt-2 inline-flex items-start gap-1 text-[11px] text-rose-200">
          <AlertCircle className="mt-0.5 h-3 w-3" strokeWidth={2.4} />
          <span>{etat.erreur}</span>
        </p>
      )}
    </div>
  );
}
