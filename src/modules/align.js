/**
 * Text alignment module.
 * Sets/removes data-a11y-align on <html>.
 * All visual rules live in _modifiers.scss — no style injection.
 */

const ATTR = 'data-a11y-align';

/**
 * @param {'default'|'left'} value
 */
export function applyAlign(value) {
    const html = document.documentElement;
    if (value === 'left') {
        html.setAttribute(ATTR, 'left');
    } else {
        html.removeAttribute(ATTR);
    }
}

export function resetAlign() {
    applyAlign('default');
}

/**
 * Alias for lifecycle symmetry — no injected elements to remove.
 */
export function destroyAlign() {
    resetAlign();
}
