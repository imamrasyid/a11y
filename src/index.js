/**
 * a11y-widget — Modular accessibility widget
 * WCAG 2.1 AA compliant
 *
 * @example
 * // ESM
 * import A11yWidget from '@a11y-widget/core';
 * A11yWidget.init({ lang: 'id' });
 *
 * @example
 * // Script tag (UMD)
 * <script src="a11y-widget.umd.min.js"></script>
 * <script>A11yWidget.init({ lang: 'id' });</script>
 */

// Core
import { createEventBus } from './core/eventBus.js';
import { createLocalStorageAdapter, isValidAdapter } from './core/storage.js';
import {
    createDefaultState, mergeState, resetModuleState,
    saveState, loadState, DEFAULTS,
} from './core/state.js';
import { mountAnnouncer, announce, unmountAnnouncer } from './core/announcer.js';

// i18n
import { initI18n, getStrings, t, getAvailableLocales } from './i18n/index.js';

// Modules
import { applyContrast, resetContrast } from './modules/contrast.js';
import {
    applyTextScale, resetTextScale,
    clampScale, getScaleBounds, destroyTextScale,
} from './modules/textScale.js';
import { applyFont, resetFont } from './modules/font.js';
import { applySpacing, resetSpacing } from './modules/spacing.js';
import { applyAlign, resetAlign, destroyAlign } from './modules/align.js';
import {
    applyUnderlineLinks, applyUnderlineHeaders,
    applyHighlightFocus, applyKeyboardNav,
    resetHighlights, destroyHighlights,
} from './modules/highlights.js';
import {
    applyHideImages, applyImgCaptions,
    resetImages, destroyImages,
} from './modules/images.js';
import {
    applyAnimations, resetAnimations,
    setUserExplicit, destroyAnimations,
} from './modules/animations.js';
import { applyCursor, resetCursor } from './modules/cursor.js';
import {
    applyReadingGuide, resetReadingGuide, destroyReadingGuide,
} from './modules/readingGuide.js';

// TTS
import {
    speak as ttsSpeak, speakChunks as ttsSpeakChunks,
    pause as ttsPause, resume as ttsResume, cancel as ttsCancel,
    isPlaying as ttsIsPlaying, isPaused as ttsIsPaused,
    isSupported as ttsIsSupported, setRate as ttsSetRate,
    setVoice as ttsSetVoice, getPageContent,
} from './modules/tts/tts.js';
import { loadVoices, getVoices, selectVoice } from './modules/tts/ttsVoice.js';
import {
    requestPermissionAndSpeak,
    grantPermission, revokePermission, removePrompt,
} from './modules/tts/ttsPermission.js';
import {
    addReplacements, setReplacements,
    resetReplacements, getReplacements,
} from './modules/tts/ttsReplacements.js';

// UI
import {
    mountPanel, unmountPanel,
    openPanel, closePanel, togglePanel, isPanelOpen,
} from './ui/panel.js';
import { syncUI } from './ui/syncUI.js';
import { mountSkipLink, unmountSkipLink } from './ui/skipLink.js';

// ─── Internal state ──────────────────────────────────────────────────────────

const bus = createEventBus();

/** @type {import('./core/state').A11yState} */
let _state = createDefaultState();

/** @type {import('./core/storage').StorageAdapter} */
let _storage = createLocalStorageAdapter();

/** @type {string} */
let _storageKey = 'a11y_widget';

/** @type {boolean} */
let _initialized = false;

/** @type {object} */
let _options = {};

/** @type {string} — resolved active language code */
let _lang = 'id';

const TTS_WELCOME_KEY = 'a11y_tts_welcomed';

// ─── Init ────────────────────────────────────────────────────────────────────

/**
 * Initializes the widget. Must be called before any other method.
 *
 * @param {object}  [options]
 * @param {string}  [options.storageKey='a11y_widget']
 * @param {object}  [options.storage]           Custom storage adapter
 * @param {Element} [options.container]         Mount target (default: document.body)
 * @param {string}  [options.position='bottom-right']
 * @param {string|object} [options.lang='id']   Locale code or custom strings object
 * @param {string}  [options.baseLang='id']     Base locale for partial overrides
 * @param {object}  [options.modules]           Per-module enable/disable flags
 * @param {object}  [options.defaults]          Override default state values
 * @param {boolean} [options.skipLink=true]
 * @param {boolean} [options.welcomeMessage=false]
 * @param {string}  [options.welcomeText]       Custom welcome message text
 * @param {function} [options.onStateChange]    Shorthand state-change callback
 */
