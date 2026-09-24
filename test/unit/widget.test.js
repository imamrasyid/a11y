import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import A11yWidget from '../../src/index.js';
import id from '../../src/i18n/id.js';
import { spoken, lastUtterance, startUtterance, endUtterance } from './speechStub.js';

const KEY = 'unit_widget';
const html = () => document.documentElement;

function click(sel) {
    const el = document.querySelector(sel);
    if (!el) { throw new Error('no element for ' + sel); }
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function statusText() {
    const el = document.getElementById('a11yTtsStatus');
    return el ? el.textContent : null;
}

/** @returns {Record<string, boolean>} which transport buttons are parked */
function transportDisabled() {
    const out = {};
    ['tts-play', 'tts-pause', 'tts-resume', 'tts-stop'].forEach(function (action) {
        out[action] = document.querySelector('[data-a11y-action="' + action + '"]').disabled;
    });
    return out;
}

function setVisibility(value) {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: function () { return value; },
    });
    document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(function () {
    A11yWidget.destroy();
    localStorage.clear();
    document.body.innerHTML = '<main><p>Isi halaman</p></main>';
});

describe('init', function () {
    it('mounts announcer, skip link, FAB and panel', function () {
        A11yWidget.init({ storageKey: KEY });
        expect(document.querySelector('.a11y-live-region')).not.toBeNull();
        expect(document.querySelector('.a11y-skip-link')).not.toBeNull();
        expect(document.getElementById('a11yFab')).not.toBeNull();
        expect(document.getElementById('a11yPanel')).not.toBeNull();
        A11yWidget.destroy();
    });

    it('honours skipLink:false and a custom container', function () {
        const host = document.createElement('div');
        document.body.appendChild(host);
        A11yWidget.init({ storageKey: KEY, skipLink: false, container: host });
        expect(document.querySelector('.a11y-skip-link')).toBeNull();
        expect(host.querySelector('#a11yPanel')).not.toBeNull();
        A11yWidget.destroy();
    });

    it('refuses a second init and says so', function () {
        const spy = vi.spyOn(console, 'warn').mockImplementation(function () { /* noop */ });
        A11yWidget.init({ storageKey: KEY });
        A11yWidget.init({ storageKey: KEY });
        expect(spy).toHaveBeenCalledTimes(1);
        A11yWidget.destroy();
    });

    it('starts from defaults when storage is empty', function () {
        A11yWidget.init({ storageKey: KEY });
        expect(A11yWidget.getState()).toMatchObject({ contrast: 'none', textScale: 100, keyboard: false });
        A11yWidget.destroy();
    });

    it('restores a persisted session onto the DOM', function () {
        localStorage.setItem(KEY, JSON.stringify({ contrast: 'grayscale', textScale: 140, hideImages: true }));
        A11yWidget.init({ storageKey: KEY });
        expect(html().getAttribute('data-a11y-contrast')).toBe('grayscale');
        expect(html().getAttribute('data-a11y-scale')).toBe('140');
        expect(html().getAttribute('data-a11y-hide-images')).toBe('on');
        A11yWidget.destroy();
    });

    it('hands scaleBase and styleNonce to the text-size control at init', function () {
        A11yWidget.init({ storageKey: KEY, scaleBase: 14, styleNonce: 'n0nce' });
        const style = document.getElementById('a11y-text-scale');
        // At 100% no rules are written, but the tag is already in <head> — a
        // nonce set after insertion is ignored, so it has to be there from the
        // first insert to survive a style-src policy.
        expect(style.getAttribute('nonce')).toBe('n0nce');
        A11yWidget.setState({ textScale: 150 });
        expect(style.textContent).toContain('body { font-size: 21px !important; }');
        A11yWidget.destroy();
    });

    it('keeps a stored choice above the host defaults', function () {
        localStorage.setItem(KEY, JSON.stringify({ font: 'readable' }));
        A11yWidget.init({ storageKey: KEY, defaults: { font: 'default' } });
        expect(A11yWidget.getState().font).toBe('readable');
        A11yWidget.destroy();
    });

    it('uses host defaults only when the visitor has no stored choice', function () {
        A11yWidget.init({ storageKey: KEY, defaults: { font: 'readable' } });
        expect(A11yWidget.getState().font).toBe('readable');
        expect(html().getAttribute('data-a11y-font')).toBe('readable');
        A11yWidget.destroy();
    });

    it('adopts preferences left behind by an older build', function () {
        localStorage.setItem('kebumen_a11y', JSON.stringify({ contrast: 'grayscale', textScale: 120, animations: true }));
        A11yWidget.init({ storageKey: KEY, migrateFrom: ['kebumen_a11y'] });

        expect(A11yWidget.getState()).toMatchObject({ contrast: 'grayscale', textScale: 120, animationsExplicit: true });
        expect(localStorage.getItem('kebumen_a11y')).toBeNull();
        expect(JSON.parse(localStorage.getItem(KEY))).toMatchObject({ contrast: 'grayscale' });
        A11yWidget.destroy();
    });

    it('keeps the current payload when a legacy key also exists', function () {
        localStorage.setItem('kebumen_a11y', JSON.stringify({ contrast: 'grayscale' }));
        localStorage.setItem(KEY, JSON.stringify({ contrast: 'bright' }));
        A11yWidget.init({ storageKey: KEY, migrateFrom: ['kebumen_a11y'] });

        expect(A11yWidget.getState().contrast).toBe('bright');
        expect(localStorage.getItem('kebumen_a11y')).toBeTruthy();
        A11yWidget.destroy();
    });

    it('ignores values it does not recognise', function () {
        localStorage.setItem(KEY, JSON.stringify({ contrast: 'neon', textScale: 'besar', buatan: true }));
        A11yWidget.init({ storageKey: KEY });

        expect(A11yWidget.getState().contrast).toBe('none');
        expect(html().hasAttribute('data-a11y-contrast')).toBe(false);
        expect(A11yWidget.getState()).not.toHaveProperty('buatan');
        A11yWidget.destroy();
    });

    it('keeps a disabled module out of the DOM and off the panel', function () {
        A11yWidget.init({ storageKey: KEY, modules: { contrast: false, tts: false } });
        expect(document.getElementById('a11yPanel').innerHTML).not.toContain('a11y-label-contrast');
        A11yWidget.setState({ contrast: 'bright' });
        expect(html().hasAttribute('data-a11y-contrast')).toBe(false);
        A11yWidget.destroy();
    });
});

