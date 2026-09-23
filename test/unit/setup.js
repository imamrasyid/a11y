import { afterEach } from 'vitest';

// jsdom does not implement scrollIntoView, which the TTS highlighter calls.
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function () { /* noop */ };
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
    document.body.innerHTML = '';
    document.head.querySelectorAll('style[id^="a11y"]').forEach(function (el) { el.remove(); });
    A11Y_ATTRS.forEach(function (attr) { document.documentElement.removeAttribute(attr); });
});
