/**
 * Text scale module.
 *
 * Grows the page's own type instead of replacing it: <html> is rescaled so
 * `rem` sizes follow, <body> so inherited and `em` sizes follow, and the ratio
 * is published as --a11y-scale-ratio for a host that drives its own scale.
 *
 * The old rules that pinned <span>, <p>, <li>, <td> and every heading level to
 * pixel values this module invented are gone on purpose — they overwrote the
 * host's design with numbers nobody asked for. Text a site fixes to an absolute
 * pixel size therefore does not grow; that cascade belongs to the host.
 *
 * Range: 70–200 (percent). At 100% the style tag is emptied.
 */

/** @type {HTMLStyleElement|null} */
let styleEl = null;

const ATTR = 'data-a11y-scale';
const MIN = 70;
const MAX = 200;
const DEFAULT = 100;
/** Used when no layout engine can report a size (jsdom) or the host hid <body>. */
const FALLBACK_PX = 16;

// The widget's own UI inherits <body>'s size, so it would grow with the page.
// Pinning it back to the measured base leaves it the size it had before the
// setting was touched — while its internal type scale stays intact, because the
// pin sits on the four roots only.
const OWN_UI = '.a11y-panel, .a11y-fab, .a11y-tts-prompt, .a11y-skip-link';

/** @type {{ root: number|null, body: number|null }} */
let base = { root: null, body: null };

/** @type {string} */
let nonce = '';

/**
 * Called once per init(): sets the measuring policy and forgets any measurement
 * an earlier instance took.
 *
 * @param {object} [options]
 * @param {number|'auto'} [options.scaleBase='auto'] 'auto' measures the page;
 *   a number is taken as the body pixel size without measuring.
 * @param {string} [options.styleNonce] CSP nonce for the injected <style> tag.
 */
export function configureTextScale(options) {
    const opts = options || {};
    const fixed = typeof opts.scaleBase === 'number' && isFinite(opts.scaleBase) && opts.scaleBase > 0;
    base = { root: null, body: fixed ? opts.scaleBase : null };
    nonce = typeof opts.styleNonce === 'string' ? opts.styleNonce : '';
}

/**
 * @param {number} scale - Percentage value (70–200).
 */
export function applyTextScale(scale) {
    const clamped = clampScale(scale);
    ensureStyleEl();

    if (clamped === DEFAULT) {
        styleEl.textContent = '';
        document.documentElement.removeAttribute(ATTR);
        return;
    }

    const r = clamped / 100;
    document.documentElement.setAttribute(ATTR, String(clamped));
    styleEl.textContent = buildCSS(r);
}

export function resetTextScale() {
    applyTextScale(DEFAULT);
}

/**
 * @param {number} value
 * @returns {number}
 */
export function clampScale(value) {
    return Math.min(MAX, Math.max(MIN, value));
}

/**
 * @returns {{ min: number, max: number, default: number, step: number }}
 */
export function getScaleBounds() {
    return { min: MIN, max: MAX, default: DEFAULT, step: 10 };
}

export function destroyTextScale() {
    if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
    }
    styleEl = null;
    document.documentElement.removeAttribute(ATTR);
    base = { root: null, body: null };
    nonce = '';
}

// ─── Internal ────────────────────────────────────────────────────────────────

function ensureStyleEl() {
    if (styleEl) {
        // A host app that rebuilds <head> (SPA navigation, Turbo, a strict style
        // manager) detaches our tag; writes to a detached node are silently lost.
        if (!styleEl.isConnected) { document.head.appendChild(styleEl); }
        return;
    }
    styleEl = document.createElement('style');
    styleEl.id = 'a11y-text-scale';
    // A nonce has to be on the element before it is inserted, so the injected
    // tag survives a style-src CSP that only allows nonced styles.
    if (nonce) { styleEl.setAttribute('nonce', nonce); }
    document.head.appendChild(styleEl);
}

/**
 * @param {number} r - Multiplier, e.g. 1.5 for 150%.
 * @returns {string}
 */
function buildCSS(r) {
    const b = resolveBase();
    return [
        ':root {',
        '  --a11y-scale-ratio: ' + r + ';',
        '}',

        // !important is deliberate here: this control exists to outvote a host
        // cascade that pinned its text to pixel values.
        'html[' + ATTR + '] { font-size: ' + px(b.root * r) + ' !important; }',
        'html[' + ATTR + '] body { font-size: ' + px(b.body * r) + ' !important; }',

        'html[' + ATTR + '] ' + OWN_UI + ' { font-size: ' + px(b.body) + '; }',
    ].join('\n');
}

/**
 * Measured once and then reused. Re-measuring per apply() would read back the
 * size the previous apply() wrote — and compound it on every step.
 * @returns {{ root: number, body: number }}
 */
function resolveBase() {
    if (base.root === null) { base.root = measuredPx(document.documentElement) || FALLBACK_PX; }
    if (base.body === null) {
        // <body> carries the reading text; a host that never styled it falls
        // back to the size it inherits, which is what measuring <html> gives.
        base.body = measuredPx(document.body) || base.root;
    }
    return base;
}

/**
 * @param {Element|null} el
 * @returns {number} 0 when the browser reports no usable size
 */
function measuredPx(el) {
    if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
        return 0;
    }
    const value = parseFloat(window.getComputedStyle(el).fontSize);
    return isFinite(value) && value > 0 ? value : 0;
}

/**
 * Rounded to whole pixels: a third of a pixel is invisible but makes every
 * rule differ in the injected text, which costs bytes.
 * @param {number} value
 * @returns {string}
 */
function px(value) {
    return Math.round(value) + 'px';
}
