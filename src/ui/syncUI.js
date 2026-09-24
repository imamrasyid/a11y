/**
 * UI sync module.
 * Keeps the panel DOM in sync with the current state.
 * Called after every state change.
 */

import { TTS_RATE } from './panelTemplate.js';

/**
 * Syncs the entire panel UI to the given state.
 * @param {import('../core/state').A11yState} state
 * @param {object} [ttsView]
 * @param {boolean} [ttsView.playing]
 * @param {boolean} [ttsView.paused]
 * @param {SpeechSynthesisVoice[]} [ttsView.voices]
 * @param {string} [ttsView.voiceDefault] - label for the "no explicit voice" option
 * @param {string} [ttsView.status] - text for the reader's live status
 */
export function syncUI(state, ttsView) {
    const panel = document.getElementById('a11yPanel');
    if (!panel) { return; }

    syncOptGroup(panel, 'contrast', state.contrast);
    syncOptGroup(panel, 'cursor', state.cursor);

    syncToggleRow(panel, '[data-a11y-action="font"]', state.font === 'readable');
    syncToggleRow(panel, '[data-a11y-action="spacing"]', state.spacing === 'wide');
    syncToggleRow(panel, '[data-a11y-action="align"]', state.align === 'left');
    syncToggleRow(panel, '[data-a11y-action="animations"]', !state.animations);
    syncTTS(panel, state, ttsView || {});

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

/**
 * Syncs the reader section: switch, transport, rate, voice, status.
 * @param {Element} panel
 * @param {import('../core/state').A11yState} state
 * @param {object} view
 */
function syncTTS(panel, state, view) {
    const on = !!state.tts.enabled;
    const playing = !!view.playing;
    const paused = !!view.paused;

    syncToggleRow(panel, '[data-a11y-action="tts-main"]', on);

    // Transport controls are disabled rather than hidden: hiding them would
    // make the section change height every time reading starts or stops,
    // which is disorienting while the panel is open.
    setDisabled(panel, '[data-a11y-action="tts-play"]', !on);
    setDisabled(panel, '[data-a11y-action="tts-pause"]', !on || !playing);
    setDisabled(panel, '[data-a11y-action="tts-resume"]', !on || !paused);
    setDisabled(panel, '[data-a11y-action="tts-stop"]', !on || !(playing || paused));

    const range = panel.querySelector('#a11yTtsRate');
    if (range) {
        range.disabled = !on;
        const bounded = Math.min(TTS_RATE.max, Math.max(TTS_RATE.min, state.tts.rate));
        range.value = String(bounded);
    }
    const readout = panel.querySelector('#a11yTtsRateValue');
    if (readout) { readout.textContent = formatRate(state.tts.rate); }

    const select = panel.querySelector('#a11yTtsVoice');
    if (select) {
        select.disabled = !on;
        syncVoiceOptions(select, view.voices || [], state.tts.voice, view.voiceDefault);
    }

    const status = panel.querySelector('#a11yTtsStatus');
    if (status) { status.textContent = view.status || ''; }
}

/**
 * @param {Element} panel
 * @param {string} selector
 * @param {boolean} disabled
 */
function setDisabled(panel, selector, disabled) {
    const btn = panel.querySelector(selector);
    if (btn) { btn.disabled = disabled; }
}

/**
 * Rebuilds the voice list only when the browser's list actually changed —
 * re-rendering on every state change would drop the visitor's selection and
 * their keyboard focus.
 * @param {Element} select
 * @param {SpeechSynthesisVoice[]} voices
 * @param {SpeechSynthesisVoice|null} current
 * @param {string} [defaultLabel]
 */
function syncVoiceOptions(select, voices, current, defaultLabel) {
    // +1 for the leading "device default" option.
    if (select.options.length !== voices.length + 1) {
        const fallbackLabel = defaultLabel
            || (select.options[0] ? select.options[0].textContent : 'Default');
        select.textContent = '';
        select.appendChild(buildOption('', fallbackLabel));
        voices.forEach(function (voice, index) {
            select.appendChild(buildOption(String(index), voice.name + ' (' + voice.lang + ')'));
        });
    }

    let wanted = '';
    if (current) {
        const index = voices.findIndex(function (voice) {
            return voice === current || voice.name === current.name;
        });
        // An unlisted voice means "whatever the engine was handed directly";
        // leaving the select on the device default is the honest rendering.
        if (index >= 0) { wanted = String(index); }
    }
    if (select.querySelector('option[value="' + wanted + '"]')) { select.value = wanted; }
}

/**
 * @param {string} value
 * @param {string} label
 * @returns {HTMLOptionElement}
 */
function buildOption(value, label) {
    const opt = document.createElement('option');
    opt.value = value;
    // textContent, not innerHTML: voice names come from the operating system.
    opt.textContent = label;
    return opt;
}

/**
 * @param {number} rate
 * @returns {string} e.g. "1.0×"
 */
function formatRate(rate) {
    return (Math.round(rate * 10) / 10).toFixed(1) + '×';
}
