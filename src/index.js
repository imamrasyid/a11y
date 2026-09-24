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
    saveState, loadStoredPatch, migrateState, DEFAULTS,
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
    applyAnimations, resetAnimations, destroyAnimations,
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
import { loadVoices, getVoices, selectVoice, getLangCode } from './modules/tts/ttsVoice.js';
import { applyAutoSpeak, disableAutoSpeak } from './modules/tts/ttsAutoSpeak.js';
import {
    requestPermissionAndSpeak,
    grantPermission, revokePermission, removePrompt, resetPermissionFlow,
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

/** Subscriptions the widget made for itself; removed on destroy. Host
 *  listeners registered through on()/off() are never touched. */
let _internalSubs = [];

/** Reader status line shown in the panel. Deliberately kept out of the
 *  persisted state: it describes what is happening right now, not a setting. */
let _ttsStatus = '';

const TTS_WELCOME_KEY = 'a11y_tts_welcomed';

function _subscribe(event, handler) {
    bus.on(event, handler);
    _internalSubs.push({ event: event, handler: handler });
}

function _unsubscribeInternal() {
    _internalSubs.forEach(function (sub) { bus.off(sub.event, sub.handler); });
    _internalSubs = [];
}

/**
 * Snapshot of everything the reader section shows that the state object
 * doesn't hold: live playback status, the browser's voice list, status text.
 * @returns {object}
 */
function _ttsView() {
    return {
        playing: ttsIsPlaying(),
        paused: ttsIsPaused(),
        voices: getVoices(),
        voiceDefault: t('ttsVoiceDefault'),
        status: _ttsStatus,
    };
}

/**
 * Writes the reader's status line, which is a live region — so this is also
 * how a screen reader hears "started", "paused" or "stopped".
 * @param {string} stringKey - i18n key, or '' to clear
 */
function _setTtsStatus(stringKey) {
    _ttsStatus = stringKey ? t(stringKey) : '';
    syncUI(_state, _ttsView());
}

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
 * @param {string}  [options.fallbackLang]      Locale to use when `lang` is unknown
 * @param {string[]} [options.contentSelectors] Containers "read page" may read
 * @param {string[]} [options.excludeSelectors] Subtrees "read page" must skip
 * @param {object}  [options.modules]           Per-module enable/disable flags
 * @param {object}  [options.defaults]          Values used when the visitor has no stored choice
 * @param {string[]} [options.migrateFrom]      Legacy storage keys to move onto storageKey
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
    // Speech and panel text resolve separately: a code with no locale pack
    // ('jv') still selects a Javanese voice, while the UI falls back to a
    // language it can actually render — and initI18n says so on the console.
    const uiLang = initI18n(
        _options.lang || 'id',
        _options.baseLang || _options.fallbackLang,
    );
    _lang = (typeof _options.lang === 'string') ? _options.lang : uiLang;

    // ── State ──────────────────────────────────────────────────────────────────
    // Preferences written by an older build land on the current key first, so
    // the read below is the only path that has to know about storage at all.
    migrateState(_storage, _storageKey, _options.migrateFrom || []);

    // Host defaults sit *under* the visitor's own choices: a stored preference
    // must survive a reload, and a deploy that changes `defaults` must not
    // silently overwrite what the visitor picked.
    _state = mergeState(
        createDefaultState(_options.defaults),
        loadStoredPatch(_storage, _storageKey) || {},
    );

    // ── Shorthand callback ─────────────────────────────────────────────────────
    if (typeof _options.onStateChange === 'function') {
        _subscribe('stateChange', _options.onStateChange);
    }

    // ── DOM ────────────────────────────────────────────────────────────────────
    const strings = getStrings();
    mountAnnouncer();

    if (_options.skipLink !== false) {
        mountSkipLink(strings.skipLink);
    }

    const ttsSupported = ttsIsSupported();

    mountPanel({
        container: _options.container || document.body,
        position: _options.position || 'bottom-right',
        strings,
        modules: _options.modules || {},
        features: { ttsSupported },
        onAction: handlePanelAction,
    });

    // Load TTS voices early so they're ready when needed. Chromium hands them
    // over asynchronously, so the panel is re-synced once the list arrives.
    if (ttsSupported && (_options.modules || {}).tts !== false) {
        loadVoices(function () { syncUI(_state, _ttsView()); });
    }

    _subscribe('tts:start', function () { _setTtsStatus('ttsSpeaking'); });
    _subscribe('tts:pause', function () { _setTtsStatus('ttsPaused'); });
    _subscribe('tts:resume', function () { _setTtsStatus('ttsSpeaking'); });
    _subscribe('tts:cancel', function () { _setTtsStatus('ttsStopped'); });
    _subscribe('tts:end', function () { _setTtsStatus('ttsEnded'); });

    document.addEventListener('visibilitychange', _onVisibilityChange);

    // Apply persisted state to DOM
    applyAllModules(_state);
    syncUI(_state, _ttsView());

    _initialized = true;
    bus.emit('init', getState());

    if (_options.welcomeMessage && ttsIsSupported()) {
        _scheduleWelcomeMessage();
    }
}

