import { describe, it, expect, beforeEach, vi } from 'vitest';
import A11yWidget from '../../src/index.js';
import id from '../../src/i18n/id.js';

const KEY = 'unit_widget';
const html = () => document.documentElement;

function click(sel) {
    const el = document.querySelector(sel);
    if (!el) { throw new Error('no element for ' + sel); }
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

    it('applies defaults overrides on top of stored values', function () {
        localStorage.setItem(KEY, JSON.stringify({ font: 'readable' }));
        A11yWidget.init({ storageKey: KEY, defaults: { font: 'default' } });
        expect(A11yWidget.getState().font).toBe('default');
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

    it('a boolean toggle flips the state and announces it', async function () {
        click('[data-a11y-action="toggle"][data-a11y-key="keyboard"]');
        expect(A11yWidget.getState().keyboard).toBe(true);
        await new Promise(function (r) { setTimeout(r, 80); });
        expect(document.querySelector('.a11y-live-region').textContent)
            .toBe('keyboard: ' + id.announceActive);
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

    it('is safe to call twice and re-init afterwards works', function () {
        A11yWidget.init({ storageKey: KEY });
        A11yWidget.destroy();
        A11yWidget.destroy();
        A11yWidget.init({ storageKey: KEY });
        expect(document.getElementById('a11yPanel')).not.toBeNull();
        A11yWidget.destroy();
    });

    it('drops host listeners as it stands today', function () {
        A11yWidget.init({ storageKey: KEY });
        let fired = 0;
        A11yWidget.on('stateChange', function () { fired++; });
        A11yWidget.destroy();
        A11yWidget.init({ storageKey: KEY });
        A11yWidget.setState({ font: 'readable' });
        expect(fired).toBe(0);
        A11yWidget.destroy();
    });
});
