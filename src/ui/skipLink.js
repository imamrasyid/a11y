/**
 * Skip link module.
 * Injects a "skip to main content" link as the first focusable element.
 * Helps keyboard users bypass navigation.
 */

/** @type {HTMLElement|null} */
let skipLinkEl = null;

/**
 * Mounts the skip link into the DOM.
 * @param {string} label - Visible link text (from i18n).
 */
export function mountSkipLink(label) {
    if (skipLinkEl) { return; }

    skipLinkEl = document.createElement('a');
    skipLinkEl.href = '#a11y-main-content';
    skipLinkEl.className = 'a11y-skip-link';
    skipLinkEl.textContent = label || 'Skip to main content';

    document.body.insertBefore(skipLinkEl, document.body.firstChild);

    // Ensure the main content element has an id to target
    const main =
        document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('.main-content') ||
        document.querySelector('#content');

    if (main) {
        if (!main.id) {
            main.id = 'a11y-main-content';
        } else {
            skipLinkEl.href = '#' + main.id;
        }
    }
}

/**
 * Removes the skip link from the DOM.
 */
export function unmountSkipLink() {
    if (skipLinkEl && skipLinkEl.parentNode) {
        skipLinkEl.parentNode.removeChild(skipLinkEl);
    }
    skipLinkEl = null;
}
