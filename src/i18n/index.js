/**
 * i18n resolver.
 * Resolves the active locale strings, with support for:
 *   - Built-in locales: 'id', 'en'
 *   - Custom locale objects passed directly via options
 *   - Partial overrides merged on top of a base locale
 */

import id from './id.js';
import en from './en.js';

/** @type {Record<string, object>} */
const BUILT_IN = { id, en };

/** @type {object} */
let _strings = id;

/**
 * Initializes the i18n module with the given lang option.
 * @param {string|object} lang - A locale code ('id'|'en') or a full/partial strings object.
 * @param {string} [baseLang='id'] - Base locale to fall back to when lang is a partial object.
 */
export function initI18n(lang, baseLang) {
    const base = BUILT_IN[baseLang || 'id'] || id;

    if (lang && typeof lang === 'object') {
        // Custom or partial override — merge on top of base
        _strings = Object.assign({}, base, lang);
        return;
    }

    if (typeof lang === 'string' && BUILT_IN[lang]) {
        _strings = BUILT_IN[lang];
        return;
    }

    // Fallback to Indonesian
    _strings = id;
}

/**
 * Returns the current locale strings object.
 * @returns {object}
 */
export function getStrings() {
    return _strings;
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
