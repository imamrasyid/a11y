/**
 * i18n resolver.
 * Resolves the active locale strings, with support for:
 *   - Built-in locales: 'id', 'en'
 *   - Locales a host registered with registerLocale()
 *   - Custom locale objects passed directly via options
 *   - Partial overrides merged on top of a base locale
 *
 * Only 'id' and 'en' are imported above, which means only those two are in the
 * bundle: a registered locale is a file the host chose to ship, so adding a
 * language never makes the widget heavier for anyone else. The packs under
 * `src/i18n/` that no built-in import references are ready to register.
 *
 * Each locale also owns the rules the text reader pronounces with — see
 * `getSpeechRules`, which the TTS module asks per spoken language.
 */

import id, { speechRules as idRules } from './id.js';
import en, { speechRules as enRules } from './en.js';

/** @type {Record<string, object>} */
const BUILT_IN = { id, en };

/** @type {Record<string, Array<{search: RegExp, replace: string}>>} */
const SPEECH_RULES = { id: idRules, en: enRules };

/** Locales added by the host at runtime. @type {Record<string, object>} */
const REGISTERED = {};

/** @type {Record<string, Array<{search: RegExp, replace: string}>>} */
const REGISTERED_RULES = {};

/** @type {object} */
let _strings = id;

/**
 * Puts a pack's own keys over a base locale, dropping the ones it has not
 * translated yet. An empty value means a reviewer never reached that key, so
 * the base wording stays: a half-finished locale must never hand a visitor a
 * panel of blank buttons, and a locale that is still entirely empty must be
 * indistinguishable from the base.
 *
 * @param {object} base
 * @param {object} pack
 * @returns {object}
 */
function mergeOver(base, pack) {
    const merged = Object.assign({}, base);
    Object.keys(pack).forEach(function (key) {
        const value = pack[key];
        if (typeof value === 'string' && value !== '') {
            merged[key] = value;
        }
    });
    return merged;
}

/**
 * Registers a locale pack so `lang` can name it. Call this before init(): the
 * code is resolved once, while the panel is being built.
 *
 * Registering a code that is already built in overrides it — useful for
 * correcting a shipped string without waiting for a release. Keys the
 * correction leaves out keep the built-in text rather than the base locale's.
 *
 * @param {string} code - Locale code the host will pass as `lang`, e.g. 'jv'
 * @param {object} strings - Full or partial pack; empty values keep the base text
 * @param {Array<{search: RegExp, replace: string}>} [rules] - How the reader
 *   pronounces this language. Replaces the built-in rules for the same code.
 */
export function registerLocale(code, strings, rules) {
    REGISTERED[code] = strings || {};
    if (Array.isArray(rules)) {
        REGISTERED_RULES[code] = rules;
    }
}

/**
 * Initializes the i18n module with the given lang option.
 * @param {string|object} lang - A locale code ('id'|'en'|registered) or a full/partial strings object.
 * @param {string} [baseLang='id'] - Locale to fall back to when `lang` is
 *   unknown, or the base a partial strings object is merged onto.
 * @returns {string} the locale code the panel text ended up using
 */
export function initI18n(lang, baseLang) {
    const fallback = BUILT_IN[baseLang] ? baseLang : 'id';
    const base = BUILT_IN[fallback];

    if (lang && typeof lang === 'object') {
        // Custom or partial override — merge on top of base
        _strings = mergeOver(base, lang);
        return fallback;
    }

    if (typeof lang === 'string') {
        if (REGISTERED[lang]) {
            // Registering under a bundled code corrects it, so the shipped pack
            // is the base: the keys the correction leaves out must keep their
            // original language rather than switching to baseLang.
            _strings = mergeOver(BUILT_IN[lang] || base, REGISTERED[lang]);
            return lang;
        }
        if (BUILT_IN[lang]) {
            _strings = BUILT_IN[lang];
            return lang;
        }
    }

    // An unrecognised code is usually a typo or a locale this build does not
    // ship (lang: 'jv' selects a Javanese *voice* with no pack registered —
    // only the panel text falls back). Saying so beats silence.
    if (lang && typeof console !== 'undefined' && console.warn) {
        console.warn(
            '[a11y-widget] Unknown locale "' + lang + '". Panel text uses "' + fallback +
            '" instead. Bundled locales: ' + Object.keys(BUILT_IN).join(', ') +
            '. Add one with A11yWidget.registerLocale(code, strings, rules).',
        );
    }
    _strings = base;
    return fallback;
}

/**
 * Returns the strings object currently in use.
 * @returns {object}
 */
export function getStrings() {
    return _strings;
}

/**
 * Returns the speech rules for one language. Unknown languages get none: the
 * reader pronounces the text as written rather than guessing at abbreviations
 * borrowed from another locale.
 * @param {string} lang
 * @returns {Array<{search: RegExp, replace: string}>}
 */
export function getSpeechRules(lang) {
    return REGISTERED_RULES[lang] || SPEECH_RULES[lang] || [];
}

/**
 * Gets a single translated string by key.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
    return _strings[key] || key;
}

/**
 * Every locale code `lang` can resolve to right now: the two bundled packs
 * plus whatever this page registered.
 * @returns {string[]}
 */
export function getAvailableLocales() {
    const codes = Object.keys(BUILT_IN);
    Object.keys(REGISTERED).forEach(function (code) {
        if (codes.indexOf(code) === -1) {
            codes.push(code);
        }
    });
    return codes;
}
