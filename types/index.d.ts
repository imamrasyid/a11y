/**
 * a11y-widget — TypeScript declarations
 */

// ─── State types ─────────────────────────────────────────────────────────────

export interface TTSState {
  enabled: boolean;
  rate: number;
  voice: SpeechSynthesisVoice | null;
}

export interface A11yState {
  contrast: "none" | "bright" | "reverse" | "grayscale";
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
  cursor: "default" | "white" | "black";
  readingGuide: boolean;
  keyboard: boolean;
  tts: TTSState;
}

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

// ─── Init options ────────────────────────────────────────────────────────────

export interface A11yWidgetOptions {
  /** localStorage key for persisting state. Default: 'a11y_widget' */
  storageKey?: string;
  /** Custom storage adapter (must implement getItem/setItem/removeItem). */
  storage?: StorageAdapter;
  /** DOM element to mount the widget into. Default: document.body */
  container?: Element;
  /** FAB and panel position. Default: 'bottom-right' */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Locale code or custom strings object. Default: 'id' */
  lang?: "id" | "en" | Record<string, string>;
  /** Base locale for partial string overrides. Default: 'id' */
  baseLang?: string;
  /** Per-module enable/disable flags. All enabled by default. */
  modules?: ModuleFlags;
  /** Override default state values. */
  defaults?: Partial<A11yState>;
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
  voice?: SpeechSynthesisVoice;
  lang?: string;
  onStart?: () => void;
  onProgress?: (current: number, total: number) => void;
  onEnd?: () => void;
}

export interface TTSA11yAPI {
  /** Speaks a text string. */
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
  /** Sets the active voice. */
  setVoice(voice: SpeechSynthesisVoice): void;
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
  init(options?: A11yWidgetOptions): void;
  destroy(): void;

  // Panel
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;

  // State
  getState(): A11yState;
  setState(partial: Partial<A11yState>): void;
  reset(): void;
  resetModule(key: keyof A11yState): void;

  // Events
  on(event: A11yWidgetEvent, handler: (...args: any[]) => void): void;
  off(event: A11yWidgetEvent, handler: (...args: any[]) => void): void;

  // TTS
  tts: TTSA11yAPI;

  // i18n
  getAvailableLocales(): string[];

  // Constants
  DEFAULTS: Readonly<A11yState>;
}

declare const A11yWidget: A11yWidgetAPI;
export default A11yWidget;
