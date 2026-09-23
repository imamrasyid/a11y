/**
 * a11y-widget — TypeScript declarations
 *
 * Hand-maintained against the runtime surface in `src/index.js`; when you add
 * an option or an API there, update this file in the same commit.
 */

// ─── State types ─────────────────────────────────────────────────────────────

export interface TTSState {
  enabled: boolean;
  /** Speech rate multiplier — the engine accepts 0.1–10, the panel exposes 0.5–2.0. */
  rate: number;
  /** Runtime only: never persisted, always `null` after a reload. */
  voice: SpeechSynthesisVoice | null;
}

export interface A11yState {
  contrast: "none" | "bright" | "reverse" | "grayscale";
  /** Percentage, clamped to 70–200. */
  textScale: number;
  font: "default" | "readable";
  spacing: "normal" | "wide";
  align: "default" | "left";
  underlineLinks: boolean;
  underlineHeaders: boolean;
  imgTitles: boolean;
  highlightFocus: boolean;
  hideImages: boolean;
  animations: boolean;
  /** True once the visitor touched the animations switch — makes
   *  `animations` override the OS `prefers-reduced-motion` preference. */
  animationsExplicit: boolean;
  cursor: "default" | "white" | "black";
  readingGuide: boolean;
  keyboard: boolean;
  tts: TTSState;
}

export type StateKey = keyof A11yState;

/**
 * What `setState()` and `defaults` accept. `tts` is one level deep because
 * `mergeState` merges nested objects rather than replacing them.
 */
export type SetStatePayload =
  & Partial<Omit<A11yState, "tts">>
  & { tts?: Partial<TTSState> };

// ─── Storage adapter ─────────────────────────────────────────────────────────

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// ─── Module flags ────────────────────────────────────────────────────────────

export interface ModuleFlags {
  contrast?: boolean;
  textScale?: boolean;
  font?: boolean;
  spacing?: boolean;
  align?: boolean;
  underlineLinks?: boolean;
  underlineHeaders?: boolean;
  imgTitles?: boolean;
  highlightFocus?: boolean;
  hideImages?: boolean;
  animations?: boolean;
  cursor?: boolean;
  readingGuide?: boolean;
  keyboard?: boolean;
  tts?: boolean;
}

// ─── UI strings ──────────────────────────────────────────────────────────────

/** Every key of the built-in `id`/`en` packs — the shape a custom pack must satisfy. */
export interface A11yStrings {
  panelTitle: string;
  panelReset: string;
  panelClose: string;
  panelOpen: string;
  footerLabel: string;
  skipLink: string;
  sectionContrast: string;
  sectionTextSize: string;
  sectionFontSpacing: string;
  sectionHighlight: string;
  sectionCursor: string;
  sectionNavigation: string;
  sectionTTS: string;
  contrastNone: string;
  contrastBright: string;
  contrastReverse: string;
  contrastGrayscale: string;
  textDecrease: string;
  textIncrease: string;
  fontReadable: string;
  spacingWide: string;
  alignLeft: string;
  underlineLinks: string;
  underlineHeaders: string;
  imgTitles: string;
  highlightFocus: string;
  cursorDefault: string;
  cursorWhite: string;
  cursorBlack: string;
  readingGuide: string;
  keyboard: string;
  animations: string;
  hideImages: string;
  ttsEnable: string;
  ttsPermissionTitle: string;
  ttsPermissionBody: string;
  ttsPermissionAllow: string;
  ttsPermissionDeny: string;
  ttsPermissionLabel: string;
  announceContrast: string;
  announceCursor: string;
  announceFontReadable: string;
  announceFontDefault: string;
  announceSpacingWide: string;
  announceSpacingNormal: string;
  announceAlignLeft: string;
  announceAlignDefault: string;
  announceAnimationsOff: string;
  announceAnimationsOn: string;
  announceTextSize: string;
  announceActive: string;
  announceInactive: string;
  announceReset: string;
}

/** Locales that ship a complete UI string pack. */
export type LocaleCode = "id" | "en";

/**
 * A locale code, or a partial string pack merged over `baseLang`.
 * A code with no pack (e.g. `'jv'`, which still selects a Javanese voice)
 * falls back to `baseLang`.
 */
export type LangOption = LocaleCode | "jv" | (string & {}) | Partial<A11yStrings>;

// ─── Init options ────────────────────────────────────────────────────────────

