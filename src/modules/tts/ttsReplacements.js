/**
 * TTS text normalization rules.
 * Expands abbreviations and normalizes symbols before speech synthesis.
 *
 * Three layers, in the order they are applied:
 *   1. universal — symbols that mean the same thing everywhere
 *   2. locale    — supplied by the active locale pack (src/i18n/<lang>.js), so
 *      a language only ever rewrites its own abbreviations
 *   3. custom    — rules a host added through addReplacements()
 */

import { getSpeechRules } from '../../i18n/index.js';

/**
 * @typedef {Object} ReplacementRule
 * @property {RegExp} search
 * @property {string} replace
 * @property {string|null} [lang] - Custom rules only: omit or use null to
 *   apply to every language, or name one ('id', 'en', …) to scope it.
 */

/**
 * Symbols whose spoken form is the same word in every locale this package
 * ships. Anything language-shaped — "Rp.", "&", "Kab." — belongs to a locale
 * pack, because there is no universal right answer for how to say it.
 */
/** @type {ReplacementRule[]} */
export const UNIVERSAL_REPLACEMENTS = [
    { search: /\+/g, replace: 'plus', lang: null },
];

/** Host-added rules, kept separate so a locale switch cannot swallow them. */
/** @type {ReplacementRule[]} */
let _custom = [];

/**
 * Applies the active rules for one language to a text string.
 * @param {string} text
 * @param {string} lang - Language being spoken (e.g. 'id', 'en')
 * @returns {string}
 */
export function applyReplacements(text, lang) {
    let result = text;
    rulesFor(lang).forEach(function (rule) {
        result = result.replace(rule.search, rule.replace);
    });
    return result;
}

/**
 * The rules that would be applied for a language, in order.
 * @param {string} [lang] - Omit for the universal layer plus unscoped custom rules
 * @returns {ReplacementRule[]}
 */
export function rulesFor(lang) {
    const custom = _custom.filter(function (rule) {
        return !rule.lang || rule.lang === lang;
    });
    return UNIVERSAL_REPLACEMENTS.concat(lang ? getSpeechRules(lang) : [], custom);
}

/**
 * Adds custom replacement rules (merged with existing).
 * @param {ReplacementRule[]} rules
 */
export function addReplacements(rules) {
    _custom = _custom.concat(rules);
}

/**
 * Replaces the host's custom rules with a new set. Built-in and locale rules
 * are never reachable from here — pass `lang` on a rule to scope it.
 * @param {ReplacementRule[]} rules
 */
export function setReplacements(rules) {
    _custom = rules.slice();
}

/**
 * Drops every rule the host added.
 */
export function resetReplacements() {
    _custom = [];
}

/**
 * Returns the host-added rules in effect.
 * @returns {ReplacementRule[]}
 */
export function getReplacements() {
    return _custom.slice();
}
