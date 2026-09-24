/**
 * i18n resolver.
 * Resolves the active locale strings, with support for:
 *   - Built-in locales: 'id', 'en'
 *   - Custom locale objects passed directly via options
 *   - Partial overrides merged on top of a base locale
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

/** @type {object} */
let _strings = id;

/**
 * Initializes the i18n module with the given lang option.
 * @param {string|object} lang - A locale code ('id'|'en') or a full/partial strings object.
 * @param {string} [baseLang='id'] - Locale to fall back to when `lang` is
 *   unknown, or the base a partial strings object is merged onto.
 * @returns {string} the locale code the panel text ended up using
 */
export function initI18n(lang, baseLang) {
    const fallback = BUILT_IN[baseLang] ? baseLang : 'id';
    const base = BUILT_IN[fallback];

    if (lang && typeof lang === 'object') {
        // Custom or partial override — merge on top of base
        _strings = Object.assign({}, base, lang);
        return fallback;
    }

    if (typeof lang === 'string' && BUILT_IN[lang]) {
        _strings = BUILT_IN[lang];
        return lang;
    }

    // An unrecognised code is usually a typo or a locale this build does not
    // ship (lang: 'jv' still selects a Javanese *voice* — only the panel text
    // falls back). Saying so beats silently rendering Indonesian.
    if (lang && typeof console !== 'undefined' && console.warn) {
        console.warn(
            '[a11y-widget] Unknown locale "' + lang + '". Panel text uses "' + fallback +
            '" instead. Built-in locales: ' + Object.keys(BUILT_IN).join(', ') + '.',
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
    return SPEECH_RULES[lang] || [];
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
 * Returns all available built-in locale codes.
 * @returns {string[]}
 */
export function getAvailableLocales() {
    return Object.keys(BUILT_IN);
}
