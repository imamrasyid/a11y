import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    requestPermissionAndSpeak, grantPermission, revokePermission,
    isPermissionGranted, removePrompt, resetPermissionFlow,
} from '../../src/modules/tts/ttsPermission.js';
import { applyAutoSpeak, disableAutoSpeak, isAutoSpeakActive } from '../../src/modules/tts/ttsAutoSpeak.js';
import { spoken, lastUtterance, endUtterance } from './speechStub.js';

const OPT = {
    hostname: 'example.test',
    permissionTitle: 'Pembaca Teks',
    permissionBody: 'ingin membaca teks.',
    allowLabel: 'Izinkan',
    denyLabel: 'Tolak',
    dialogLabel: 'Izin pembaca teks',
};

/** jsdom's user agent matches neither mobile nor Safari, so the desktop probe runs. */
function probe() { return lastUtterance(); }

function promptButton(modifier) {
    return document.querySelector('.a11y-tts-prompt__btn--' + modifier);
}

afterEach(function () {
    removePrompt();
    resetPermissionFlow();
    disableAutoSpeak();
    vi.restoreAllMocks();
});

describe('tts permission', function () {
    it('speaks straight away once permission is granted', function () {
        grantPermission();
        let spoke = false;
        requestPermissionAndSpeak(function () { spoke = true; }, OPT);
        expect(spoke).toBe(true);
        expect(spoken).toHaveLength(0);
    });

    it('keeps the grant in memory when storage refuses the write', function () {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function () {
            throw new Error('QuotaExceededError');
        });
        expect(function () { grantPermission(); }).not.toThrow();
        expect(isPermissionGranted()).toBe(true);

        let spoke = false;
        requestPermissionAndSpeak(function () { spoke = true; }, OPT);
        expect(spoke).toBe(true);
    });

    it('forgets both the flag and the stored grant on revoke', function () {
        grantPermission();
        revokePermission();
        expect(isPermissionGranted()).toBe(false);
        expect(sessionStorage.getItem('a11y_tts_allowed')).toBeNull();
    });

    it('probes once for two requests and keeps the newer one', function () {
        const heard = [];
        requestPermissionAndSpeak(function () { heard.push('lama'); }, OPT);
        requestPermissionAndSpeak(function () { heard.push('baru'); }, OPT);

        expect(spoken).toHaveLength(1);   // no second probe utterance
        endUtterance(probe());
        expect(heard).toEqual(['baru']);
    });

    it('asks the visitor when the browser refuses to speak', function () {
        let heard = false;
        requestPermissionAndSpeak(function () { heard = true; }, OPT);
        probe().onerror({ error: 'not-allowed' });

        expect(heard).toBe(false);
        const dialog = document.querySelector('.a11y-tts-prompt');
        expect(dialog.getAttribute('role')).toBe('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(dialog.getAttribute('aria-label')).toBe(OPT.dialogLabel);
        expect(dialog.textContent).toContain('example.test');

        promptButton('allow').click();
        expect(heard).toBe(true);
        expect(isPermissionGranted()).toBe(true);
    });

    it('lets the visitor decline without speaking and without a second prompt', function () {
        let denied = 0;
        let heard = false;
        requestPermissionAndSpeak(function () { heard = true; },
            Object.assign({}, OPT, { onDeny: function () { denied++; } }));
        probe().onerror({ error: 'not-allowed' });

        promptButton('deny').click();
        expect(heard).toBe(false);
        expect(denied).toBe(1);
        expect(isPermissionGranted()).toBe(false);

        // A request made afterwards gets its own probe and its own flush — the
        // denied one must not come back through the old prompt's handlers.
        let second = false;
        requestPermissionAndSpeak(function () { second = true; }, OPT);
        expect(spoken).toHaveLength(2);
        endUtterance(probe());
        expect(second).toBe(true);
        expect(heard).toBe(false);
    });

    it('escapes the strings it puts in the prompt', function () {
        requestPermissionAndSpeak(function () { /* noop */ },
            Object.assign({}, OPT, { permissionTitle: '</div><img onerror=alert(1)>' }));
        probe().onerror({ error: 'not-allowed' });
        expect(document.querySelector('.a11y-tts-prompt img')).toBeNull();
        expect(document.querySelector('.a11y-tts-prompt').innerHTML).toContain('&lt;/div&gt;');
    });

    it('drops the queued request when the widget is torn down', function () {
        let heard = false;
        requestPermissionAndSpeak(function () { heard = true; }, OPT);
        resetPermissionFlow();
        endUtterance(probe());
        expect(heard).toBe(false);
    });
});

describe('tts auto-speak on selection', function () {
    afterEach(function () {
        if (window.getSelection) { window.getSelection().removeAllRanges(); }
    });

    function selectText(el, text) {
        el.textContent = text;
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    it('binds only for the selection mode', function () {
        const speak = function () { /* noop */ };
        applyAutoSpeak('selection', speak);
        expect(isAutoSpeakActive()).toBe(true);
        applyAutoSpeak('none', speak);
        expect(isAutoSpeakActive()).toBe(false);
    });

    it('unbinds when no callback is supplied', function () {
        applyAutoSpeak('selection', function () { /* noop */ });
        applyAutoSpeak('selection', null);
        expect(isAutoSpeakActive()).toBe(false);
    });

    it('reads the selection once the listener is bound', async function () {
        const heard = [];
        applyAutoSpeak('selection', function (text) { heard.push(text); });
        document.body.innerHTML = '<p id="satu">kalimat yang diseleksi</p>';
        selectText(document.getElementById('satu'), 'kalimat yang diseleksi');
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        await new Promise(function (r) { setTimeout(r, 80); });
        expect(heard).toEqual(['kalimat yang diseleksi']);
    });

    it('ignores a selection the visitor removed before the settle timer ran', async function () {
        const heard = [];
        applyAutoSpeak('selection', function (text) { heard.push(text); });
        document.body.innerHTML = '<p id="satu">kalimat yang diseleksi</p>';
        selectText(document.getElementById('satu'), 'kalimat yang diseleksi');
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        window.getSelection().removeAllRanges();
        await new Promise(function (r) { setTimeout(r, 80); });
        expect(heard).toEqual([]);
    });
});
