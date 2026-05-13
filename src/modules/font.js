/**
 * Font module.
 * Switches between default and a more readable font (e.g. system sans-serif).
 * CSS handles the actual font-family change via data attribute.
 */

const ATTR = 'data-a11y-font';

/**
 * Applies the font setting.
 * @param {'default'|'readable'} value
 */
export function applyFont(value) {
    const html = document.documentElement;
    if (value === 'default') {
        html.removeAttribute(ATTR);
    } else {
        html.setAttribute(ATTR, value);
    }
}

/**
 * Resets font to default.
 */
export function resetFont() {
    applyFont('default');
}
