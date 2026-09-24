/**
 * TTS permission module.
 * Handles the browser autoplay policy for Speech Synthesis.
 *
 * Strategy:
 *   - Desktop: attempt a silent test utterance; show prompt only on 'not-allowed'
 *   - Mobile/Safari: show permission prompt before any speech attempt
 *   - Once granted, store in sessionStorage so the prompt doesn't repeat
 */

const PERMISSION_KEY = 'a11y_tts_allowed';

/** @type {HTMLElement|null} */
let promptEl = null;
/** @type {function|null} */
let pendingSpeak = null;
/** @type {function|null} */
let onDenyCallback = null;
/** @type {object|null} */
let pendingOptions = null;

/**
 * Session storage can be unavailable (private mode, blocked cookies, quota
 * errors). This flag keeps a granted permission working for the current page
 * view even when the write below silently failed.
 */
let grantedInMemory = false;

/** Guards against stacking probes when speech is requested twice in a row. */
let probeInFlight = false;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns true if TTS permission has been granted this session.
 * @returns {boolean}
 */
export function isPermissionGranted() {
    if (grantedInMemory) { return true; }
    try {
        return sessionStorage.getItem(PERMISSION_KEY) === '1';
    } catch (_) {
        return false;
    }
}

/**
 * Grants permission programmatically (e.g. after a user gesture).
 */
export function grantPermission() {
    grantedInMemory = true;
    try { sessionStorage.setItem(PERMISSION_KEY, '1'); } catch (_) { /* noop */ }
}

/**
 * Revokes the stored permission.
 */
export function revokePermission() {
    grantedInMemory = false;
    try { sessionStorage.removeItem(PERMISSION_KEY); } catch (_) { /* noop */ }
}

/**
 * Wraps a speak function with permission awareness.
 * Calls speakFn immediately if permission is already granted,
 * otherwise handles the permission flow first.
 *
 * When a request arrives while the flow is still running it replaces the
 * queued action instead of starting a second probe: the newest request is the
 * one the visitor still wants heard.
 *
 * @param {function} speakFn - The function to call once permission is granted.
 * @param {object} options
 * @param {string} options.hostname - Shown in the permission prompt.
 * @param {string} options.permissionTitle - Prompt title text.
 * @param {string} options.permissionBody - Prompt body text.
 * @param {string} options.allowLabel - Allow button label.
 * @param {string} options.denyLabel - Deny button label.
 * @param {string} options.dialogLabel - aria-label for the dialog.
 * @param {function} [options.onDeny] - Called when user denies permission.
 */
export function requestPermissionAndSpeak(speakFn, options) {
    if (!('speechSynthesis' in window)) { return; }

    if (isPermissionGranted()) {
        speakFn();
        return;
    }

    pendingSpeak = speakFn;
    pendingOptions = options;
    onDenyCallback = options.onDeny || null;

    if (probeInFlight) { return; }

    if (isMobileOrSafari()) {
        buildPrompt(options);
        return;
    }

    // Desktop: try a silent utterance to probe permission
    probeInFlight = true;
    try {
        const testUtt = new SpeechSynthesisUtterance(' ');
        testUtt.volume = 0;
        testUtt.rate = 10;

        testUtt.onend = function () {
            probeInFlight = false;
            grantPermission();
            flushPending();
        };

        testUtt.onerror = function (e) {
            probeInFlight = false;
            if (e.error === 'not-allowed') {
                buildPrompt(pendingOptions || options);
            } else {
                // Other errors (e.g. 'interrupted') — treat as granted
                grantPermission();
                flushPending();
            }
        };

        window.speechSynthesis.speak(testUtt);
    } catch (_) {
        probeInFlight = false;
        buildPrompt(options);
    }
}

/**
 * Removes the permission prompt from the DOM.
 */
export function removePrompt() {
    if (!promptEl) { return; }
    promptEl.classList.remove('a11y-tts-prompt--visible');
    const el = promptEl;
    setTimeout(function () {
        if (el && el.parentNode) { el.parentNode.removeChild(el); }
    }, 320);
    promptEl = null;
}

/**
 * Drops the queued speech request and the deny callback. Called when the host
 * tears the widget down, so a prompt that outlives the widget cannot speak or
 * flip settings through a stale closure.
 */
export function resetPermissionFlow() {
    pendingSpeak = null;
    pendingOptions = null;
    onDenyCallback = null;
    probeInFlight = false;
}

// ─── Internal ────────────────────────────────────────────────────────────────

function isMobileOrSafari() {
    const ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod|Android/i.test(ua) ||
        (/Safari/i.test(ua) && !/Chrome/i.test(ua));
}

function buildPrompt(options) {
    if (promptEl) { return; }

    const el = document.createElement('div');
    el.className = 'a11y-tts-prompt';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', options.dialogLabel || 'Text reader permission');

    const allowId = 'a11yTtsPromptAllow_' + Date.now();
    const denyId = 'a11yTtsPromptDeny_' + Date.now();

    el.innerHTML =
        '<div class="a11y-tts-prompt__text">' +
        '<strong>' + escapeHtml(options.permissionTitle || 'Text Reader') + '</strong> ' +
        escapeHtml(options.hostname || window.location.hostname) + ' ' +
        escapeHtml(options.permissionBody || 'wants to enable the text reader.') +
        '</div>' +
        '<div class="a11y-tts-prompt__actions">' +
        '<button class="a11y-tts-prompt__btn a11y-tts-prompt__btn--deny" id="' + denyId + '">' +
        escapeHtml(options.denyLabel || 'Deny') +
        '</button>' +
        '<button class="a11y-tts-prompt__btn a11y-tts-prompt__btn--allow" id="' + allowId + '">' +
        escapeHtml(options.allowLabel || 'Allow') +
        '</button>' +
        '</div>';

    document.body.appendChild(el);
    promptEl = el;

    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            el.classList.add('a11y-tts-prompt--visible');
            const allowBtn = document.getElementById(allowId);
            if (allowBtn) { allowBtn.focus(); }
        });
    });

    const allowBtn = document.getElementById(allowId);
    const denyBtn = document.getElementById(denyId);

    if (allowBtn) {
        allowBtn.addEventListener('click', function () {
            removePrompt();
            grantPermission();
            flushPending();
        });
    }

    if (denyBtn) {
        denyBtn.addEventListener('click', function () {
            removePrompt();
            pendingSpeak = null;
            pendingOptions = null;
            const deny = onDenyCallback;
            onDenyCallback = null;
            if (deny) { deny(); }
        });
    }
}

function flushPending() {
    if (pendingSpeak) {
        const fn = pendingSpeak;
        pendingSpeak = null;
        pendingOptions = null;
        fn();
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
