import { describe, it, expect, beforeEach } from 'vitest';
import { buildPanelHTML } from '../../src/ui/panelTemplate.js';
import {
    mountPanel, unmountPanel, openPanel, isPanelOpen,
} from '../../src/ui/panel.js';
import { syncUI } from '../../src/ui/syncUI.js';
import { mountSkipLink, unmountSkipLink } from '../../src/ui/skipLink.js';
import { createDefaultState, mergeState } from '../../src/core/state.js';
import en from '../../src/i18n/en.js';
import { VOICES } from './speechStub.js';

const allModules = new Proxy({}, { get: function () { return true; } });

describe('panelTemplate', function () {
    it('renders one section per enabled group and no trailing divider', function () {
        const html = buildPanelHTML(en, {});
        expect(html).toContain('a11y-panel__header');
        expect(html).toContain('a11y-panel__footer');
        const sections = html.match(/class="a11y-section"/g) || [];
        const dividers = html.match(/a11y-divider/g) || [];
        expect(dividers).toHaveLength(sections.length - 1);
    });

    it('drops a section when its module is disabled', function () {
        const html = buildPanelHTML(en, { contrast: false, tts: false });
        expect(html).not.toContain('id="a11y-label-contrast"');
        expect(html).not.toContain('id="a11y-label-tts"');
        expect(html).toContain('id="a11y-label-textsize"');
    });

    it('escapes strings coming from a custom locale instead of injecting markup', function () {
        const evil = Object.assign({}, en, { panelTitle: '</h2><img onerror=alert(1) src=x>' });
        const html = buildPanelHTML(evil, {});
        expect(html).not.toContain('<img onerror');
        expect(html).toContain('&lt;/h2&gt;&lt;img');
    });

    it('labels every control group through aria-labelledby', function () {
        const html = buildPanelHTML(en, {});
        const labels = html.match(/id="a11y-label-[a-z]+"/g) || [];
        const groups = html.match(/aria-labelledby="a11y-label-[a-z]+"/g) || [];
        expect(labels.length).toBe(groups.length);
    });

    it('builds a reader section the transport, speed and voice can live in', function () {
        const html = buildPanelHTML(en, {});
        ['tts-play', 'tts-pause', 'tts-resume', 'tts-stop'].forEach(function (action) {
            expect(html).toContain('data-a11y-action="' + action + '"');
        });
        expect(html).toContain('label class="a11y-tts__label" for="a11yTtsRate"');
        expect(html).toContain('label class="a11y-tts__label" for="a11yTtsVoice"');
        expect(html).toContain('type="range"');
        expect(html).toContain('role="status"');
    });

    it('leaves the reader section out when there is no speech engine', function () {
        const html = buildPanelHTML(en, {}, { ttsSupported: false });
        expect(html).not.toContain('id="a11y-label-tts"');
        expect(html).not.toContain('tts-play');
        expect(html).toContain('id="a11y-label-contrast"');
    });
});

describe('panel lifecycle', function () {
    const actions = [];
    let onAction;

    beforeEach(function () {
        actions.length = 0;
        onAction = function (action, data) { actions.push([action, data]); };
        unmountPanel();
    });

    function mount() {
        mountPanel({
            container: document.body,
            position: 'bottom-right',
            strings: en,
            modules: allModules,
            onAction: onAction,
        });
    }

    it('mounts a FAB wired to the panel and a hidden dialog', function () {
        mount();
        const fab = document.getElementById('a11yFab');
        const panel = document.getElementById('a11yPanel');
        expect(fab.getAttribute('aria-controls')).toBe('a11yPanel');
        expect(fab.getAttribute('aria-expanded')).toBe('false');
        expect(panel.getAttribute('role')).toBe('dialog');
        expect(panel.getAttribute('aria-hidden')).toBe('true');
        expect(isPanelOpen()).toBe(false);
    });

    it('toggles through the FAB and reports open/close to the host', function () {
        mount();
        document.getElementById('a11yFab').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(isPanelOpen()).toBe(true);
        expect(document.getElementById('a11yFab').getAttribute('aria-expanded')).toBe('true');
        document.getElementById('a11yFab').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(actions.map(function (a) { return a[0]; })).toEqual(['open', 'close']);
    });

    it('closes on Escape and returns focus to the FAB', function () {
        mount();
        openPanel();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(isPanelOpen()).toBe(false);
        expect(document.activeElement).toBe(document.getElementById('a11yFab'));
    });

    it('relays contrast and toggle actions with their data', function () {
        mount();
        const btn = document.querySelector('[data-a11y-action="contrast"][data-a11y-value="grayscale"]');
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(actions[0]).toEqual(['contrast', 'grayscale']);

        const key = document.querySelector('[data-a11y-action="toggle"][data-a11y-key="hideImages"]');
        key.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(actions[1]).toEqual(['toggle', 'hideImages']);
    });

    it('unmount removes both nodes and stops responding to Escape', function () {
        mount();
        unmountPanel();
        expect(document.getElementById('a11yPanel')).toBeNull();
        expect(document.getElementById('a11yFab')).toBeNull();
        openPanel();
        expect(isPanelOpen()).toBe(false);
    });
});

