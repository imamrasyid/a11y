/**
 * Consumer-side type check — compiled by `npm run typecheck`, never bundled.
 *
 * Importing the package by its own name exercises Node's self-referencing
 * resolution, so this file only type-checks if `exports["."].types` points at
 * a real declaration. That is exactly the gap this file exists to guard.
 */

import A11yWidget, {
    type A11yState,
    type A11yStrings,
    type A11yWidgetEvent,
    type A11yWidgetOptions,
    type ModuleFlags,
    type PageChunk,
    type ReplacementRule,
    type SetStatePayload,
    type StateKey,
    type StorageAdapter,
} from '@a11y-widget/core';

// ─── init ────────────────────────────────────────────────────────────────────
A11yWidget.init();

const options: A11yWidgetOptions = {
    storageKey: 'my_app_a11y',
    migrateFrom: ['kebumen_a11y'],
    storage: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
    } satisfies StorageAdapter,
    container: document.body,
    position: 'top-left',
    lang: 'en',
    baseLang: 'id',
    fallbackLang: 'id',
    contentSelectors: ['main', '.post-details-article'],
    excludeSelectors: ['nav', '.iklan'],
    modules: { tts: false, readingGuide: false } satisfies ModuleFlags,
    defaults: { contrast: 'grayscale', tts: { rate: 1.2 } },
    skipLink: true,
    welcomeMessage: false,
    welcomeText: 'Selamat datang.',
    onStateChange: (state: A11yState) => {
        void state.textScale;
    },
};
A11yWidget.init(options);

// A custom string pack is a *partial* override — unknown keys must not compile.
A11yWidget.init({
    lang: { panelTitle: 'Aksesibilitas', skipLink: 'Lewati ke konten' } satisfies Partial<A11yStrings>,
});
// @ts-expect-error typo in a string key
A11yWidget.init({ lang: { panelTitel: 'x' } });
// @ts-expect-error not a contrast mode
A11yWidget.init({ defaults: { contrast: 'sepia' } });
// @ts-expect-error textScale is a number, not a percentage string
A11yWidget.init({ defaults: { textScale: '150%' } });

// ─── state ───────────────────────────────────────────────────────────────────
const state: A11yState = A11yWidget.getState();
const ratio: number = state.tts.rate;
const voice: SpeechSynthesisVoice | null = state.tts.voice;
void ratio;
void voice;

// setState accepts a nested partial for `tts` (mergeState merges one level deep).
const patch: SetStatePayload = { tts: { enabled: false } };
A11yWidget.setState(patch);
A11yWidget.setState({ textScale: 125 });
// @ts-expect-error contrast accepts four values only
A11yWidget.setState({ contrast: 'dark' });

const key: StateKey = 'hideImages';
A11yWidget.resetModule(key);

// ─── panel + events ──────────────────────────────────────────────────────────
A11yWidget.open();
A11yWidget.close();
A11yWidget.toggle();
const opened: boolean = A11yWidget.isOpen();
void opened;

const event: A11yWidgetEvent = 'tts:end';
const listener = (payload?: unknown): void => { void payload; };
A11yWidget.on(event, listener);
A11yWidget.off('stateChange', listener);
// @ts-expect-error not an emitted event
A11yWidget.on('panel:wiggle', listener);

// ─── TTS ─────────────────────────────────────────────────────────────────────
if (A11yWidget.tts.isSupported()) {
    A11yWidget.tts.speak('Halo dunia.', { rate: 1.1, lang: 'id-ID' });
    A11yWidget.tts.speakPage();
    A11yWidget.tts.pause();
    A11yWidget.tts.resume();
    A11yWidget.tts.cancel();
    const speaking: boolean = A11yWidget.tts.isPlaying();
    const paused: boolean = A11yWidget.tts.isPaused();
    void speaking;
    void paused;
    const voices: SpeechSynthesisVoice[] = A11yWidget.tts.getVoices();
    A11yWidget.tts.setVoice(voices[0] ?? null);
    A11yWidget.tts.setRate(1.25);

    const rules: ReplacementRule[] = [{ search: /\bRp\.?\s*/gi, replace: 'rupiah ', lang: 'id' }];
    A11yWidget.tts.addReplacements(rules);
    const current: ReplacementRule[] = A11yWidget.tts.getReplacements();
    void current;
}

// ─── read-only defaults ──────────────────────────────────────────────────────
// @ts-expect-error DEFAULTS is frozen
A11yWidget.DEFAULTS.contrast = 'bright';

// ─── deep import used by the UMD/script-tag path still resolves ──────────────
import type { A11yWidgetAPI } from '@a11y-widget/core';
const api: A11yWidgetAPI = A11yWidget;
const chunks: PageChunk[] = [];
void chunks;
void api.getAvailableLocales();
