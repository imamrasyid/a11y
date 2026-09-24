/**
 * Opt-in "read what I select" behaviour.
 *
 * Deliberately not the default: a screen reader already speaks selections, and
 * this listener would talk over it. Hosts enable it with
 * `defaults: { tts: { autoSpeak: 'selection' } }`.
 */

/** Selection must be long enough to be intentional, not a stray double-click. */
const MIN_SELECTION_LENGTH = 3;

/** Browsers need a tick before the selection settles after mouseup/touchend. */
const SELECTION_SETTLE_MS = 50;

/** @type {function|null} */
let listener = null;
/** @type {function|null} */
let speakText = null;
/** @type {number} */
let settleTimer = 0;

/**
 * Binds (or rebinds) the selection listeners.
 * @param {'none'|'selection'} mode
 * @param {(text: string) => void} onSpeak
 */
export function applyAutoSpeak(mode, onSpeak) {
    if (mode !== 'selection' || !onSpeak) {
        disableAutoSpeak();
        return;
    }
    if (listener) { return; }

    speakText = onSpeak;
    listener = handleSelection;
    document.addEventListener('mouseup', listener);
    document.addEventListener('touchend', listener);
}

/**
 * Removes the selection listeners and any queued read.
 */
export function disableAutoSpeak() {
    clearTimeout(settleTimer);
    if (!listener) { return; }
    document.removeEventListener('mouseup', listener);
    document.removeEventListener('touchend', listener);
    listener = null;
    speakText = null;
}

/** @returns {boolean} whether the selection listener is currently bound */
export function isAutoSpeakActive() {
    return !!listener;
}

// ─── Internal ────────────────────────────────────────────────────────────────

function handleSelection() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
        const text = getSelectedTextOutsideWidget();
        if (text) { speakText(text); }
    }, SELECTION_SETTLE_MS);
}

/**
 * @returns {string} the selected text, or '' when the selection is too short
 *                   to matter or sits inside the widget's own UI.
 */
function getSelectedTextOutsideWidget() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { return ''; }

    const anchor = sel.anchorNode;
    const anchorEl = anchor
        ? (anchor.nodeType === Node.ELEMENT_NODE ? anchor : anchor.parentElement)
        : null;
    // Reading the panel's own labels back to the visitor is never useful.
    if (anchorEl && (anchorEl.closest('#a11yPanel') || anchorEl.closest('.a11y-skip-link'))) {
        return '';
    }

    const text = String(sel.toString() || '').trim();
    return text.length >= MIN_SELECTION_LENGTH ? text : '';
}
