/**
 * Highlights module.
 * Sets/removes data attributes on <html> only.
 * All visual rules live in _modifiers.scss — no style injection here.
 */

// ─── Underline Links ─────────────────────────────────────────────────────────

/**
 * @param {boolean} enable
 */
export function applyUnderlineLinks(enable) {
    _setAttr('data-a11y-underline-links', enable);
}

// ─── Underline Headers ───────────────────────────────────────────────────────

/**
 * @param {boolean} enable
 */
export function applyUnderlineHeaders(enable) {
    _setAttr('data-a11y-underline-headers', enable);
}

// ─── Highlight Focus / Hover ─────────────────────────────────────────────────

/**
 * @param {boolean} enable
 */
export function applyHighlightFocus(enable) {
    _setAttr('data-a11y-highlight-focus', enable);
}

// ─── Keyboard Navigation ─────────────────────────────────────────────────────

/**
 * @param {boolean} enable
 */
export function applyKeyboardNav(enable) {
    _setAttr('data-a11y-keyboard', enable);
}

// ─── Reset ───────────────────────────────────────────────────────────────────

export function resetHighlights() {
    applyUnderlineLinks(false);
    applyUnderlineHeaders(false);
    applyHighlightFocus(false);
    applyKeyboardNav(false);
}

/**
 * Alias kept for lifecycle symmetry with other modules.
 * No injected elements to remove — just reset attributes.
 */
export function destroyHighlights() {
    resetHighlights();
}

// ─── Internal ────────────────────────────────────────────────────────────────

function _setAttr(attr, enable) {
    const html = document.documentElement;
    if (enable) {
        html.setAttribute(attr, 'on');
    } else {
        html.removeAttribute(attr);
    }
}
