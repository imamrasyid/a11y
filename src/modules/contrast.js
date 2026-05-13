/**
 * Contrast module.
 * Applies color contrast modes via data attributes on <html>.
 * CSS is responsible for the actual visual changes.
 *
 * Supported values: 'none' | 'bright' | 'reverse' | 'grayscale'
 */

const ATTR = 'data-a11y-contrast';

/**
 * Applies the contrast mode to the document.
 * @param {'none'|'bright'|'reverse'|'grayscale'} value
 */
export function applyContrast(value) {
    const html = document.documentElement;
    if (value === 'none') {
        html.removeAttribute(ATTR);
    } else {
        html.setAttribute(ATTR, value);
    }
}

/**
 * Resets contrast to default (none).
 */
export function resetContrast() {
    applyContrast('none');
}