describe('panel interaction', function () {
    beforeEach(function () {
        A11yWidget.init({ storageKey: KEY });
    });

    it('contrast click updates state, DOM, storage and aria-pressed', function () {
        click('[data-a11y-action="contrast"][data-a11y-value="reverse"]');
        expect(A11yWidget.getState().contrast).toBe('reverse');
        expect(html().getAttribute('data-a11y-contrast')).toBe('reverse');
        expect(JSON.parse(localStorage.getItem(KEY)).contrast).toBe('reverse');
        expect(document.querySelector('[data-a11y-value="reverse"]').getAttribute('aria-pressed')).toBe('true');
        A11yWidget.destroy();
    });

    it('text size steps and clamps at the bounds', function () {
        for (let i = 0; i < 20; i++) { click('#a11yTextInc'); }
        expect(A11yWidget.getState().textScale).toBe(200);
        expect(document.getElementById('a11yTextDisplay').textContent).toBe('200%');
        for (let i = 0; i < 30; i++) { click('#a11yTextDec'); }
        expect(A11yWidget.getState().textScale).toBe(70);
        A11yWidget.destroy();
    });

    it('a boolean toggle flips the state and announces the panel label', async function () {
        click('[data-a11y-action="toggle"][data-a11y-key="keyboard"]');
        expect(A11yWidget.getState().keyboard).toBe(true);
        await new Promise(function (r) { setTimeout(r, 80); });
        expect(document.querySelector('.a11y-live-region').textContent)
            .toBe(id.keyboard + ': ' + id.announceActive);
        A11yWidget.destroy();
    });

    it('announces contrast and cursor by their visible names, not state values', async function () {
        click('[data-a11y-action="contrast"][data-a11y-value="reverse"]');
        click('[data-a11y-action="cursor"][data-a11y-value="black"]');
        await new Promise(function (r) { setTimeout(r, 80); });
        expect(document.querySelector('.a11y-live-region').textContent)
            .toBe(id.announceCursor + ': ' + id.cursorBlack);
        A11yWidget.destroy();
    });

    it('the TTS switch turns the reader off and cancels speech', function () {
        expect(A11yWidget.getState().tts.enabled).toBe(true);
        click('[data-a11y-action="tts-main"]');
        expect(A11yWidget.getState().tts.enabled).toBe(false);
        A11yWidget.destroy();
    });

    it('reset restores defaults and emits reset', function () {
        const seen = [];
        A11yWidget.on('reset', function () { seen.push('reset'); });
        A11yWidget.setState({ contrast: 'bright', textScale: 180 });
        click('#a11yReset');
        expect(seen).toEqual(['reset']);
        expect(A11yWidget.getState()).toMatchObject({ contrast: 'none', textScale: 100 });
        expect(html().hasAttribute('data-a11y-contrast')).toBe(false);
        A11yWidget.destroy();
    });

    it('reset forgets the stored payload so the next visit starts clean', function () {
        A11yWidget.setState({ contrast: 'bright' });
        expect(localStorage.getItem(KEY)).toBeTruthy();
        click('#a11yReset');
        expect(localStorage.getItem(KEY)).toBeNull();
        A11yWidget.destroy();
        A11yWidget.init({ storageKey: KEY });
        expect(A11yWidget.getState().contrast).toBe('none');
        A11yWidget.destroy();
    });

    it('keeps an explicit "animations on" choice across a reload', function () {
        click('[data-a11y-action="animations"]');
        expect(A11yWidget.getState()).toMatchObject({ animations: false, animationsExplicit: true });
        A11yWidget.destroy();

        // Second visit: same stored value as the default, so only the persisted
        // explicit flag can bring the data attribute back.
        localStorage.setItem(KEY, JSON.stringify({ animations: true, animationsExplicit: true }));
        A11yWidget.init({ storageKey: KEY });
        expect(html().getAttribute('data-a11y-animations')).toBe('on');
        A11yWidget.destroy();

        localStorage.setItem(KEY, JSON.stringify({ animations: true }));
        A11yWidget.init({ storageKey: KEY });
        expect(html().hasAttribute('data-a11y-animations')).toBe(false);
        A11yWidget.destroy();
    });

    it('open/close/toggle drive the panel and the matching events', function () {
        const events = [];
        A11yWidget.on('open', function () { events.push('open'); });
        A11yWidget.on('close', function () { events.push('close'); });
        A11yWidget.open();
        expect(A11yWidget.isOpen()).toBe(true);
        A11yWidget.close();
        expect(A11yWidget.isOpen()).toBe(false);
        expect(events).toEqual(['open', 'close']);
        A11yWidget.destroy();
    });

    it('leaves focus with the FAB when Escape arrives before the panel finished opening', function () {
        vi.useFakeTimers();
        try {
            click('#a11yFab');
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            vi.advanceTimersByTime(200);
            expect(document.activeElement).toBe(document.getElementById('a11yFab'));
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('what the reader reads', function () {
    beforeEach(function () {
        A11yWidget.destroy();
        localStorage.clear();
        document.body.innerHTML =
            '<div class="post-details-article"><p>isi blog</p></div>' +
            '<main><p>isi utama</p><nav><p>menu</p></nav></main>';
        A11yWidget.init({ storageKey: KEY, defaults: { tts: { enabled: true } } });
        A11yWidget.tts.grantPermission();
    });

    afterEach(function () {
        A11yWidget.destroy();
        localStorage.clear();
    });

    function spokenTexts() {
        return spoken.map(function (utterance) { return utterance.text; });
    }

    it('reads the landmark by default and not the site wrapper', function () {
        A11yWidget.tts.speakPage();
        expect(spokenTexts()).toEqual(['isi utama']);
    });

    it('reads the container the host names', function () {
        A11yWidget.destroy();
        A11yWidget.init({
            storageKey: KEY,
            defaults: { tts: { enabled: true } },
            contentSelectors: ['.post-details-article'],
        });
        A11yWidget.tts.grantPermission();
        A11yWidget.tts.speakPage();
        expect(spokenTexts()).toEqual(['isi blog']);
    });

    it('skips the subtree the host excludes', function () {
        A11yWidget.destroy();
        A11yWidget.init({
            storageKey: KEY,
            defaults: { tts: { enabled: true } },
            excludeSelectors: ['main'],
        });
        A11yWidget.tts.grantPermission();
        A11yWidget.tts.speakPage();
        expect(spokenTexts()).toEqual(['isi blog']);
    });
});

describe('public state API', function () {
    beforeEach(function () {
        A11yWidget.init({ storageKey: KEY });
    });

    it('getState returns a snapshot the caller cannot use to mutate the widget', function () {
        const s = A11yWidget.getState();
        s.contrast = 'bright';
        s.tts.enabled = false;
        expect(A11yWidget.getState().contrast).toBe('none');
        expect(A11yWidget.getState().tts.enabled).toBe(true);
        A11yWidget.destroy();
    });

    it('setState emits stateChange once with the new state', function () {
        let calls = 0;
        A11yWidget.on('stateChange', function () { calls++; });
        A11yWidget.setState({ spacing: 'wide' });
        expect(calls).toBe(1);
        expect(html().getAttribute('data-a11y-spacing')).toBe('wide');
        A11yWidget.destroy();
    });

    it('resetModule puts one key back without touching the others', function () {
        A11yWidget.setState({ align: 'left', cursor: 'black' });
        A11yWidget.resetModule('align');
        expect(A11yWidget.getState()).toMatchObject({ align: 'default', cursor: 'black' });
        expect(html().hasAttribute('data-a11y-align')).toBe(false);
        expect(html().getAttribute('data-a11y-cursor')).toBe('black');
        A11yWidget.destroy();
    });

    it('onStateChange option behaves like a stateChange subscription', function () {
        A11yWidget.destroy();
        const seen = [];
        A11yWidget.init({ storageKey: KEY, onStateChange: function (s) { seen.push(s.font); } });
        A11yWidget.setState({ font: 'readable' });
        expect(seen).toEqual(['readable']);
        A11yWidget.destroy();
    });

    it('off() stops delivery', function () {
        const handler = function () { throw new Error('should not run'); };
        A11yWidget.on('stateChange', handler);
        A11yWidget.off('stateChange', handler);
        A11yWidget.setState({ font: 'readable' });
        A11yWidget.destroy();
    });
});

describe('reader controls', function () {
    beforeEach(function () {
        // Skip the autoplay probe so each test can drive playback directly.
        A11yWidget.tts.grantPermission();
        A11yWidget.init({ storageKey: KEY });
    });

    afterEach(function () {
        delete document.visibilityState;
        A11yWidget.destroy();
    });

    it('gives every reader control a name a screen reader can announce', function () {
        expect(document.querySelector('label[for="a11yTtsRate"]').textContent).toBe(id.ttsRate);
        expect(document.querySelector('label[for="a11yTtsVoice"]').textContent).toBe(id.ttsVoice);
        expect(document.getElementById('a11yTtsStatus').getAttribute('role')).toBe('status');
        expect(document.getElementById('a11yTtsVoice').options[0].value).toBe('');
    });

    it('walks the transport through playing, paused and stopped', function () {
        expect(transportDisabled()).toEqual({
            'tts-play': false, 'tts-pause': true, 'tts-resume': true, 'tts-stop': true,
        });

        click('[data-a11y-action="tts-play"]');
        expect(spoken).toHaveLength(1);
        startUtterance(lastUtterance());
        expect(statusText()).toBe(id.ttsSpeaking);
        expect(transportDisabled()).toEqual({
            'tts-play': false, 'tts-pause': false, 'tts-resume': true, 'tts-stop': false,
        });

        click('[data-a11y-action="tts-pause"]');
        expect(statusText()).toBe(id.ttsPaused);
        expect(transportDisabled()).toEqual({
            'tts-play': false, 'tts-pause': true, 'tts-resume': false, 'tts-stop': false,
        });

        click('[data-a11y-action="tts-resume"]');
        expect(statusText()).toBe(id.ttsSpeaking);

        click('[data-a11y-action="tts-stop"]');
        expect(statusText()).toBe(id.ttsStopped);
        expect(A11yWidget.tts.isPlaying()).toBe(false);
    });

    it('says what it did when there is nothing on the page to read', function () {
        document.querySelector('main').innerHTML = '';
        click('[data-a11y-action="tts-play"]');
        expect(spoken).toHaveLength(0);
        expect(statusText()).toBe(id.ttsNothingToRead);
    });

    it('reads the page block by block, one utterance at a time', function () {
        document.querySelector('main').innerHTML =
            '<h1>Judul layanan</h1><p>Paragraf pertama halaman.</p><p>Paragraf kedua halaman.</p>';
        click('[data-a11y-action="tts-play"]');

        // Nothing is queued ahead: the next block is spoken only once the
        // browser reports the current one finished.
        for (let guard = 0; spoken.length < 3 && guard < 10; guard++) {
            const utt = lastUtterance();
            startUtterance(utt);
            endUtterance(utt);
        }
        const finalBlock = lastUtterance();
        startUtterance(finalBlock);
        endUtterance(finalBlock);

        expect(spoken.map(function (utt) { return utt.text; })).toEqual([
            'Judul layanan', 'Paragraf pertama halaman.', 'Paragraf kedua halaman.',
        ]);
        expect(statusText()).toBe(id.ttsEnded);
    });

    it('reports the end of the page once the last chunk has been spoken', function () {
        const events = [];
        A11yWidget.on('tts:start', function () { events.push('start'); });
        A11yWidget.on('tts:end', function () { events.push('end'); });
        click('[data-a11y-action="tts-play"]');
        startUtterance(lastUtterance());
        endUtterance(lastUtterance());
        expect(events).toEqual(['start', 'end']);
        expect(statusText()).toBe(id.ttsEnded);
    });

    it('will not read on, or report finished, for speech it already cancelled', function () {
        const events = [];
        A11yWidget.on('tts:end', function () { events.push('end'); });
        click('[data-a11y-action="tts-play"]');
        const queued = spoken.length;
        click('[data-a11y-action="tts-stop"]');

        // Chromium fires onend for the utterance it discards, from inside
        // cancel(). The engine must not read that as "this block is done".
        expect(spoken).toHaveLength(queued);
        expect(events).toEqual([]);
    });

    it('drives the engine from the speed slider and mirrors the number back', function () {
        const range = document.getElementById('a11yTtsRate');
        range.value = '1.4';
        range.dispatchEvent(new Event('input', { bubbles: true }));
        expect(A11yWidget.getState().tts.rate).toBe(1.4);
        expect(document.getElementById('a11yTtsRateValue').textContent).toBe('1.4×');
        expect(JSON.parse(localStorage.getItem(KEY)).tts.rate).toBe(1.4);
    });

    it('keeps the readout true to the setting when the host sets a rate outside the slider', function () {
        A11yWidget.tts.setRate(5);
        expect(document.getElementById('a11yTtsRate').value).toBe('2');
        expect(document.getElementById('a11yTtsRateValue').textContent).toBe('5.0×');
    });

    it('applies a chosen voice for this page view without storing the object', function () {
        const select = document.getElementById('a11yTtsVoice');
        expect(select.options[1].textContent).toBe('Bahasa Indonesia (id-ID)');
        select.value = '1';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        expect(A11yWidget.getState().tts.voice.name).toBe('Google_us');
        expect(JSON.parse(localStorage.getItem(KEY)).tts.voice).toBeNull();

        A11yWidget.destroy();
        A11yWidget.tts.grantPermission();
        A11yWidget.init({ storageKey: KEY });
        expect(A11yWidget.getState().tts.voice).toBeNull();
        expect(document.getElementById('a11yTtsVoice').value).toBe('');
    });

    it('switching the reader off silences it, clears the status and parks the controls', function () {
        click('[data-a11y-action="tts-play"]');
        startUtterance(lastUtterance());
        click('[data-a11y-action="tts-main"]');
        expect(A11yWidget.getState().tts.enabled).toBe(false);
        expect(A11yWidget.tts.isPlaying()).toBe(false);
        expect(statusText()).toBe('');
        expect(transportDisabled()).toEqual({
            'tts-play': true, 'tts-pause': true, 'tts-resume': true, 'tts-stop': true,
        });
        expect(document.getElementById('a11yTtsRate').disabled).toBe(true);
        expect(document.getElementById('a11yTtsVoice').disabled).toBe(true);
    });

    it('refuses to read the page while the reader is off', function () {
        A11yWidget.setState({ tts: { enabled: false } });
        A11yWidget.tts.speakPage();
        expect(spoken).toHaveLength(0);
    });

    it('stops the reader when the tab goes hidden', function () {
        click('[data-a11y-action="tts-play"]');
        startUtterance(lastUtterance());
        setVisibility('hidden');
        expect(A11yWidget.tts.isPlaying()).toBe(false);
        expect(statusText()).toBe(id.ttsStopped);
    });

    it('takes its visibilitychange listener back on destroy', function () {
        const spy = vi.spyOn(document, 'removeEventListener');
        A11yWidget.destroy();
        expect(spy.mock.calls.some(function (call) { return call[0] === 'visibilitychange'; })).toBe(true);
        spy.mockRestore();
    });
});

describe('read what I select', function () {
    beforeEach(function () {
        A11yWidget.tts.grantPermission();
        if (window.getSelection) { window.getSelection().removeAllRanges(); }
    });

    afterEach(function () {
        if (window.getSelection) { window.getSelection().removeAllRanges(); }
        A11yWidget.destroy();
    });

    function selectText(el, text) {
        el.textContent = text;
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    async function releaseMouse() {
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        await new Promise(function (r) { setTimeout(r, 80); });
    }

    it('stays out of the way until the host opts in', async function () {
        A11yWidget.init({ storageKey: KEY });
        selectText(document.querySelector('p'), 'paragraf yang diseleksi pembaca');
        await releaseMouse();
        expect(spoken).toHaveLength(0);
    });

    it('reads a selection from the host page once opted in', async function () {
        A11yWidget.init({ storageKey: KEY, defaults: { tts: { autoSpeak: 'selection' } } });
        selectText(document.querySelector('p'), 'paragraf yang diseleksi pembaca');
        await releaseMouse();
        expect(spoken).toHaveLength(1);
        expect(spoken[0].text).toBe('paragraf yang diseleksi pembaca');
    });

    it('leaves a selection inside the panel alone', async function () {
        A11yWidget.init({ storageKey: KEY, defaults: { tts: { autoSpeak: 'selection' } } });
        selectText(document.getElementById('a11yTtsRateValue'), '1.0× teks panel');
        await releaseMouse();
        expect(spoken).toHaveLength(0);
    });

    it('ignores a selection too short to be deliberate', async function () {
        A11yWidget.init({ storageKey: KEY, defaults: { tts: { autoSpeak: 'selection' } } });
        selectText(document.querySelector('p'), 'ab');
        await releaseMouse();
        expect(spoken).toHaveLength(0);
    });

    it('unbinds when the reader is switched off and again on', async function () {
        A11yWidget.init({ storageKey: KEY, defaults: { tts: { autoSpeak: 'selection' } } });
        A11yWidget.setState({ tts: { enabled: false } });
        selectText(document.querySelector('p'), 'paragraf yang diseleksi pembaca');
        await releaseMouse();
        expect(spoken).toHaveLength(0);

        A11yWidget.setState({ tts: { enabled: true } });
        selectText(document.querySelector('p'), 'paragraf lain yang diseleksi');
        await releaseMouse();
        expect(spoken).toHaveLength(1);
    });

    it('releases the document listeners on destroy', async function () {
        A11yWidget.init({ storageKey: KEY, defaults: { tts: { autoSpeak: 'selection' } } });
        A11yWidget.destroy();
        selectText(document.querySelector('p'), 'paragraf yang diseleksi pembaca');
        await releaseMouse();
        expect(spoken).toHaveLength(0);
    });
});

describe('destroy', function () {
    it('leaves no widget node, attribute or injected style behind', function () {
        A11yWidget.init({ storageKey: KEY });
        A11yWidget.setState({ textScale: 150, highlightFocus: true, readingGuide: true });
        A11yWidget.destroy();

        expect(document.getElementById('a11yPanel')).toBeNull();
        expect(document.getElementById('a11yFab')).toBeNull();
        expect(document.querySelector('.a11y-live-region')).toBeNull();
        expect(document.querySelector('.a11y-reading-guide')).toBeNull();
        expect(document.getElementById('a11y-text-scale')).toBeNull();
        expect(html().attributes.length).toBe(0);
    });

    it('takes back the target id it gave to the host main element', function () {
        A11yWidget.init({ storageKey: KEY });
        const main = document.querySelector('main');
        expect(main.id).toBe('a11y-main-content');
        expect(document.querySelector('.a11y-skip-link').getAttribute('href')).toBe('#a11y-main-content');

        A11yWidget.destroy();
        expect(main.hasAttribute('id')).toBe(false);
    });

    it('uses an id the host already owns and leaves it in place', function () {
        document.querySelector('main').id = 'konten';
        A11yWidget.init({ storageKey: KEY });
        expect(document.querySelector('.a11y-skip-link').getAttribute('href')).toBe('#konten');
        A11yWidget.destroy();
        expect(document.querySelector('main').id).toBe('konten');
    });

    it('is safe to call twice and re-init afterwards works', function () {
        A11yWidget.init({ storageKey: KEY });
        A11yWidget.destroy();
        A11yWidget.destroy();
        A11yWidget.init({ storageKey: KEY });
        expect(document.getElementById('a11yPanel')).not.toBeNull();
        A11yWidget.destroy();
    });

    it('keeps host listeners across a destroy/init cycle', function () {
        A11yWidget.init({ storageKey: KEY });
        let fired = 0;
        A11yWidget.on('stateChange', function () { fired++; });
        A11yWidget.destroy();
        A11yWidget.init({ storageKey: KEY });
        A11yWidget.setState({ font: 'readable' });
        expect(fired).toBe(1);
        A11yWidget.destroy();
    });

    it('drops only the listener it registered for itself', function () {
        let seen = 0;
        A11yWidget.init({ storageKey: KEY, onStateChange: function () { seen++; } });
        A11yWidget.setState({ font: 'readable' });
        expect(seen).toBe(1);
        A11yWidget.destroy();
        A11yWidget.init({ storageKey: KEY });
        A11yWidget.setState({ font: 'default' });
        expect(seen).toBe(1);
        A11yWidget.destroy();
    });
});
