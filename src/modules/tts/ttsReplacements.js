/**
 * TTS text normalization rules.
 * Expands abbreviations and normalizes symbols before speech synthesis.
 * Rules are applied based on the active language.
 */

/**
 * @typedef {Object} ReplacementRule
 * @property {RegExp} search
 * @property {string} replace
 * @property {string|null} lang - null = apply to all languages
 */

/** @type {ReplacementRule[]} */
export const DEFAULT_REPLACEMENTS = [
    // Indonesian abbreviations
    { search: /\bKab\.\s*/gi, replace: 'Kabupaten ', lang: 'id' },
    { search: /\bKec\.\s*/gi, replace: 'Kecamatan ', lang: 'id' },
    { search: /\bKel\.\s*/gi, replace: 'Kelurahan ', lang: 'id' },
    { search: /\bDr\.\s*/gi, replace: 'Doktor ', lang: 'id' },
    { search: /\bProf\.\s*/gi, replace: 'Profesor ', lang: 'id' },
    { search: /\bSH\b/gi, replace: 'Sarjana Hukum', lang: 'id' },
    { search: /\bSE\b/gi, replace: 'Sarjana Ekonomi', lang: 'id' },
    { search: /\bST\b/gi, replace: 'Sarjana Teknik', lang: 'id' },
    { search: /\bSIP\b/gi, replace: 'Sarjana Ilmu Pemerintahan', lang: 'id' },
    { search: /\bM\.Si\b/gi, replace: 'Magister Sains', lang: 'id' },
    { search: /\bM\.M\b/gi, replace: 'Magister Manajemen', lang: 'id' },
    { search: /\bPemkab\b/gi, replace: 'Pemerintah Kabupaten', lang: 'id' },
    { search: /\bPemkot\b/gi, replace: 'Pemerintah Kota', lang: 'id' },
    { search: /\bDiskominfo\b/gi, replace: 'Dinas Komunikasi dan Informatika', lang: 'id' },
    { search: /\bBPBD\b/gi, replace: 'Badan Penanggulangan Bencana Daerah', lang: 'id' },
    { search: /\bDPRD\b/gi, replace: 'Dewan Perwakilan Rakyat Daerah', lang: 'id' },
    { search: /\bAPBD\b/gi, replace: 'Anggaran Pendapatan dan Belanja Daerah', lang: 'id' },
    { search: /\bASN\b/gi, replace: 'Aparatur Sipil Negara', lang: 'id' },
    { search: /\bOPD\b/gi, replace: 'Organisasi Perangkat Daerah', lang: 'id' },
    { search: /\bUMKM\b/gi, replace: 'Usaha Mikro Kecil dan Menengah', lang: 'id' },
    { search: /\bRSUD\b/gi, replace: 'Rumah Sakit Umum Daerah', lang: 'id' },
    { search: /\bPKM\b/gi, replace: 'Puskesmas', lang: 'id' },
    { search: /\bWIB\b/gi, replace: 'Waktu Indonesia Barat', lang: 'id' },
    { search: /\bWITA\b/gi, replace: 'Waktu Indonesia Tengah', lang: 'id' },
    { search: /\bWIT\b/gi, replace: 'Waktu Indonesia Timur', lang: 'id' },
    { search: /Rp\.?\s*/g, replace: 'Rupiah ', lang: 'id' },
    // Universal
    { search: /&amp;/g, replace: 'dan', lang: null },
    { search: /&/g, replace: 'dan', lang: null },
    { search: /\+/g, replace: 'plus', lang: null },
];

/** @type {ReplacementRule[]} */
let _rules = DEFAULT_REPLACEMENTS.slice();

/**
 * Applies all active replacement rules to a text string.
 * @param {string} text
 * @param {string} lang - Active language code (e.g. 'id', 'en')
 * @returns {string}
 */
export function applyReplacements(text, lang) {
    let result = text;
    _rules.forEach(function (rule) {
        if (rule.lang === null || rule.lang === lang) {
            result = result.replace(rule.search, rule.replace);
        }
    });
    return result;
}

/**
 * Adds custom replacement rules (merged with existing).
 * @param {ReplacementRule[]} rules
 */
export function addReplacements(rules) {
    _rules = _rules.concat(rules);
}

/**
 * Replaces all replacement rules with a custom set.
 * @param {ReplacementRule[]} rules
 */
export function setReplacements(rules) {
    _rules = rules.slice();
}

/**
 * Resets replacement rules to the built-in defaults.
 */
export function resetReplacements() {
    _rules = DEFAULT_REPLACEMENTS.slice();
}

/**
 * Returns the current active rules.
 * @returns {ReplacementRule[]}
 */
export function getReplacements() {
    return _rules.slice();
}