describe('syncUI', function () {
    it('reflects state into aria-pressed and the scale display', function () {
        mountPanel({
            container: document.body, position: 'bottom-right',
            strings: en, modules: allModules, onAction: function () { },
        });
        syncUI(mergeState(createDefaultState(), {
            contrast: 'bright', hideImages: true, textScale: 120, animations: false,
        }));
        const panel = document.getElementById('a11yPanel');
        expect(panel.querySelector('[data-a11y-value="bright"]').getAttribute('aria-pressed')).toBe('true');
        expect(panel.querySelector('[data-a11y-key="hideImages"]').getAttribute('aria-pressed')).toBe('true');
        expect(panel.querySelector('[data-a11y-action="animations"]').getAttribute('aria-pressed')).toBe('true');
        expect(document.getElementById('a11yTextDisplay').textContent).toBe('120%');
        unmountPanel();
    });

    it('is a no-op while the panel is not mounted', function () {
        expect(function () { syncUI(createDefaultState()); }).not.toThrow();
    });

    it('disables every reader control while the reader is off', function () {
        mountPanel({
            container: document.body, position: 'bottom-right',
            strings: en, modules: allModules, onAction: function () { },
        });
        syncUI(mergeState(createDefaultState(), { tts: { enabled: false } }));
        const panel = document.getElementById('a11yPanel');
        ['tts-play', 'tts-pause', 'tts-resume', 'tts-stop'].forEach(function (action) {
            expect(panel.querySelector('[data-a11y-action="' + action + '"]').disabled).toBe(true);
        });
        expect(document.getElementById('a11yTtsRate').disabled).toBe(true);
        expect(document.getElementById('a11yTtsVoice').disabled).toBe(true);
        unmountPanel();
    });

    it('fills the voice list once the browser reports it', function () {
        mountPanel({
            container: document.body, position: 'bottom-right',
            strings: en, modules: allModules, onAction: function () { },
        });
        const select = document.getElementById('a11yTtsVoice');
        syncUI(createDefaultState(), { voices: VOICES, voiceDefault: 'Auto' });
        expect(select.options.length).toBe(VOICES.length + 1);
        expect(select.options[0].textContent).toBe('Auto');
        expect(select.options[1].textContent).toBe('Bahasa Indonesia (id-ID)');
        unmountPanel();
    });

    it('keeps the voice select pointed at the state instead of the last click', function () {
        mountPanel({
            container: document.body, position: 'bottom-right',
            strings: en, modules: allModules, onAction: function () { },
        });
        const select = document.getElementById('a11yTtsVoice');
        const view = { voices: VOICES, voiceDefault: 'Auto' };
        syncUI(mergeState(createDefaultState(), { tts: { voice: VOICES[1] } }), view);
        expect(select.value).toBe('1');
        // A rebuild on every sync would drop the visitor's focus, so the list
        // is only re-created when it actually changes size.
        select.focus();
        syncUI(createDefaultState(), view);
        expect(select.options.length).toBe(VOICES.length + 1);
        expect(select.value).toBe('');
        unmountPanel();
    });
});

describe('skipLink', function () {
    it('becomes the first focusable node and targets the existing main id', function () {
        document.body.innerHTML = '<main id="konten"></main>';
        mountSkipLink('Lewati ke konten');
        const link = document.querySelector('.a11y-skip-link');
        expect(document.body.firstChild).toBe(link);
        expect(link.getAttribute('href')).toBe('#konten');
        expect(link.textContent).toBe('Lewati ke konten');
        unmountSkipLink();
        expect(document.querySelector('.a11y-skip-link')).toBeNull();
    });

    it('assigns an id to a bare main element so the link resolves', function () {
        document.body.innerHTML = '<main></main>';
        mountSkipLink();
        expect(document.querySelector('main').id).toBe('a11y-main-content');
        unmountSkipLink();
    });
});
