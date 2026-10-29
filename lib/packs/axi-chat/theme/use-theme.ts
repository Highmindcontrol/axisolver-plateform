"use client";

import { useMemo } from "react";

import type { PaletteTheme, ThemeAxiChat } from "../types";

import {
  PALETTE_CLAIR,
  PALETTE_SOMBRE,
  PALETTES_PRESETS,
  type NomPalettePreset,
} from "./palettes";

/**
 * Résout le thème final (palette + CSS variables) à partir du theme
 * déclaré dans ConfigAxiChat.
 *
 * Le pack @axi-chat n'écrit JAMAIS en dur une couleur Tailwind type
 * `text-slate-100` dans ses composants : chaque composant utilise
 * `style={{ color: 'var(--axi-chat-texte)' }}` ou la classe utilitaire
 * `.axi-chat-fond`, `.axi-chat-texte`, etc. — fournies par ce hook via
 * les variables CSS. Un seul composant parent injecte les variables,
 * les enfants héritent naturellement.
 *
 * Résultat : changer de thème revient à changer un seul objet, sans
 * recompilation Tailwind, et les sites clients peuvent fournir leur
 * propre palette sans toucher au code du pack.
 */
export function useTheme(theme: ThemeAxiChat | undefined): {
  palette: PaletteTheme;
  variablesCss: Record<string, string>;
  classeConteneur: string;
} {
  return useMemo(() => {
    const mode = theme?.mode ?? "sombre";
    const base = palettePreset(mode);
    const palette: PaletteTheme = { ...base, ...(theme?.palette ?? {}) };
    const variablesCss: Record<string, string> = {
      "--axi-chat-fond": palette.fond,
      "--axi-chat-surface": palette.surface,
      "--axi-chat-surface-interactive": palette.surfaceInteractive,
      "--axi-chat-texte": palette.texte,
      "--axi-chat-texte-secondaire": palette.texteSecondaire,
      "--axi-chat-texte-tertiaire": palette.texteTertiaire,
      "--axi-chat-bordure": palette.bordure,
      "--axi-chat-bordure-accent": palette.bordureAccent,
      "--axi-chat-accent": palette.accent,
      "--axi-chat-accent-secondaire": palette.accentSecondaire,
      "--axi-chat-texte-sur-accent": palette.texteSurAccent,
      "--axi-chat-rayon": rayonCss(theme?.rayons),
      "--axi-chat-police": theme?.police ?? "inherit",
      "--axi-chat-espacement": espacementDensite(theme?.densite),
    };
    return {
      palette,
      variablesCss,
      classeConteneur: "axi-chat-conteneur",
    };
  }, [theme]);
}

function palettePreset(mode: ThemeAxiChat["mode"]): PaletteTheme {
  if (mode === "clair") return PALETTE_CLAIR;
  if (mode === "sombre") return PALETTE_SOMBRE;
  if (mode === "personnalise") return PALETTE_SOMBRE; // fallback
  // mode = "auto" → sombre par défaut côté serveur ; côté client,
  // on pourrait écouter prefers-color-scheme. V1 : sombre.
  return PALETTE_SOMBRE;
}

export function paletteDepuisPreset(
  nom: NomPalettePreset,
): PaletteTheme {
  return PALETTES_PRESETS[nom];
}

function rayonCss(r: ThemeAxiChat["rayons"]): string {
  const map: Record<NonNullable<ThemeAxiChat["rayons"]>, string> = {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
    full: "9999px",
  };
  return map[r ?? "xl"];
}

function espacementDensite(d: ThemeAxiChat["densite"]): string {
  const map: Record<NonNullable<ThemeAxiChat["densite"]>, string> = {
    compact: "0.5rem",
    confortable: "0.75rem",
    spacieux: "1rem",
  };
  return map[d ?? "confortable"];
}
