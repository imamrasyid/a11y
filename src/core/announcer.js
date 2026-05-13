/**
 * ARIA live region announcer.
 * Injects a visually-hidden element that screen readers will announce.
 */

/** @type {HTMLElement|null} */
let liveRegionEl = null;

/**
 * Mounts the live region into the DOM.
 * Safe to call multiple times — only creates one element.
 */
export function mountAnnouncer() {
    if (liveRegionEl) { return; }

    liveRegionEl = document.createElement('div');
    liveRegionEl.className = 'a11y-live-region';
    liveRegionEl.setAttribute('aria-live', 'polite');
    liveRegionEl.setAttribute('aria-atomic', 'true');
    liveRegionEl.setAttribute('role', 'status');
    // Visually hidden but accessible
    Object.assign(liveRegionEl.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border: '0',
    });
    document.body.appendChild(liveRegionEl);
}

/**
 * Announces a message to screen readers.
 * Clears first to ensure re-announcement of the same message works.
 * @param {string} message
 */
export function announce(message) {
    if (!liveRegionEl) { return; }
    liveRegionEl.textContent = '';
    // Timeout ensures the DOM mutation is picked up by screen readers
    setTimeout(function () {
        if (liveRegionEl) { liveRegionEl.textContent = message; }
    }, 50);
}

/**
 * Removes the live region from the DOM.
 */
export function unmountAnnouncer() {
    if (liveRegionEl && liveRegionEl.parentNode) {
        liveRegionEl.parentNode.removeChild(liveRegionEl);
    }
    liveRegionEl = null;
}