function init(options) {
    if (_initialized) {
        if (typeof console !== 'undefined') {
            console.warn('[a11y-widget] Already initialized. Call destroy() first.');
        }
        return;
    }

    _options = options || {};

    // ── Storage ────────────────────────────────────────────────────────────────
    if (_options.storage && isValidAdapter(_options.storage)) {
        _storage = _options.storage;
    }
    if (_options.storageKey) {
        _storageKey = _options.storageKey;
    }

    // ── Language ───────────────────────────────────────────────────────────────
    // Resolve _lang from options. If lang is an object (custom strings), use baseLang.
    _lang = (typeof _options.lang === 'string') ? _options.lang : (_options.baseLang || 'id');
    initI18n(_options.lang || 'id', _options.baseLang);

    // ── State ──────────────────────────────────────────────────────────────────
    _state = loadState(_storage, _storageKey);
    if (_options.defaults) {
        _state = mergeState(_state, _options.defaults);
    }

    // Restore animations explicit flag from persisted state
    if (_state.animations !== DEFAULTS.animations) {
        setUserExplicit(true);
    }

    // ── Shorthand callback ─────────────────────────────────────────────────────
    if (typeof _options.onStateChange === 'function') {
        bus.on('stateChange', _options.onStateChange);
    }

    // ── DOM ────────────────────────────────────────────────────────────────────
    const strings = getStrings();
    mountAnnouncer();

    if (_options.skipLink !== false) {
        mountSkipLink(strings.skipLink);
    }

    mountPanel({
        container: _options.container || document.body,
        position: _options.position || 'bottom-right',
        strings,
        modules: _options.modules || {},
        onAction: handlePanelAction,
    });

    // Load TTS voices early so they're ready when needed
    if ((_options.modules || {}).tts !== false && ttsIsSupported()) {
        loadVoices();
    }

    // Apply persisted state to DOM
    applyAllModules(_state);
    syncUI(_state);

    _initialized = true;
    bus.emit('init', getState());

    if (_options.welcomeMessage && ttsIsSupported()) {
        _scheduleWelcomeMessage();
    }
}

// ─── Destroy ─────────────────────────────────────────────────────────────────

/**
 * Completely removes the widget from the DOM and cleans up all side effects.
 * Safe to call even if not initialized.
 */
function destroy() {
    if (!_initialized) { return; }

    ttsCancel();
    removePrompt();

    unmountPanel();
    unmountSkipLink();
    unmountAnnouncer();

    // Reset DOM modifications
    resetContrast();
    resetTextScale();
    resetFont();
    resetSpacing();
    resetAlign();
    resetHighlights();
    resetImages();
    resetAnimations();
    resetCursor();
    resetReadingGuide();

    // Remove injected style elements
    destroyTextScale();
    destroyAlign();
    destroyHighlights();
    destroyImages();
    destroyAnimations();
    destroyReadingGuide();

    bus.emit('destroy');
    bus.clear();

    // Full reset of internal state so re-init works cleanly
    _state = createDefaultState();
    _storage = createLocalStorageAdapter();
    _storageKey = 'a11y_widget';
    _lang = 'id';
    _options = {};
    _initialized = false;
}

// ─── Panel control ───────────────────────────────────────────────────────────

/** Opens the accessibility panel. */
function open() {
    openPanel();
    bus.emit('open');
}

/** Closes the accessibility panel. */
function close() {
    closePanel();
    bus.emit('close');
}

/** Toggles the accessibility panel. */
function toggle() {
    togglePanel();
    bus.emit(isPanelOpen() ? 'open' : 'close');
}

/** @returns {boolean} */
function isOpen() {
    return isPanelOpen();
}

// ─── State API ───────────────────────────────────────────────────────────────

/**
 * Returns a read-only snapshot of the current state.
 * @returns {import('./core/state').A11yState}
 */
function getState() {
    return Object.assign({}, _state, { tts: Object.assign({}, _state.tts) });
}

/**
 * Merges a partial state object and applies changes.
 * @param {Partial<import('./core/state').A11yState>} partial
 */
function setState(partial) {
    _state = mergeState(_state, partial);
    applyAllModules(_state);
    syncUI(_state);
    saveState(_state, _storage, _storageKey);
    bus.emit('stateChange', getState());
}

