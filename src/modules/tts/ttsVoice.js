/**
 * TTS voice selection module.
 * Handles loading voices and selecting the best match for a given language.
 */

/** @type {SpeechSynthesisVoice[]} */
let _voices = [];

/**
 * Language → preferred BCP-47 codes, in priority order.
 * @type {Record<string, string[]>}
 */
const LANG_MAP = {
    id: ['id-ID', 'id'],
    en: ['en-US', 'en-GB', 'en'],
    jv: ['jv', 'id-ID', 'id'],
};

/**
 * Loads available voices from the Speech Synthesis API.
 * Handles the async voiceschanged event for browsers that need it.
 * @param {function} [onReady] - Called when voices are available.
 */
export function loadVoices(onReady) {
    if (typeof window === 'undefined' || !window.speechSynthesis) { return; }

    function tryLoad() {
        _voices = window.speechSynthesis.getVoices();
        if (_voices.length && onReady) { onReady(_voices); }
    }

    tryLoad();

    if (!_voices.length) {
        window.speechSynthesis.addEventListener('voiceschanged', function handler() {
            window.speechSynthesis.removeEventListener('voiceschanged', handler);
            _voices = window.speechSynthesis.getVoices();
            if (onReady) { onReady(_voices); }
        });
    }
}

/**
 * Returns all loaded voices.
 * @returns {SpeechSynthesisVoice[]}
 */
export function getVoices() {
    return _voices;
}

/**
 * Selects the best voice for the given language code.
 * Prefers female voices when available.
 * @param {string} lang - Language code (e.g. 'id', 'en')
 * @returns {SpeechSynthesisVoice|null}
 */
export function selectVoice(lang) {
    if (!_voices.length) {
        const direct = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
        if (!direct.length) { return null; }
        _voices = direct;
    }

    const preferred = LANG_MAP[lang] || LANG_MAP['id'];

    for (let i = 0; i < preferred.length; i++) {
        const code = preferred[i];

        const female = _voices.find(function (v) {
            return (v.lang === code || v.lang.startsWith(code)) &&
                /female|wanita|perempuan/i.test(v.name);
        });
        if (female) { return female; }

        const any = _voices.find(function (v) {
            return v.lang === code || v.lang.startsWith(code);
        });
        if (any) { return any; }
    }

    return _voices[0] || null;
}

/**
 * Maps a language code to a BCP-47 locale string for SpeechSynthesisUtterance.
 * @param {string} lang
 * @returns {string}
 */
export function getLangCode(lang) {
    const map = { id: 'id-ID', en: 'en-US', jv: 'id-ID' };
    return map[lang] || 'id-ID';
}
