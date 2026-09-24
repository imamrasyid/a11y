/**
 * A controllable stand-in for the Speech Synthesis API.
 *
 * jsdom ships none, and src/modules/tts/tts.js captures `window.speechSynthesis`
 * at module-load time — so this must be installed from a vitest setup file,
 * which runs before the module graph under test is imported.
 *
 * Nothing here runs automatically: a test decides when an utterance starts and
 * ends through startUtterance()/endUtterance(), which keeps playback assertions
 * free of timers.
 */

/** Standing in for a real machine's voice list. */
export const VOICES = [
    { name: 'Bahasa Indonesia', lang: 'id-ID', default: true },
    { name: 'Google_us', lang: 'en-US', default: false },
];

/** Every utterance handed to speak(), oldest first. Cleared by resetSpeech(). */
export const spoken = [];

let speaking = false;
let paused = false;
let current = null;

class FakeUtterance {
    constructor(text) {
        this.text = String(text);
        this.lang = '';
        this.rate = 1;
        this.volume = 1;
        this.voice = null;
    }
}

const synth = {
    get speaking() { return speaking; },
    get paused() { return paused; },
    getVoices() { return VOICES; },
    addEventListener() { /* voices are already loaded here */ },
    removeEventListener() { /* noop */ },
    speak(utterance) {
        spoken.push(utterance);
        current = utterance;
        speaking = true;
        paused = false;
    },
    pause() { paused = true; },
    resume() { paused = false; },
    cancel() {
        speaking = false;
        paused = false;
        // Chromium fires `end` for the utterance it is discarding, right inside
        // cancel(). Tests need that same re-entrancy to prove the engine
        // ignores it instead of walking on to the next block.
        const dropped = current;
        current = null;
        if (dropped && dropped.onend) { dropped.onend({}); }
    },
};

/**
 * Fires onstart, as a browser does once the utterance begins playing.
 * @param {FakeUtterance} utterance
 */
export function startUtterance(utterance) {
    if (utterance && utterance.onstart) { utterance.onstart({}); }
}

/**
 * Fires onend and marks the queue idle — the next speak() call from the
 * engine's chunk loop sets it speaking again.
 * @param {FakeUtterance} utterance
 */
export function endUtterance(utterance) {
    speaking = false;
    if (current === utterance) { current = null; }
    if (utterance && utterance.onend) { utterance.onend({}); }
}

/** @returns {FakeUtterance|undefined} the most recent utterance */
export function lastUtterance() {
    return spoken[spoken.length - 1];
}

export function resetSpeech() {
    spoken.length = 0;
    current = null;
    speaking = false;
    paused = false;
}

export function installSpeechSynthesis(target = globalThis) {
    target.SpeechSynthesisUtterance = FakeUtterance;
    Object.defineProperty(target, 'speechSynthesis', {
        value: synth,
        configurable: true,
        writable: false,
    });
}
