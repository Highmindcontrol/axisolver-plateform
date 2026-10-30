"use client";

import { ArrowUpRight, Hash } from "lucide-react";
import Link from "next/link";

import type { RepereAxi } from "@/lib/packs/axi-chat";

/**
 * Ailette gauche du copilote — repères visuels émis par AXI pendant
 * qu'elle parle. Deux formes :
 *   - section : cartouche titre (ex: « Annonces Google »)
 *   - lien : bouton cliquable vers une page admin
 *
 * S'affiche uniquement s'il y a au moins un repère, selon la doctrine
 * « l'écran se remplit au fur et à mesure ».
 */
export function AiletteReperes({ reperes }: { reperes: RepereAxi[] }) {
  if (reperes.length === 0) return null;

  // Ordre inverse : plus récent en haut (cohérent avec l'ailette droite)
  const liste = [...reperes].reverse();

  return (
    <ul className="space-y-2 overflow-y-auto">
      {liste.map((r) =>
        r.kind === "lien" ? (
          <li key={r.id}>
            <Link
              href={r.cible ?? "#"}
              className="group flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2.5 text-xs font-medium text-indigo-200 transition hover:border-indigo-400 hover:bg-indigo-500/20 hover:text-white"
            >
              <ArrowUpRight
                className="h-3.5 w-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={2.4}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{r.label}</span>
            </Link>
          </li>
        ) : (
          <li
            key={r.id}
            className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-2.5"
          >
            <span
              aria-hidden
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-slate-700/60 text-slate-300"
            >
              <Hash className="h-3 w-3" strokeWidth={2.4} />
            </span>
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-100">
              {r.label}
            </p>
          </li>
        ),
      )}
    </ul>
  );
}
