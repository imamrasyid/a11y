/**
 * Spacing module.
 * Controls line-height / letter-spacing via data attribute on <html>.
 */

const ATTR = 'data-a11y-spacing';

/**
 * Applies the spacing setting.
 * @param {'normal'|'wide'} value
 */
export function applySpacing(value) {
    const html = document.documentElement;
    if (value === 'normal') {
        html.removeAttribute(ATTR);
    } else {
        html.setAttribute(ATTR, value);
    }
}

/**
 * Resets spacing to normal.
 */
export function resetSpacing() {
    applySpacing('normal');
}
