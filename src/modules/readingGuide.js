/**
 * Reading guide module.
 * Renders a horizontal line that follows the mouse cursor.
 * Visibility is controlled entirely by CSS via data-a11y-reading-guide on <html>.
 * No style manipulation in JS.
 */

/** @type {HTMLElement|null} */
let guideEl = null;
/** @type {function|null} */
let mouseMoveHandler = null;

/**
 * Mounts the reading guide element into the DOM.
 * Safe to call multiple times — only creates one element.
 */
export function mountReadingGuide() {
    if (guideEl) { return; }

    guideEl = document.createElement('div');
    guideEl.className = 'a11y-reading-guide';
    guideEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(guideEl);

    mouseMoveHandler = function (e) {
        if (!guideEl) { return; }
        guideEl.style.top = (e.clientY - 18) + 'px';
    };
    document.addEventListener('mousemove', mouseMoveHandler);
}

/**
 * Toggles the reading guide.
 * @param {boolean} enable
 */
export function applyReadingGuide(enable) {
    if (!guideEl) { mountReadingGuide(); }
    const html = document.documentElement;
    if (enable) {
        html.setAttribute('data-a11y-reading-guide', 'on');
    } else {
        html.removeAttribute('data-a11y-reading-guide');
    }
}

export function resetReadingGuide() {
    applyReadingGuide(false);
}

/**
 * Removes the reading guide element and event listener.
 */
export function destroyReadingGuide() {
    if (mouseMoveHandler) {
        document.removeEventListener('mousemove', mouseMoveHandler);
        mouseMoveHandler = null;
    }
    if (guideEl && guideEl.parentNode) {
        guideEl.parentNode.removeChild(guideEl);
    }
    guideEl = null;
    document.documentElement.removeAttribute('data-a11y-reading-guide');
}
