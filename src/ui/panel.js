/**
 * Panel UI module.
 * Handles mounting, unmounting, opening, closing, and event binding
 * for the accessibility panel and FAB button.
 */

import { buildPanelHTML } from './panelTemplate.js';

/** @type {HTMLElement|null} */
let fabEl = null;
/** @type {HTMLElement|null} */
let panelEl = null;

/** @type {function|null} */
let outsideClickHandler = null;
/** @type {function|null} */
let escapeKeyHandler = null;

// ─── Mount / Unmount ─────────────────────────────────────────────────────────

/**
 * Mounts the FAB button and panel into the container.
 * @param {object} options
 * @param {Element} options.container
 * @param {string}  options.position - 'bottom-right'|'bottom-left'|'top-right'|'top-left'
 * @param {object}  options.strings
 * @param {object}  options.modules
 * @param {object}  [options.features]   Capability flags for the template
 * @param {function} options.onAction - (actionType: string, data: any) => void
 */
export function mountPanel(options) {
    if (panelEl) { return; }

    const container = options.container || document.body;
    const strings = options.strings || {};
    const position = options.position || 'bottom-right';

    // FAB
    fabEl = document.createElement('button');
    fabEl.id = 'a11yFab';
    fabEl.className = 'a11y-fab a11y-fab--' + position;
    fabEl.setAttribute('aria-label', strings.panelOpen || 'Open accessibility panel');
    fabEl.setAttribute('aria-expanded', 'false');
    fabEl.setAttribute('aria-controls', 'a11yPanel');
    fabEl.innerHTML =
        '<svg class="a11y-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">' +
        '<path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1 5h2v6h-2V7zm-4.5 1.5 1.4 1.4A7 7 0 0 0 12 19a7 7 0 0 0 4.1-1.1l1.4-1.4 1.4 1.4A9 9 0 0 1 12 21a9 9 0 0 1-6.9-3.1l1.4-1.4z"/>' +
        '</svg>';
    container.appendChild(fabEl);

    // Panel
    panelEl = document.createElement('div');
    panelEl.id = 'a11yPanel';
    panelEl.className = 'a11y-panel a11y-panel--' + position;
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'false');
    panelEl.setAttribute('aria-label', strings.panelTitle || 'Accessibility');
    panelEl.setAttribute('aria-hidden', 'true');
    panelEl.innerHTML = buildPanelHTML(strings, options.modules, options.features);
    container.appendChild(panelEl);

    bindPanelEvents(options.onAction);
}

/**
 * Removes the panel and FAB from the DOM and cleans up all listeners.
 */
export function unmountPanel() {
    if (outsideClickHandler) {
        document.removeEventListener('click', outsideClickHandler);
        outsideClickHandler = null;
    }
    if (escapeKeyHandler) {
        document.removeEventListener('keydown', escapeKeyHandler);
        escapeKeyHandler = null;
    }
    if (fabEl && fabEl.parentNode) { fabEl.parentNode.removeChild(fabEl); }
    if (panelEl && panelEl.parentNode) { panelEl.parentNode.removeChild(panelEl); }
    fabEl = null;
    panelEl = null;
}

// ─── Open / Close ────────────────────────────────────────────────────────────

export function openPanel() {
    if (!panelEl || !fabEl) { return; }
    panelEl.classList.add('a11y-panel--open');
    panelEl.setAttribute('aria-hidden', 'false');
    fabEl.setAttribute('aria-expanded', 'true');

    setTimeout(function () {
        if (!panelEl) { return; }
        const first = panelEl.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])');
        if (first) { first.focus(); }
    }, 50);
}

export function closePanel() {
    if (!panelEl || !fabEl) { return; }
    panelEl.classList.remove('a11y-panel--open');
    panelEl.setAttribute('aria-hidden', 'true');
    fabEl.setAttribute('aria-expanded', 'false');
}

