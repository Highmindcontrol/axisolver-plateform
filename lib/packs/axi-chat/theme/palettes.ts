import type { PaletteTheme } from "../types";

/**
 * Palettes standards du pack @axi-chat.
 *
 * Toutes les couleurs utilisées dans les composants internes passent
 * par la palette active (CSS variables). Ajouter une nouvelle palette
 * ici suffit à la rendre disponible dans tout le pack.
 *
 * Les palettes sont construites sur la **doctrine AXI** :
 *  · fond principal = couleur dominante de la marque
 *  · accent = couleur signature (indigo-violet AXI par défaut)
 *  · texte toujours en haut contraste
 */

export const PALETTE_SOMBRE: PaletteTheme = {
  // Fond slate-900 — c'est LA couleur AXI de référence
  fond: "#0f172a",
  surface: "#1e293b", // slate-800
  surfaceInteractive: "#334155", // slate-700
  texte: "#f1f5f9", // slate-100
  texteSecondaire: "#94a3b8", // slate-400
  texteTertiaire: "#64748b", // slate-500
  bordure: "#334155", // slate-700
  bordureAccent: "#6366f1", // indigo-500
  accent: "#4f46e5", // indigo-600
  accentSecondaire: "#7c3aed", // violet-600
  texteSurAccent: "#ffffff",
};

export const PALETTE_CLAIR: PaletteTheme = {
  fond: "#ffffff",
  surface: "#f8fafc", // slate-50
  surfaceInteractive: "#f1f5f9", // slate-100
  texte: "#0f172a", // slate-900
  texteSecondaire: "#475569", // slate-600
  texteTertiaire: "#94a3b8", // slate-400
  bordure: "#e2e8f0", // slate-200
  bordureAccent: "#6366f1", // indigo-500
  accent: "#4f46e5", // indigo-600
  accentSecondaire: "#7c3aed", // violet-600
  texteSurAccent: "#ffffff",
};

/**
 * Palette alternative e-commerce — fond chaud légèrement doré, pensé
 * pour les sites de vente qui veulent une ambiance plus accueillante
 * et moins "tech brute".
 */
export const PALETTE_ECOMMERCE_CHAUD: PaletteTheme = {
  fond: "#1c1917", // stone-900
  surface: "#292524", // stone-800
  surfaceInteractive: "#44403c", // stone-700
  texte: "#fafaf9", // stone-50
  texteSecondaire: "#a8a29e", // stone-400
  texteTertiaire: "#78716c", // stone-500
  bordure: "#44403c",
  bordureAccent: "#f59e0b", // amber-500
  accent: "#d97706", // amber-600
  accentSecondaire: "#ea580c", // orange-600
  texteSurAccent: "#ffffff",
};

/**
 * Palette alternative médical / juridique — bleu profond, austère et
 * rassurant. Pensée pour les sites qui ont besoin d'un ton confiance.
 */
export const PALETTE_INSTITUTIONNEL: PaletteTheme = {
  fond: "#0c1e3b", // bleu nuit personnalisé
  surface: "#172e52",
  surfaceInteractive: "#1e3a66",
  texte: "#f8fafc",
  texteSecondaire: "#94a3b8",
  texteTertiaire: "#64748b",
  bordure: "#1e3a66",
  bordureAccent: "#38bdf8", // sky-400
  accent: "#0284c7", // sky-600
  accentSecondaire: "#0369a1", // sky-700
  texteSurAccent: "#ffffff",
};

export const PALETTES_PRESETS = {
  sombre: PALETTE_SOMBRE,
  clair: PALETTE_CLAIR,
  ecommerceChaud: PALETTE_ECOMMERCE_CHAUD,
  institutionnel: PALETTE_INSTITUTIONNEL,
} as const;

export type NomPalettePreset = keyof typeof PALETTES_PRESETS;
