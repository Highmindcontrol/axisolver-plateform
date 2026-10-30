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
  ConfigProduitsAxi,
  ContexteAxiChat,
  EndpointsAxiChat,
  FonctionnalitesAxiChat,
  JaugeConfig,
  BoutonBulleTheme,
  MessageAxi,
  ModeTheme,
  NomPalettePreset,
  NotationGaugistaConfig,
  OrdreAxi,
  RepereAxi,
  PaletteTheme,
  PieceJointe,
  PositionBandeau,
  PositionWidgetFlottant,
  ProduitAxi,
  RoleMessage,
  SecteurPage,
  SuggestionRapide,
  ThemeAxiChat,
} from "./types";
export { JAUGES_AXISOLVER_DEFAUT } from "./types";

/* ─── Thème ──────────────────────────────────────────────────── */
export {
  PALETTE_CLAIR,
  PALETTE_ECOMMERCE_CHAUD,
  PALETTE_INSTITUTIONNEL,
  PALETTE_SOMBRE,
  PALETTE_VIBRANT,
  PALETTES_PRESETS,
} from "./theme/palettes";
export { paletteDepuisPreset, useTheme } from "./theme/use-theme";

/* ─── Composants atomiques (utiles pour variantes custom) ───── */
export { ApercuPiecesJointes } from "./composants/apercu-pieces-jointes";
export { BulleMessage } from "./composants/bulle-message";
export { CarouselProduits } from "./composants/carousel-produits";
export { EnteteChat } from "./composants/entete-chat";
export { ModalNotationGaugista } from "./composants/modal-notation-gaugista";
export { SuggestionsRapides } from "./composants/suggestions-rapides";
export { ZoneSaisie } from "./composants/zone-saisie";

/* ─── Hooks (dictée, TTS, pièces jointes, Gaugista) ───────── */
export { useDictee } from "./hooks/use-dictee";
export { useFormulaireGaugista } from "./hooks/use-formulaire-gaugista";
export { useNotationGaugista } from "./hooks/use-notation-gaugista";
export { usePiecesJointes } from "./hooks/use-pieces-jointes";
export { useVoixSynthese } from "./hooks/use-voix-synthese";
export {
  createSentenceExtractor,
  useStreamingTts,
} from "./hooks/use-streaming-tts";

/* ─── Composant racine (compose les atomiques) ──────────────── */
export { AxiChatRoot } from "./composants/axi-chat-root";

/* ─── Variantes (surfaces prêtes à l'emploi) ────────────────── */
export { AxiChatCopilote } from "./variantes/back-office-copilote";
export { AxiChatBandeauSticky } from "./variantes/bandeau-sticky";
export { AxiChatBandeauToggle } from "./variantes/bandeau-toggle";
export { AxiChatWidgetFlottant } from "./variantes/widget-flottant";
