/**
 * Images module.
 * Handles: hide images, show image alt text as visible captions.
 */

const CAPTION_CLASS = 'a11y-img-caption';

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
 * Toggles visible alt text captions below images.
 * Inserts/removes <span class="a11y-img-caption"> after each img[alt].
 * @param {boolean} enable
 */
export function applyImgCaptions(enable) {
    document.querySelectorAll('img[alt]').forEach(function (img) {
        const alt = (img.getAttribute('alt') || '').trim();
        if (!alt) { return; }

        const next = img.nextElementSibling;
        const hasCaption = next && next.classList.contains(CAPTION_CLASS);

        if (enable && !hasCaption) {
            const span = document.createElement('span');
            span.className = CAPTION_CLASS;
            span.setAttribute('aria-hidden', 'true');
            span.textContent = alt;
            img.parentNode.insertBefore(span, img.nextSibling);
        } else if (!enable && hasCaption) {
            next.parentNode.removeChild(next);
        }
    });

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

/**
 * Removes all injected captions (used on destroy).
 */
export function destroyImages() {
    resetImages();
    document.querySelectorAll('.' + CAPTION_CLASS).forEach(function (el) {
        if (el.parentNode) { el.parentNode.removeChild(el); }
    });
}
