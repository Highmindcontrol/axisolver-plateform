"use client";

/**
 * Palette couleurs + icônes pour les sites AxiSolver.
 *
 * À la création d'un site (/dashboard/sites/nouveau) l'utilisateur
 * choisit une couleur et un picto. La couleur se propage :
 *   1. à l'onglet du switcher sites (fond plein quand actif, texte
 *      coloré sur fond blanc quand inactif)
 *   2. au fond du bandeau d'actions (teinte à faible alpha)
 *   3. à l'icône du site dans la sidebar et le switcher
 *
 * Pattern inspiré du système écosystème d'AxiHub.
 */

import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  ChartBar,
  Compass,
  Factory,
  Flag,
  FlaskConical,
  Flower2,
  Gavel,
  Gem,
  Globe,
  Handshake,
  Heart,
  Home,
  Image as ImageIcon,
  Landmark,
  Leaf,
  Lightbulb,
  Megaphone,
  Mountain,
  Palette,
  PiggyBank,
  Plane,
  Rocket,
  Shield,
  Sparkles,
  Sprout,
  Star,
  Stethoscope,
  Store,
  Sun,
  Target,
  Trophy,
  Users,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ─── Palette couleurs ─────────────────────────────────────────── */

export const COULEUR_DEFAUT = "#4f46e5";

export type SuggestionCouleur = {
  nom: string;
  hex: string;
};

export const PALETTE_COULEURS: SuggestionCouleur[] = [
  { nom: "Indigo", hex: "#4f46e5" },
  { nom: "Violet", hex: "#8b5cf6" },
  { nom: "Bleu royal", hex: "#2563eb" },
  { nom: "Émeraude", hex: "#10b981" },
  { nom: "Teal", hex: "#14b8a6" },
  { nom: "Ambre", hex: "#f59e0b" },
  { nom: "Orange", hex: "#f97316" },
  { nom: "Rose", hex: "#ec4899" },
  { nom: "Ardoise", hex: "#64748b" },
];

/** Vérifie qu'une chaîne est bien un hex #RRGGBB. */
export function estHexValide(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

/** Convertit un hex en RGBA avec alpha paramétrable. */
export function hexVersRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ─── Palette d'icônes ─────────────────────────────────────────── */

export const PICTO_DEFAUT = "globe";

const ICONES_DISPONIBLES: Record<string, LucideIcon> = {
  globe: Globe,
  "building-2": Building2,
  briefcase: Briefcase,
  landmark: Landmark,
  gavel: Gavel,
  factory: Factory,
  "chart-bar": ChartBar,
  rocket: Rocket,
  target: Target,
  lightbulb: Lightbulb,
  "flask-conical": FlaskConical,
  "piggy-bank": PiggyBank,
  megaphone: Megaphone,
  trophy: Trophy,
  award: Award,
  shield: Shield,
  handshake: Handshake,
  users: Users,
  compass: Compass,
  flag: Flag,
  home: Home,
  heart: Heart,
  leaf: Leaf,
  sprout: Sprout,
  "flower-2": Flower2,
  mountain: Mountain,
  sun: Sun,
  plane: Plane,
  camera: Camera,
  image: ImageIcon,
  palette: Palette,
  "book-open": BookOpen,
  star: Star,
  gem: Gem,
  zap: Zap,
  sparkles: Sparkles,
  stethoscope: Stethoscope,
  store: Store,
  utensils: Utensils,
};

/** Catégories pour organiser le picker du formulaire. */
export const ICONES_PAR_CATEGORIE: Record<string, string[]> = {
  Business: [
    "building-2",
    "briefcase",
    "store",
    "landmark",
    "factory",
    "chart-bar",
    "rocket",
    "target",
    "handshake",
    "users",
    "trophy",
  ],
  Métiers: [
    "gavel",
    "stethoscope",
    "flask-conical",
    "utensils",
    "camera",
    "palette",
    "book-open",
    "megaphone",
  ],
  "Lifestyle & nature": [
    "home",
    "heart",
    "leaf",
    "sprout",
    "flower-2",
    "mountain",
    "sun",
    "plane",
  ],
  Symboles: [
    "globe",
    "shield",
    "compass",
    "flag",
    "star",
    "gem",
    "zap",
    "sparkles",
    "lightbulb",
    "award",
    "piggy-bank",
    "image",
  ],
};

/** Liste à plat de toutes les icônes autorisées. */
export const ICONES_LISTE: string[] = Object.values(ICONES_PAR_CATEGORIE).flat();

/** Rend l'icône d'un site. Fallback: Globe si valeur inconnue. */
export function IconeSite({
  valeur,
  tailleClass = "h-4 w-4",
  strokeWidth = 2.2,
}: {
  valeur: string | null | undefined;
  tailleClass?: string;
  strokeWidth?: number;
}) {
  const Composant: LucideIcon =
    (valeur ? ICONES_DISPONIBLES[valeur] : undefined) ?? Globe;
  return (
    <Composant
      className={tailleClass}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}
