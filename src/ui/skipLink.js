/**
 * Skip link module.
 * Injects a "skip to main content" link as the first focusable element.
 * Helps keyboard users bypass navigation.
 */

/** @type {HTMLElement|null} */
let skipLinkEl = null;

/** @type {Element|null} — main content element whose id this module injected. */
let injectedIdOn = null;

const TARGET_ID = 'a11y-main-content';

/**
 * Mounts the skip link into the DOM.
 * @param {string} label - Visible link text (from i18n).
 */
export function mountSkipLink(label) {
    if (skipLinkEl) { return; }

    const main =
        document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('.main-content') ||
        document.querySelector('#content');

    // A link that points at nothing is a trap, not a shortcut.
    if (!main) { return; }

    skipLinkEl = document.createElement('a');
    skipLinkEl.className = 'a11y-skip-link';
    skipLinkEl.textContent = label || 'Skip to main content';

    if (main.id) {
        skipLinkEl.href = '#' + main.id;
    } else {
        // The host owns its own attributes: remember that this one is ours.
        main.id = TARGET_ID;
        injectedIdOn = main;
        skipLinkEl.href = '#' + TARGET_ID;
    }

    document.body.insertBefore(skipLinkEl, document.body.firstChild);
}

/**
 * Removes the skip link, and the target id it injected.
 */
export function unmountSkipLink() {
    if (skipLinkEl && skipLinkEl.parentNode) {
        skipLinkEl.parentNode.removeChild(skipLinkEl);
    }
    skipLinkEl = null;

    if (injectedIdOn && injectedIdOn.id === TARGET_ID) {
        injectedIdOn.removeAttribute('id');
    }
    injectedIdOn = null;
}