/**
 * Resets all settings to defaults.
 */
function reset() {
    ttsCancel();
    removePrompt();
    setUserExplicit(false);

    _state = createDefaultState(_options.defaults || {});
    applyAllModules(_state);
    syncUI(_state);
    saveState(_state, _storage, _storageKey);

    announce(t('announceReset'));
    bus.emit('reset', getState());
    bus.emit('stateChange', getState());
}

/**
 * Resets a single module key back to its default value.
 * @param {keyof import('./core/state').A11yState} key
 */
function resetModule(key) {
    _state = resetModuleState(_state, key);
    applyAllModules(_state);
    syncUI(_state);
    saveState(_state, _storage, _storageKey);
    bus.emit('stateChange', getState());
}

// ─── Events ──────────────────────────────────────────────────────────────────

/**
 * @param {string} event
 * @param {function} handler
 */
function on(event, handler) {
    bus.on(event, handler);
}

/**
 * @param {string} event
 * @param {function} handler
 */
function off(event, handler) {
    bus.off(event, handler);
}

// ─── TTS public API ──────────────────────────────────────────────────────────

const tts = {
    /**
     * Speaks a text string.
     * @param {string} text
     * @param {object} [options]
     */
    speak(text, options) {
        if (!_state.tts.enabled) { return; }
        const opts = Object.assign({ rate: _state.tts.rate, lang: _lang }, options);
        const voice = opts.voice || selectVoice(_lang);
        _withPermission(function () {
            ttsSpeak(text, Object.assign(opts, { voice }));
        });
    },

    /** Speaks the full page content with element highlighting. */
    speakPage() {
        if (!_state.tts.enabled) { return; }
        const content = getPageContent();
        if (!content.length) { return; }
        const voice = selectVoice(_lang);
        _withPermission(function () {
            ttsSpeakChunks(content, {
                rate: _state.tts.rate,
                lang: _lang,
                voice,
                onStart() { bus.emit('tts:start'); },
                onEnd() { bus.emit('tts:end'); },
            });
        });
    },

    pause() { ttsPause(); bus.emit('tts:pause'); },
    resume() { ttsResume(); bus.emit('tts:resume'); },
    cancel() { ttsCancel(); bus.emit('tts:cancel'); },

    isPlaying: ttsIsPlaying,
    isPaused: ttsIsPaused,
    isSupported: ttsIsSupported,
    getVoices,

    setRate(rate) {
        ttsSetRate(rate);
        _state = mergeState(_state, { tts: { rate } });
        saveState(_state, _storage, _storageKey);
    },

    setVoice(voice) {
        ttsSetVoice(voice);
        _state = mergeState(_state, { tts: { voice } });
        saveState(_state, _storage, _storageKey);
    },

    grantPermission,
    revokePermission,
    addReplacements,
    setReplacements,
    resetReplacements,
    getReplacements,
};

// ─── Panel action handler ────────────────────────────────────────────────────

/**
 * Handles all actions dispatched from the panel UI.
 * @param {string} action
 * @param {any}    data
 */
function handlePanelAction(action, data) {
    const s = _state;
    const bounds = getScaleBounds();

    switch (action) {
        case 'contrast':
            setState({ contrast: data });
            announce(t('announceContrast') + ': ' + data);
            break;

        case 'cursor':
            setState({ cursor: data });
            announce(t('announceCursor') + ': ' + data);
            break;

        case 'font':
            setState({ font: s.font === 'readable' ? 'default' : 'readable' });
            announce(s.font === 'readable' ? t('announceFontDefault') : t('announceFontReadable'));
            break;

        case 'spacing':
            setState({ spacing: s.spacing === 'wide' ? 'normal' : 'wide' });
            announce(s.spacing === 'wide' ? t('announceSpacingNormal') : t('announceSpacingWide'));
            break;

        case 'align':
            setState({ align: s.align === 'left' ? 'default' : 'left' });
            announce(s.align === 'left' ? t('announceAlignDefault') : t('announceAlignLeft'));
            break;

        case 'animations':
            setUserExplicit(true);
            setState({ animations: !s.animations });
            announce(s.animations ? t('announceAnimationsOff') : t('announceAnimationsOn'));
            break;

        case 'toggle': {
            const key = data;
            if (key in s) {
                setState({ [key]: !s[key] });
                const label = s[key] ? t('announceInactive') : t('announceActive');
                announce(key + ': ' + label);
            }
            break;
        }

        case 'textScale': {
            const next = data === 'inc'
                ? clampScale(s.textScale + bounds.step)
                : clampScale(s.textScale - bounds.step);
            setState({ textScale: next });
            announce(t('announceTextSize') + ': ' + next + '%');
            break;
        }

        case 'tts-main':
            setState({ tts: { enabled: !s.tts.enabled } });
            if (!_state.tts.enabled) { ttsCancel(); }
            break;

        case 'reset':
            reset();
            break;

        case 'open':
            bus.emit('open');
            break;

        case 'close':
            bus.emit('close');
            break;

        default:
            break;
    }
}

