/**
 * Cursor module.
 * Switches between default, large white, and large black cursor
 * via a data attribute on <html>. CSS provides the actual cursor images.
 */

const ATTR = 'data-a11y-cursor';

/**
 * Applies the cursor setting.
 * @param {'default'|'white'|'black'} value
 */
export function applyCursor(value) {
    const html = document.documentElement;
    if (value === 'default') {
        html.removeAttribute(ATTR);
    } else {
        html.setAttribute(ATTR, value);
    }
}

/**
 * Resets cursor to default.
 */
export function resetCursor() {
    applyCursor('default');
}
