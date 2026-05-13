/**
 * TTS engine module.
 * Handles speak, pause, resume, cancel, and chunk-based playback
 * with element and word highlighting.
 */

import { applyReplacements } from './ttsReplacements.js';
import { selectVoice, getLangCode } from './ttsVoice.js';
import { highlightElement, highlightWord, clearHighlight } from './ttsHighlight.js';

const MAX_CHUNK_LENGTH = 200;

/** @type {SpeechSynthesis|null} */
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

/** @type {Array<string|{el: Element, text: string}>} */
let chunks = [];
let chunkIndex = 0;
let _rate = 1.0;
/** @type {SpeechSynthesisVoice|null} */
let _voice = null;
let _paused = false;
let _lang = 'id';

/** @type {function|null} */
let onStartCb = null;
/** @type {function|null} */
let onProgressCb = null;
/** @type {function|null} */
let onEndCb = null;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Speaks a plain text string.
 * @param {string} text
 * @param {object} [options]
 * @param {number} [options.rate]
 * @param {SpeechSynthesisVoice} [options.voice]
 * @param {string} [options.lang]
 * @param {function} [options.onStart]
 * @param {function} [options.onProgress]
 * @param {function} [options.onEnd]
 */
export function speak(text, options) {
    if (!synth || !text || !text.trim()) { return; }
    const opts = options || {};
    cancel();

    _rate = opts.rate || 1.0;
    _lang = opts.lang || 'id';
    _voice = opts.voice || selectVoice(_lang);
    onStartCb = opts.onStart || null;
    onProgressCb = opts.onProgress || null;
    onEndCb = opts.onEnd || null;
    _paused = false;

    const processed = applyReplacements(text, _lang);
    chunks = splitText(processed);
    chunkIndex = 0;
    speakChunk();
}

/**
 * Speaks a list of content chunks (text strings or {el, text} objects).
 * Used for reading the full page content with element highlighting.
 * @param {Array<string|{el: Element, text: string}>} chunkList
 * @param {object} [options]
 * @param {number} [options.rate]
 * @param {SpeechSynthesisVoice} [options.voice]
 * @param {string} [options.lang]
 * @param {function} [options.onStart]
 * @param {function} [options.onProgress]
 * @param {function} [options.onEnd]
 */
export function speakChunks(chunkList, options) {
    if (!synth) { return; }
    const opts = options || {};
    cancel();

    _rate = opts.rate || 1.0;
    _lang = opts.lang || 'id';
    _voice = opts.voice || selectVoice(_lang);
    onStartCb = opts.onStart || null;
    onProgressCb = opts.onProgress || null;
    onEndCb = opts.onEnd || null;
    _paused = false;

    chunks = chunkList.map(function (c) {
        if (typeof c === 'string') {
            return applyReplacements(c, _lang);
        }
        return { el: c.el, text: applyReplacements(c.text, _lang) };
    });
    chunkIndex = 0;
    speakChunk();
}

/**
 * Pauses speech.
 */
export function pause() {
    if (synth && synth.speaking && !synth.paused) {
        _paused = true;
        synth.pause();
    }
}

/**
 * Resumes paused speech.
 */
export function resume() {
    if (synth && synth.paused) {
        _paused = false;
        synth.resume();
    }
}

/**
 * Cancels all speech and clears the queue.
 */
export function cancel() {
    _paused = false;
    clearHighlight();
    if (synth) { synth.cancel(); }
    chunks = [];
    chunkIndex = 0;
}

/**
 * Sets the speech rate.
 * @param {number} rate - 0.1 to 10
 */
export function setRate(rate) {
    _rate = Math.min(10, Math.max(0.1, rate));
}

/**
 * Sets the voice.
 * @param {SpeechSynthesisVoice|null} voice
 */
export function setVoice(voice) {
    _voice = voice;
}

/**
 * Returns true if speech is currently playing.
 * @returns {boolean}
 */
export function isPlaying() {
    return !!(synth && synth.speaking && !synth.paused);
}

/**
 * Returns true if speech is paused.
 * @returns {boolean}
 */
export function isPaused() {
    return !!(synth && synth.paused);
}

/**
 * Returns true if the Speech Synthesis API is supported.
 * @returns {boolean}
 */
export function isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Extracts readable content from the page as an array of {el, text} chunks.
 * @returns {Array<{el: Element, text: string}>}
 */
export function getPageContent() {
    const selectors = [
        'main', 'article', '.post-details-article',
        '.content-area', '#content', '.main-content',
        '.container',
    ];

    let container = null;
    for (let i = 0; i < selectors.length; i++) {
        container = document.querySelector(selectors[i]);
        if (container) { break; }
    }
    if (!container) { container = document.body; }

    const nodes = container.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,blockquote');
    const result = [];
    nodes.forEach(function (node) {
        const txt = (node.innerText || '').trim();
        if (txt && txt.length > 2) {
            result.push({ el: node, text: txt });
        }
    });
    return result;
}

// ─── Internal ────────────────────────────────────────────────────────────────

function speakChunk() {
    if (chunkIndex >= chunks.length) {
        clearHighlight();
        if (onEndCb) { onEndCb(); }
        return;
    }

    const chunk = chunks[chunkIndex];
    const chunkEl = (chunk && chunk.el) ? chunk.el : null;
    const chunkTxt = (chunk && chunk.text) ? chunk.text : String(chunk);

    const utt = new SpeechSynthesisUtterance(chunkTxt);
    utt.rate = _rate;
    utt.lang = getLangCode(_lang);
    if (_voice) { utt.voice = _voice; }

    utt.onstart = function () {
        if (chunkIndex === 0 && onStartCb) { onStartCb(); }
        if (chunkEl) { highlightElement(chunkEl); }
        if (onProgressCb) { onProgressCb(chunkIndex, chunks.length); }
    };

    utt.onboundary = function (e) {
        if (e.name !== 'word') { return; }
        if (chunkEl) { highlightWord(chunkEl, e.charIndex, e.charLength || 1); }
    };

    utt.onend = function () {
        clearHighlight();
        chunkIndex++;
        if (!_paused) { speakChunk(); }
    };

    utt.onerror = function (e) {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
            chunkIndex++;
            speakChunk();
        }
    };

    synth.speak(utt);
}

/**
 * Splits text into speakable chunks of max MAX_CHUNK_LENGTH characters.
 * Tries to split on sentence boundaries first.
 * @param {string} text
 * @returns {string[]}
 */
function splitText(text) {
    if (!text || !text.trim()) { return []; }
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    const result = [];
    let current = '';

    sentences.forEach(function (s) {
        const trimmed = s.trim();
        if (!trimmed) { return; }
        if ((current + trimmed).length > MAX_CHUNK_LENGTH) {
            if (current) { result.push(current.trim()); }
            current = trimmed;
        } else {
            current += (current ? ' ' : '') + trimmed;
        }
    });

    if (current.trim()) { result.push(current.trim()); }
    return result.length ? result : [text.trim()];
}
