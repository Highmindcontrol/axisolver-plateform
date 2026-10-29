/**
 * Pack @axi-chat — Interface de communication AXI unifiée.
 *
 * API publique. Tout import depuis l'extérieur du pack DOIT passer
 * par ce fichier. Les fichiers internes (`composants/*`, `theme/*`,
 * `variantes/*`) ne sont PAS considérés comme contrat.
 *
 * Usage minimal :
 *
 *   import { AxiChatCopilote, type ConfigAxiChat } from "@/lib/packs/axi-chat";
 *
 *   const config: ConfigAxiChat = {
 *     channel: "back-office-copilote",
 *     endpoints: { urlChat: "/api/dashboard/chat" },
 *     theme: { mode: "sombre" },
 *     contexte: { prenomUtilisateur: "François" },
 *   };
 *
 *   <AxiChatCopilote config={config} aileteGauche={...} aileteDroite={...} />
 */

/* ─── Types (contrats publics) ───────────────────────────────── */
export type {
  ChannelAxiChat,
  ConfigAxiChat,
  ContexteAxiChat,
  EndpointsAxiChat,
  FonctionnalitesAxiChat,
  MessageAxi,
  ModeTheme,
  OrdreAxi,
  PaletteTheme,
  PieceJointe,
  PositionBandeau,
  PositionWidgetFlottant,
  RoleMessage,
  SecteurPage,
  SuggestionRapide,
  ThemeAxiChat,
} from "./types";

/* ─── Thème ──────────────────────────────────────────────────── */
export {
  PALETTE_CLAIR,
  PALETTE_ECOMMERCE_CHAUD,
  PALETTE_INSTITUTIONNEL,
  PALETTE_SOMBRE,
  PALETTES_PRESETS,
  type NomPalettePreset,
} from "./theme/palettes";
export { paletteDepuisPreset, useTheme } from "./theme/use-theme";

/* ─── Composants atomiques (utiles pour variantes custom) ───── */
export { BulleMessage } from "./composants/bulle-message";
export { EnteteChat } from "./composants/entete-chat";
export { SuggestionsRapides } from "./composants/suggestions-rapides";
export { ZoneSaisie } from "./composants/zone-saisie";

/* ─── Composant racine (compose les atomiques) ──────────────── */
export { AxiChatRoot } from "./composants/axi-chat-root";

/* ─── Variantes (surfaces prêtes à l'emploi) ────────────────── */
export { AxiChatCopilote } from "./variantes/back-office-copilote";
export { AxiChatBandeauToggle } from "./variantes/bandeau-toggle";
export { AxiChatWidgetFlottant } from "./variantes/widget-flottant";
