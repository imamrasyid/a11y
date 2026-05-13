/**
 * UI sync module.
 * Keeps the panel DOM in sync with the current state.
 * Called after every state change.
 */

/**
 * Syncs the entire panel UI to the given state.
 * @param {import('../core/state').A11yState} state
 */
export function syncUI(state) {
    const panel = document.getElementById('a11yPanel');
    if (!panel) { return; }

    syncOptGroup(panel, 'contrast', state.contrast);
    syncOptGroup(panel, 'cursor', state.cursor);

    syncToggleRow(panel, '[data-a11y-action="font"]', state.font === 'readable');
    syncToggleRow(panel, '[data-a11y-action="spacing"]', state.spacing === 'wide');
    syncToggleRow(panel, '[data-a11y-action="align"]', state.align === 'left');
    syncToggleRow(panel, '[data-a11y-action="animations"]', !state.animations);
    syncToggleRow(panel, '[data-a11y-action="tts-main"]', state.tts.enabled);

    const boolKeys = [
        'underlineLinks', 'underlineHeaders', 'imgTitles',
        'highlightFocus', 'hideImages', 'readingGuide', 'keyboard',
    ];
    boolKeys.forEach(function (key) {
        const btn = panel.querySelector('[data-a11y-key="' + key + '"]');
        if (btn) { setToggleState(btn, state[key]); }
    });

    const disp = document.getElementById('a11yTextDisplay');
    if (disp) { disp.textContent = state.textScale + '%'; }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Syncs a group of option buttons (contrast, cursor).
 * @param {Element} panel
 * @param {string} action
 * @param {string} activeValue
 */
function syncOptGroup(panel, action, activeValue) {
    panel.querySelectorAll('[data-a11y-action="' + action + '"]').forEach(function (btn) {
        const active = btn.dataset.a11yValue === activeValue;
        btn.classList.toggle('a11y-opt--active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
}

/**
 * Syncs a single toggle row by selector.
 * @param {Element} panel
 * @param {string} selector
 * @param {boolean} active
 */
function syncToggleRow(panel, selector, active) {
    const btn = panel.querySelector(selector);
    if (btn) { setToggleState(btn, active); }
}

/**
 * Sets the visual and ARIA state of a toggle row button.
 * @param {Element} btn
 * @param {boolean} active
 */
function setToggleState(btn, active) {
    btn.classList.toggle('a11y-toggle-row--active', active);
    btn.setAttribute('aria-pressed', String(active));
}
