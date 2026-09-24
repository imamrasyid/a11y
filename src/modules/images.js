/**
 * Images module.
 *
 * Both settings are attribute toggles; the visible alt caption is drawn by a
 * CSS pseudo-element (_modifiers.scss). Nothing is inserted into the host's
 * DOM, so images that appear after init — ajax, SPA routes, a gallery opening
 * — are captioned without a MutationObserver, and a screen reader never hears
 * the caption twice.
 */

// ─── Hide Images ─────────────────────────────────────────────────────────────

/**
 * Toggles image visibility.
 * @param {boolean} enable
 */
export function applyHideImages(enable) {
    const html = document.documentElement;
    if (enable) {
        html.setAttribute('data-a11y-hide-images', 'on');
    } else {
        html.removeAttribute('data-a11y-hide-images');
    }
}

// ─── Alt Text Captions ───────────────────────────────────────────────────────

/**
 * Toggles visible alt text below images.
 * @param {boolean} enable
 */
export function applyImgCaptions(enable) {
    const html = document.documentElement;
    if (enable) {
        html.setAttribute('data-a11y-img-titles', 'on');
    } else {
        html.removeAttribute('data-a11y-img-titles');
    }
}

// ─── Reset ───────────────────────────────────────────────────────────────────

/**
 * Resets all image-related settings.
 */
export function resetImages() {
    applyHideImages(false);
    applyImgCaptions(false);
}
