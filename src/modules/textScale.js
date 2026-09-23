/**
 * Text scale module.
 * Injects a <style> tag that scales font sizes proportionally.
 * Range: 70–200 (percent). At 100% the style tag is emptied.
 *
 * Strategy: override CSS custom properties on :root so any app using
 * CSS vars picks them up automatically. Also target common semantic
 * elements directly for apps that use hardcoded px values.
 * All widget-internal selectors are excluded via :not().
 */

/** @type {HTMLStyleElement|null} */
let styleEl = null;

const ATTR = 'data-a11y-scale';
const MIN = 70;
const MAX = 200;
const DEFAULT = 100;

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
    document.head.appendChild(styleEl);
}

function buildCSS(r) {
    const px = function (base) { return Math.round(base * r) + 'px'; };

    // Widget-internal classes to exclude from font scaling
    const exclude = [
        ':not(.a11y-opt__icon)',
        ':not(.a11y-opt__label)',
        ':not(.a11y-toggle-row__icon)',
        ':not(.a11y-section__label)',
        ':not(.a11y-textsize__display)',
        ':not(.a11y-panel__title)',
        ':not(.a11y-panel__footer-badge)',
    ].join('');

    return [
        // CSS custom properties — picked up by any app using vars
        ':root {',
        '  --a11y-scale-ratio: ' + r + ';',
        '}',

        // Semantic elements — generic, no project-specific selectors
        'html[' + ATTR + '] body { font-size: ' + px(16) + ' !important; }',
        'html[' + ATTR + '] p, html[' + ATTR + '] li, html[' + ATTR + '] td, html[' + ATTR + '] th {',
        '  font-size: ' + px(16) + ' !important;',
        '}',
        'html[' + ATTR + '] span' + exclude + ' { font-size: ' + px(16) + ' !important; }',
        'html[' + ATTR + '] h1 { font-size: ' + px(40) + ' !important; }',
        'html[' + ATTR + '] h2 { font-size: ' + px(32) + ' !important; }',
        'html[' + ATTR + '] h3 { font-size: ' + px(26) + ' !important; }',
        'html[' + ATTR + '] h4 { font-size: ' + px(20) + ' !important; }',
        'html[' + ATTR + '] h5 { font-size: ' + px(18) + ' !important; }',
        'html[' + ATTR + '] h6 { font-size: ' + px(16) + ' !important; }',
        'html[' + ATTR + '] a  { font-size: inherit; }',
    ].join('\n');
}