// ─── Apply all modules ───────────────────────────────────────────────────────

/**
 * Applies the full state to all DOM modules.
 * Respects per-module enable/disable flags from options.
 * @param {import('./core/state').A11yState} s
 */
function applyAllModules(s) {
    const mods = _options.modules || {};

    if (mods.contrast !== false) { applyContrast(s.contrast); }
    if (mods.textScale !== false) { applyTextScale(s.textScale); }
    if (mods.font !== false) { applyFont(s.font); }
    if (mods.spacing !== false) { applySpacing(s.spacing); }
    if (mods.align !== false) { applyAlign(s.align); }
    if (mods.underlineLinks !== false) { applyUnderlineLinks(s.underlineLinks); }
    if (mods.underlineHeaders !== false) { applyUnderlineHeaders(s.underlineHeaders); }
    if (mods.imgTitles !== false) { applyImgCaptions(s.imgTitles); }
    if (mods.highlightFocus !== false) { applyHighlightFocus(s.highlightFocus); }
    if (mods.hideImages !== false) { applyHideImages(s.hideImages); }
    if (mods.animations !== false) { applyAnimations(s.animations); }
    if (mods.cursor !== false) { applyCursor(s.cursor); }
    if (mods.readingGuide !== false) { applyReadingGuide(s.readingGuide); }
    if (mods.keyboard !== false) { applyKeyboardNav(s.keyboard); }
}

// ─── TTS helpers ─────────────────────────────────────────────────────────────

function _withPermission(speakFn) {
    const strings = getStrings();
    requestPermissionAndSpeak(speakFn, {
        hostname: window.location.hostname,
        permissionTitle: strings.ttsPermissionTitle,
        permissionBody: strings.ttsPermissionBody,
        allowLabel: strings.ttsPermissionAllow,
        denyLabel: strings.ttsPermissionDeny,
        dialogLabel: strings.ttsPermissionLabel,
        onDeny() {
            setState({ tts: { enabled: false } });
        },
    });
}

function _scheduleWelcomeMessage() {
    if (!ttsIsSupported()) { return; }
    try {
        if (sessionStorage.getItem(TTS_WELCOME_KEY)) { return; }
    } catch (_) { /* noop */ }

    function doSpeak() {
        if (!_state.tts.enabled) { return; }
        const text = _options.welcomeText || t('ttsEnable');
        const voice = selectVoice(_lang);
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = _lang === 'en' ? 'en-US' : 'id-ID';
        utt.rate = _state.tts.rate || 1.0;
        if (voice) { utt.voice = voice; }

        utt.onend = function () {
            try { sessionStorage.setItem(TTS_WELCOME_KEY, '1'); } catch (_) { /* noop */ }
            grantPermission();
        };
        utt.onerror = function (e) {
            if (e.error === 'not-allowed') { _withPermission(doSpeak); }
        };
        window.speechSynthesis.speak(utt);
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
        setTimeout(doSpeak, 1000);
    } else {
        window.speechSynthesis.addEventListener('voiceschanged', function onReady() {
            window.speechSynthesis.removeEventListener('voiceschanged', onReady);
            setTimeout(doSpeak, 1000);
        });
    }
}

// ─── Public API ──────────────────────────────────────────────────────────────

const A11yWidget = {
    // Lifecycle
    init,
    destroy,

    // Panel
    open,
    close,
    toggle,
    isOpen,

    // State
    getState,
    setState,
    reset,
    resetModule,

    // Events
    on,
    off,

    // TTS namespace
    tts,

    // i18n utilities
    getAvailableLocales,

    // Constants
    DEFAULTS,
};

export default A11yWidget;