// ─── Destroy ─────────────────────────────────────────────────────────────────

/**
 * Completely removes the widget from the DOM and cleans up its own side
 * effects. Listeners the host registered with on() stay subscribed — call
 * off() for those. Safe to call even if not initialized.
 */
function destroy() {
    if (!_initialized) { return; }

    ttsCancel();
    removePrompt();
    resetPermissionFlow();
    disableAutoSpeak();
    document.removeEventListener('visibilitychange', _onVisibilityChange);
    _ttsStatus = '';

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
    _unsubscribeInternal();

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
    syncUI(_state, _ttsView());
    saveState(_state, _storage, _storageKey);
    bus.emit('stateChange', getState());
}

/**
 * Resets every setting to its default and forgets the stored payload, so the
 * next visit starts clean instead of reloading the choice the visitor erased.
 */
function reset() {
    ttsCancel();
    removePrompt();

    _state = createDefaultState(_options.defaults || {});
    _ttsStatus = '';
    applyAllModules(_state);
    syncUI(_state, _ttsView());
    _storage.removeItem(_storageKey);

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
    syncUI(_state, _ttsView());
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
        const voice = opts.voice || _state.tts.voice || selectVoice(_lang);
        _withPermission(function () {
            ttsSpeak(text, Object.assign(opts, { voice }, _ttsCallbacks()));
        });
    },

    /** Speaks the full page content with element highlighting. */
    speakPage() {
        if (!_state.tts.enabled) { return; }
        const content = getPageContent({
            contentSelectors: _options.contentSelectors,
            excludeSelectors: _options.excludeSelectors,
        });
        if (!content.length) { _setTtsStatus('ttsNothingToRead'); return; }
        const voice = _state.tts.voice || selectVoice(_lang);
        _withPermission(function () {
            ttsSpeakChunks(content, Object.assign(
                { rate: _state.tts.rate, lang: _lang, voice },
                _ttsCallbacks(),
            ));
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
        // Keeps the panel honest when the host drives the rate itself.
        syncUI(_state, _ttsView());
    },

    setVoice(voice) {
        ttsSetVoice(voice);
        _state = mergeState(_state, { tts: { voice } });
        saveState(_state, _storage, _storageKey);
        syncUI(_state, _ttsView());
    },

    grantPermission,
    revokePermission,
    addReplacements,
    setReplacements,
    resetReplacements,
    getReplacements,
};

// ─── Panel action handler ────────────────────────────────────────────────────

// Screen-reader output must read like the panel, not like the state object:
// "Kontras: Terbalik", not "Kontras: reverse". Both maps reuse the labels the
// panel already renders, so no locale can drift out of sync.
const VALUE_LABEL_KEYS = {
    contrast: {
        none: 'contrastNone',
        bright: 'contrastBright',
        reverse: 'contrastReverse',
        grayscale: 'contrastGrayscale',
    },
    cursor: {
        default: 'cursorDefault',
        white: 'cursorWhite',
        black: 'cursorBlack',
    },
};

const TOGGLE_LABEL_KEYS = {
    underlineLinks: 'underlineLinks',
    underlineHeaders: 'underlineHeaders',
    imgTitles: 'imgTitles',
    highlightFocus: 'highlightFocus',
    hideImages: 'hideImages',
    readingGuide: 'readingGuide',
    keyboard: 'keyboard',
};

/**
 * @param {string} group 'contrast' | 'cursor'
 * @param {string} value
 * @returns {string}
 */
function _valueLabel(group, value) {
    const map = VALUE_LABEL_KEYS[group];
    const key = map && map[value];
    return key ? t(key) : String(value);
}

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
            announce(t('announceContrast') + ': ' + _valueLabel('contrast', data));
            break;

        case 'cursor':
            setState({ cursor: data });
            announce(t('announceCursor') + ': ' + _valueLabel('cursor', data));
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
            // Persisted: the choice has to outlive the reload, otherwise the
            // next page view falls back to prefers-reduced-motion again.
            setState({ animations: !s.animations, animationsExplicit: true });
            announce(s.animations ? t('announceAnimationsOff') : t('announceAnimationsOn'));
            break;

        case 'toggle': {
            const key = data;
            if (key in s) {
                const next = !s[key];
                setState({ [key]: next });
                const labelKey = TOGGLE_LABEL_KEYS[key];
                announce((labelKey ? t(labelKey) : key)
                    + ': ' + t(next ? 'announceActive' : 'announceInactive'));
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

        case 'tts-main': {
            const next = !s.tts.enabled;
            setState({ tts: { enabled: next } });
            if (!next) {
                ttsCancel();
                _ttsStatus = '';
                syncUI(_state, _ttsView());
            }
            announce(t('ttsReader') + ': ' + t(next ? 'announceActive' : 'announceInactive'));
            break;
        }

        case 'tts-play':
            tts.speakPage();
            break;

        case 'tts-pause':
            tts.pause();
            break;

        case 'tts-resume':
            tts.resume();
            break;

        case 'tts-stop':
            tts.cancel();
            break;

        // No announce() here: dragging a slider would queue one message per
        // step, and the range/select already speak their own value to a
        // screen reader as it changes.
        case 'tts-rate': {
            const rate = parseFloat(data);
            if (isFinite(rate)) { tts.setRate(rate); }
            break;
        }

        case 'tts-voice': {
            const idx = parseInt(data, 10);
            const voices = getVoices();
            tts.setVoice(isNaN(idx) ? null : (voices[idx] || null));
            break;
        }

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
    if (mods.animations !== false) { applyAnimations(s.animations, s.animationsExplicit); }
    if (mods.cursor !== false) { applyCursor(s.cursor); }
    if (mods.readingGuide !== false) { applyReadingGuide(s.readingGuide); }
    if (mods.keyboard !== false) { applyKeyboardNav(s.keyboard); }
    applyAutoSpeak(
        mods.tts !== false && s.tts.enabled && s.tts.autoSpeak === 'selection' ? 'selection' : 'none',
        _speakSelection,
    );
}

// ─── TTS helpers ─────────────────────────────────────────────────────────────

/**
 * Engine callbacks that mirror playback onto the event bus, so the panel's
 * transport buttons and status line follow whatever is actually speaking —
 * a page read, a selection read, or a host call through A11yWidget.tts.
 * @returns {{onStart: function, onEnd: function}}
 */
function _ttsCallbacks() {
    return {
        onStart() { bus.emit('tts:start'); },
        onEnd() { bus.emit('tts:end'); },
    };
}

/**
 * Reading out loud to an empty tab is pure noise for everyone nearby.
 */
function _onVisibilityChange() {
    if (document.visibilityState !== 'hidden') { return; }
    if (ttsIsPlaying() || ttsIsPaused()) { tts.cancel(); }
}

/** @param {string} text */
function _speakSelection(text) {
    tts.speak(text);
}

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
        const text = _options.welcomeText || t('ttsWelcome');
        const voice = _state.tts.voice || selectVoice(_lang);
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = getLangCode(_lang);
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
