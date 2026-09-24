import { afterEach } from 'vitest';
import { installSpeechSynthesis, resetSpeech } from './speechStub.js';
// Importing the module directly (rather than through src/index.js) keeps this
// file from evaluating the widget before the speech stub is installed.
import { revokePermission } from '../../src/modules/tts/ttsPermission.js';

// jsdom does not implement scrollIntoView, which the TTS highlighter calls.
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function () { /* noop */ };
}

// tts.js reads window.speechSynthesis when the module is first evaluated, so
// the stub has to be in place from this file rather than inside a test.
installSpeechSynthesis(globalThis);

// The permission prompt animates in through double rAF before wiring its
// buttons, so the tests need the callback to exist.
if (typeof globalThis.requestAnimationFrame !== 'function') {
    globalThis.requestAnimationFrame = function (cb) {
        return setTimeout(function () { cb(Date.now()); }, 0);
    };
}

const A11Y_ATTRS = [
    'data-a11y-contrast', 'data-a11y-scale', 'data-a11y-font', 'data-a11y-spacing',
    'data-a11y-align', 'data-a11y-underline-links', 'data-a11y-underline-headers',
    'data-a11y-highlight-focus', 'data-a11y-keyboard', 'data-a11y-hide-images',
    'data-a11y-img-titles', 'data-a11y-animations', 'data-a11y-cursor',
    'data-a11y-reading-guide',
];

afterEach(function () {
    localStorage.clear();
    // The reader's permission grant lives in sessionStorage plus an in-memory
    // flag; leaving either set would let one test speak without the prompt.
    try { sessionStorage.clear(); } catch (_) { /* noop */ }
    revokePermission();
    resetSpeech();
    document.body.innerHTML = '';
    document.head.querySelectorAll('style[id^="a11y"]').forEach(function (el) { el.remove(); });
    A11Y_ATTRS.forEach(function (attr) { document.documentElement.removeAttribute(attr); });
});
