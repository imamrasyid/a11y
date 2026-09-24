/**
 * Images module.
 *
 * Hiding pictures is an attribute toggle the stylesheet acts on. Showing their
 * alt text cannot be: a loaded replaced element generates no ::before/::after
 * box in Chromium or Firefox, so `img::after { content: attr(alt) }` computes a
 * value and paints nothing. The caption therefore has to be a real element.
 *
 * Two things follow, and both are handled here rather than left to the host:
 * the inserted span is `aria-hidden`, because the image already announces its
 * alt once, and a MutationObserver keeps pictures that arrive later — ajax, SPA
 * routes, a gallery opening — captioned while the setting is on.
 */

const CAPTION_CLASS = 'a11y-img-caption';
const HIDE_ATTR = 'data-a11y-hide-images';
const CAPTION_ATTR = 'data-a11y-img-titles';
const OWN_UI = '.a11y-panel, .a11y-fab, .a11y-tts-prompt, .a11y-skip-link';

/** @type {MutationObserver|null} */
let observer = null;

/** Images this module has captioned, so a re-scan never adds a second span. */
let captioned = new WeakSet();

/** @type {Set<HTMLElement>} */
let inserted = new Set();

// ─── Hide Images ─────────────────────────────────────────────────────────────

/**
 * @param {boolean} enable
 */
export function applyHideImages(enable) {
    const html = document.documentElement;
    if (enable) {
        html.setAttribute(HIDE_ATTR, 'on');
    } else {
        html.removeAttribute(HIDE_ATTR);
    }
}

// ─── Alt Text Captions ───────────────────────────────────────────────────────

/**
 * @param {boolean} enable
 */
export function applyImgCaptions(enable) {
    const html = document.documentElement;

    if (!enable) {
        html.removeAttribute(CAPTION_ATTR);
        stopWatching();
        removeAllCaptions();
        return;
    }

    html.setAttribute(CAPTION_ATTR, 'on');
    captionExisting();
    watchForImages();
}

// ─── Reset ───────────────────────────────────────────────────────────────────

/**
 * Resets all image-related settings.
 */
export function resetImages() {
    applyHideImages(false);
    applyImgCaptions(false);
}

// ─── Internal ────────────────────────────────────────────────────────────────

function captionExisting() {
    document.querySelectorAll('img[alt]').forEach(captionOne);
}

/**
 * @param {Element|Node} node
 */
function captionSubtree(node) {
    if (node.nodeType !== 1) { return; }
    if (node.matches('img[alt]')) { captionOne(node); }
    node.querySelectorAll('img[alt]').forEach(captionOne);
}

/**
 * @param {Element} img
 */
function captionOne(img) {
    const text = img.getAttribute('alt');
    if (!text || !text.trim()) { return; }
    if (captioned.has(img)) { return; }
    if (img.closest(OWN_UI)) { return; }

    const caption = document.createElement('span');
    caption.className = CAPTION_CLASS;
    caption.setAttribute('aria-hidden', 'true');
    caption.textContent = text;
    img.after(caption);

    captioned.add(img);
    inserted.add(caption);
}

function watchForImages() {
    if (observer || typeof MutationObserver === 'undefined') { return; }
    observer = new MutationObserver(function (records) {
        for (const record of records) {
            record.addedNodes.forEach(captionSubtree);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function stopWatching() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
}

function removeAllCaptions() {
    inserted.forEach(function (caption) {
        if (caption.isConnected) { caption.remove(); }
    });
    inserted = new Set();
    captioned = new WeakSet();
}
