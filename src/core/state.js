/**
 * State management core.
 * Handles defaults, merging, persistence, and per-module reset.
 */

/**
 * @typedef {Object} TTSState
 * @property {boolean} enabled
 * @property {number}  rate
 * @property {SpeechSynthesisVoice|null} voice
 */

/**
 * @typedef {Object} A11yState
 * @property {'none'|'bright'|'reverse'|'grayscale'} contrast
 * @property {number}  textScale        - 70–200 (percent)
 * @property {'default'|'readable'} font
 * @property {'normal'|'wide'} spacing
 * @property {'default'|'left'} align
 * @property {boolean} underlineLinks
 * @property {boolean} underlineHeaders
 * @property {boolean} imgTitles
 * @property {boolean} highlightFocus
 * @property {boolean} hideImages
 * @property {boolean} animations
 * @property {'default'|'white'|'black'} cursor
 * @property {boolean} readingGuide
 * @property {boolean} keyboard
 * @property {TTSState} tts
 */

/** @type {A11yState} */
export const DEFAULTS = Object.freeze({
    contrast: 'none',
    textScale: 100,
    font: 'default',
    spacing: 'normal',
    align: 'default',
    underlineLinks: false,
    underlineHeaders: false,
    imgTitles: false,
    highlightFocus: false,
    hideImages: false,
    animations: true,
    cursor: 'default',
    readingGuide: false,
    keyboard: false,
    tts: Object.freeze({
        enabled: true,
        rate: 1.0,
        voice: null,
    }),
});

/**
 * Keys that are nested objects and need deep merge.
 * @type {string[]}
 */
const NESTED_KEYS = ['tts'];

/**
 * Creates a fresh deep copy of the defaults,
 * optionally merged with user-provided overrides.
 * @param {Partial<A11yState>} [overrides]
 * @returns {A11yState}
 */
export function createDefaultState(overrides) {
    const base = deepCloneDefaults();
    if (!overrides) { return base; }
    return mergeState(base, overrides);
}

/**
 * Merges a partial state object into an existing state.
 * Nested objects (e.g. tts) are merged shallowly one level deep.
 * @param {A11yState} current
 * @param {Partial<A11yState>} partial
 * @returns {A11yState}
 */
export function mergeState(current, partial) {
    const next = Object.assign({}, current);
    Object.keys(partial).forEach(function (key) {
        if (NESTED_KEYS.includes(key) && partial[key] !== null && typeof partial[key] === 'object') {
            next[key] = Object.assign({}, current[key] || {}, partial[key]);
        } else {
            next[key] = partial[key];
        }
    });
    return next;
}

/**
 * Resets a single module key back to its default value.
 * @param {A11yState} current
 * @param {keyof A11yState} key
 * @returns {A11yState}
 */
export function resetModuleState(current, key) {
    const next = Object.assign({}, current);
    if (NESTED_KEYS.includes(key)) {
        next[key] = Object.assign({}, DEFAULTS[key]);
    } else {
        next[key] = DEFAULTS[key];
    }
    return next;
}

/**
 * Serializes state to a JSON string for storage.
 * Strips non-serializable values (e.g. voice object).
 * @param {A11yState} state
 * @returns {string}
 */
export function serializeState(state) {
    const serializable = Object.assign({}, state, {
        tts: Object.assign({}, state.tts, { voice: null }),
    });
    return JSON.stringify(serializable);
}

/**
 * Deserializes a JSON string from storage into a valid state object.
 * Falls back to defaults for any missing or invalid keys.
 * @param {string} raw
 * @returns {A11yState}
 */
export function deserializeState(raw) {
    try {
        const parsed = JSON.parse(raw);
        return mergeState(deepCloneDefaults(), parsed);
    } catch (_) {
        return deepCloneDefaults();
    }
}

/**
 * Saves state to the provided storage adapter.
 * @param {A11yState} state
 * @param {import('./storage').StorageAdapter} storage
 * @param {string} key
 */
export function saveState(state, storage, key) {
    storage.setItem(key, serializeState(state));
}

/**
 * Loads state from the provided storage adapter.
 * Returns defaults if nothing is stored.
 * @param {import('./storage').StorageAdapter} storage
 * @param {string} key
 * @returns {A11yState}
 */
export function loadState(storage, key) {
    const raw = storage.getItem(key);
    if (!raw) { return deepCloneDefaults(); }
    return deserializeState(raw);
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function deepCloneDefaults() {
    return Object.assign({}, DEFAULTS, {
        tts: Object.assign({}, DEFAULTS.tts),
    });
}