export interface A11yWidgetOptions {
  /** localStorage key for persisting state. Default: 'a11y_widget' */
  storageKey?: string;
  /** Older storage keys to adopt on this init: the first one holding a payload
   *  is copied to `storageKey` and removed. Skipped when `storageKey` already
   *  has data, so a visitor's current choices are never overwritten. */
  migrateFrom?: string[];
  /** Custom storage adapter (must implement getItem/setItem/removeItem). */
  storage?: StorageAdapter;
  /** DOM element to mount the widget into. Default: document.body */
  container?: Element;
  /** FAB and panel position. Default: 'bottom-right' */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Locale code or custom strings object. Default: 'id' */
  lang?: LangOption;
  /** Base locale for partial string overrides. Default: 'id' */
  baseLang?: LocaleCode;
  /** Per-module enable/disable flags. All enabled by default. */
  modules?: ModuleFlags;
  /** Override default state values — applied before stored state and by `reset()`. */
  defaults?: SetStatePayload;
  /** Inject a skip-to-content link. Default: true */
  skipLink?: boolean;
  /** Speak a welcome message on first visit. Default: false */
  welcomeMessage?: boolean;
  /** Custom welcome message text. */
  welcomeText?: string;
  /** Shorthand callback for state changes. */
  onStateChange?: (state: A11yState) => void;
}

// ─── TTS replacement rule ────────────────────────────────────────────────────

export interface ReplacementRule {
  search: RegExp;
  replace: string;
  /** Language code to apply this rule to, or null for all languages. */
  lang: string | null;
}

/** One readable block of page content returned by `getPageContent()`. */
export interface PageChunk {
  el: Element;
  text: string;
}

// ─── Widget events ───────────────────────────────────────────────────────────

export type A11yWidgetEvent =
  | "init"
  | "destroy"
  | "open"
  | "close"
  | "stateChange"
  | "reset"
  | "tts:start"
  | "tts:end"
  | "tts:pause"
  | "tts:resume"
  | "tts:cancel";

// ─── TTS namespace ───────────────────────────────────────────────────────────

export interface TTSSpeakOptions {
  rate?: number;
  voice?: SpeechSynthesisVoice | null;
  lang?: string;
  onStart?: () => void;
  onProgress?: (current: number, total: number) => void;
  onEnd?: () => void;
}

export interface TTSA11yAPI {
  /** Speaks a text string. No-op while `tts.enabled` is false. */
  speak(text: string, options?: TTSSpeakOptions): void;
  /** Speaks the full page content with element highlighting. */
  speakPage(): void;
  /** Pauses speech. */
  pause(): void;
  /** Resumes paused speech. */
  resume(): void;
  /** Cancels all speech. */
  cancel(): void;
  /** Returns true if speech is currently playing. */
  isPlaying(): boolean;
  /** Returns true if speech is paused. */
  isPaused(): boolean;
  /** Returns true if the Speech Synthesis API is supported. */
  isSupported(): boolean;
  /** Returns all available voices. */
  getVoices(): SpeechSynthesisVoice[];
  /** Sets the speech rate (0.1–10). */
  setRate(rate: number): void;
  /** Sets the active voice; `null` returns automatic selection by language. */
  setVoice(voice: SpeechSynthesisVoice | null): void;
  /** Grants TTS permission programmatically. */
  grantPermission(): void;
  /** Revokes stored TTS permission. */
  revokePermission(): void;
  /** Adds custom text replacement rules. */
  addReplacements(rules: ReplacementRule[]): void;
  /** Replaces all text replacement rules. */
  setReplacements(rules: ReplacementRule[]): void;
  /** Resets text replacement rules to built-in defaults. */
  resetReplacements(): void;
  /** Returns the current replacement rules. */
  getReplacements(): ReplacementRule[];
}

// ─── Main interface ──────────────────────────────────────────────────────────

export interface A11yWidgetAPI {
  // Lifecycle
  /** Idempotent-guarded: a second call warns and does nothing. */
  init(options?: A11yWidgetOptions): void;
  /** Removes every node, attribute and listener the widget added. */
  destroy(): void;

  // Panel
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;

  // State
  /** Detached snapshot — mutating the returned object has no effect. */
  getState(): A11yState;
  setState(partial: SetStatePayload): void;
  reset(): void;
  resetModule(key: StateKey): void;

  // Events
  on(event: A11yWidgetEvent, handler: (...args: any[]) => void): void;
  off(event: A11yWidgetEvent, handler: (...args: any[]) => void): void;

  // TTS
  tts: TTSA11yAPI;

  // i18n
  getAvailableLocales(): LocaleCode[];

  // Constants
  DEFAULTS: Readonly<A11yState>;
}

declare const A11yWidget: A11yWidgetAPI;
export default A11yWidget;
