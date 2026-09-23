/**
 * State management core.
 * Handles defaults, merging, persistence, migration and per-module reset.
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
 * @property {boolean} animationsExplicit - user touched the switch, so `animations`
 *                                        overrides prefers-reduced-motion
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
    animationsExplicit: false,
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

/** Allowed values for the enumerated settings — anything else is dropped. */
const ENUM_VALUES = {
    contrast: ['none', 'bright', 'reverse', 'grayscale'],
    font: ['default', 'readable'],
    spacing: ['normal', 'wide'],
    align: ['default', 'left'],
    cursor: ['default', 'white', 'black'],
};

/** @type {string[]} */
const STATE_KEYS = Object.keys(DEFAULTS);

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
 * Keeps only the keys and values this version understands. Unknown keys are
 * dropped so a stale (or hand-edited) payload cannot push arbitrary values
 * into `data-a11y-*` attributes.
 * @param {any} parsed
 * @returns {Partial<A11yState>}
 */
export function sanitizeState(parsed) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) { return {}; }

    /** @type {Partial<A11yState>} */
    const clean = {};
    STATE_KEYS.forEach(function (key) {
        if (isValidValue(key, parsed[key])) {
            clean[key] = parsed[key];
        }
    });

    const tts = parsed.tts;
    if (tts && typeof tts === 'object') {
        if (isValidValue('ttsEnabled', tts.enabled)) { clean.tts = Object.assign(clean.tts || {}, { enabled: tts.enabled }); }
        if (isValidValue('ttsRate', tts.rate)) { clean.tts = Object.assign(clean.tts || {}, { rate: tts.rate }); }
    }

    return clean;
}

/**
 * Deserializes a JSON string from storage into a valid state object.
 * Falls back to defaults for any missing or invalid keys.
 * @param {string} raw
 * @returns {A11yState}
 */
export function deserializeState(raw) {
    try {
        return mergeState(deepCloneDefaults(), sanitizeState(JSON.parse(raw)));
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
 * Reads only what storage actually holds, as a partial patch.
 * Returns null when nothing is stored or the payload cannot be used —
 * so callers can tell "no preference yet" apart from "preference = default".
 * @param {import('./storage').StorageAdapter} storage
 * @param {string} key
 * @returns {Partial<A11yState>|null}
 */
export function loadStoredPatch(storage, key) {
    const raw = storage.getItem(key);
    if (!raw) { return null; }
    try {
        const patch = sanitizeState(JSON.parse(raw));
        return Object.keys(patch).length ? patch : null;
    } catch (_) {
        return null;
    }
}

/**
 * Moves preferences written by an older build (or by the single-file widget
 * this library was extracted from) onto `key`.
 *
 * Refuses to touch anything when `key` already holds a payload, and only
 * removes the legacy key after a successful copy.
 *
 * @param {import('./storage').StorageAdapter} storage
 * @param {string} key             Current storage key
 * @param {string[]} legacyKeys    Keys to read, in priority order
 * @returns {A11yState|null}       Migrated state, or null when nothing moved
 */
export function migrateState(storage, key, legacyKeys) {
    if (!Array.isArray(legacyKeys) || !legacyKeys.length) { return null; }
    if (storage.getItem(key)) { return null; }

    for (let i = 0; i < legacyKeys.length; i++) {
        const legacyKey = legacyKeys[i];
        const raw = storage.getItem(legacyKey);
        if (!raw) { continue; }

        const parsed = safeParse(raw);
        if (!parsed || !Object.keys(sanitizeState(parsed)).length) { continue; }

        const legacy = deserializeState(raw);
        // The legacy build persisted every key, so a payload that carries
        // `animations` proves the user chose it — that choice outranks the
        // OS preference and must survive the move.
        legacy.animationsExplicit = parsed.animations !== undefined;

        saveState(legacy, storage, key);
        storage.removeItem(legacyKey);
        return legacy;
    }

    return null;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function safeParse(raw) {
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
        return null;
    }
}

function isValidValue(key, value) {
    if (typeof value === 'undefined') { return false; }
    if (key === 'textScale' || key === 'ttsRate') {
        return typeof value === 'number' && isFinite(value);
    }
    if (key === 'ttsEnabled') { return typeof value === 'boolean'; }
    if (ENUM_VALUES[key]) { return ENUM_VALUES[key].includes(value); }
    return typeof value === 'boolean';
}

function deepCloneDefaults() {
    return Object.assign({}, DEFAULTS, {
        tts: Object.assign({}, DEFAULTS.tts),
    });
}