export function togglePanel() {
    if (!panelEl) { return; }
    if (panelEl.classList.contains('a11y-panel--open')) {
        closePanel();
    } else {
        openPanel();
    }
}

/** @returns {boolean} */
export function isPanelOpen() {
    return !!(panelEl && panelEl.classList.contains('a11y-panel--open'));
}

// ─── Event binding ───────────────────────────────────────────────────────────

function bindPanelEvents(onAction) {
    if (!fabEl || !panelEl) { return; }
    const cb = onAction || function () { };

    // FAB toggle
    fabEl.addEventListener('click', function () {
        togglePanel();
        cb(isPanelOpen() ? 'open' : 'close', null);
    });

    // Close button
    panelEl.addEventListener('click', function (e) {
        if (e.target.closest('#a11yClose')) {
            closePanel();
            cb('close', null);
            if (fabEl) { fabEl.focus(); }
        }
    });

    // Reset button
    panelEl.addEventListener('click', function (e) {
        if (e.target.closest('#a11yReset')) { cb('reset', null); }
    });

    // Contrast
    panelEl.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-a11y-action="contrast"]');
        if (btn) { cb('contrast', btn.dataset.a11yValue); }
    });

    // Cursor
    panelEl.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-a11y-action="cursor"]');
        if (btn) { cb('cursor', btn.dataset.a11yValue); }
    });

    // Font / Spacing / Align / Animations — single-action toggles
    ['font', 'spacing', 'align', 'animations'].forEach(function (action) {
        panelEl.addEventListener('click', function (e) {
            if (e.target.closest('[data-a11y-action="' + action + '"]')) {
                cb(action, null);
            }
        });
    });

    // Generic boolean toggles (data-a11y-action="toggle" data-a11y-key="...")
    panelEl.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-a11y-action="toggle"][data-a11y-key]');
        if (btn) { cb('toggle', btn.dataset.a11yKey); }
    });

    // Text size — query inside panelEl, not document (supports custom containers)
    const incBtn = panelEl.querySelector('#a11yTextInc');
    const decBtn = panelEl.querySelector('#a11yTextDec');
    if (incBtn) { incBtn.addEventListener('click', function () { cb('textScale', 'inc'); }); }
    if (decBtn) { decBtn.addEventListener('click', function () { cb('textScale', 'dec'); }); }

    // TTS main toggle
    panelEl.addEventListener('click', function (e) {
        if (e.target.closest('[data-a11y-action="tts-main"]')) { cb('tts-main', null); }
    });

    // TTS transport buttons
    ['tts-play', 'tts-pause', 'tts-resume', 'tts-stop'].forEach(function (action) {
        panelEl.addEventListener('click', function (e) {
            if (e.target.closest('[data-a11y-action="' + action + '"]')) {
                cb(action, null);
            }
        });
    });

    // TTS rate + voice — form controls fire input/change, never click
    const rateInput = panelEl.querySelector('#a11yTtsRate');
    if (rateInput) {
        rateInput.addEventListener('input', function () { cb('tts-rate', rateInput.value); });
    }
    const voiceSelect = panelEl.querySelector('#a11yTtsVoice');
    if (voiceSelect) {
        voiceSelect.addEventListener('change', function () { cb('tts-voice', voiceSelect.value); });
    }

    // Escape key
    escapeKeyHandler = function (e) {
        if (e.key === 'Escape' && isPanelOpen()) {
            closePanel();
            cb('close', null);
            if (fabEl) { fabEl.focus(); }
        }
    };
    document.addEventListener('keydown', escapeKeyHandler);

    // Click outside
    outsideClickHandler = function (e) {
        if (!isPanelOpen()) { return; }
        if (panelEl && !panelEl.contains(e.target) && fabEl && !fabEl.contains(e.target)) {
            closePanel();
            cb('close', null);
        }
    };
    // Use capture:false + setTimeout to avoid closing immediately on the same click that opened
    setTimeout(function () {
        document.addEventListener('click', outsideClickHandler);
    }, 0);
}
