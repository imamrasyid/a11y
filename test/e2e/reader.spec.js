import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import id from '../../src/i18n/id.js';

const FIXTURE = '/test/fixtures/playground.html';

/**
 * Chromium exposes speechSynthesis but has no voices and fires no events in a
 * headless run, so the reader section is driven through a stub installed
 * before the bundle loads — the same stand-in the unit tests use.
 */
function installSpeechStub() {
    const voices = [
        { name: 'Bahasa Indonesia', lang: 'id-ID', default: true },
        { name: 'Google_us', lang: 'en-US', default: false },
    ];

    class FakeUtterance {
        constructor(text) {
            this.text = String(text);
            this.lang = '';
            this.rate = 1;
            this.volume = 1;
            this.voice = null;
        }
    }

    const trace = { speaking: false, paused: false, utterances: [], current: null };

    Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
            get speaking() { return trace.speaking; },
            get paused() { return trace.paused; },
            getVoices: function () { return voices; },
            addEventListener: function () { /* the list is already complete */ },
            removeEventListener: function () { /* noop */ },
            speak: function (utterance) {
                trace.utterances.push(utterance);
                trace.current = utterance;
                trace.speaking = true;
                trace.paused = false;
            },
            pause: function () { trace.paused = true; },
            resume: function () { trace.paused = false; },
            cancel: function () {
                trace.speaking = false;
                trace.paused = false;
                // Chromium fires `end` for the utterance it is discarding, from
                // inside cancel().
                const dropped = trace.current;
                trace.current = null;
                if (dropped && dropped.onend) { dropped.onend({}); }
            },
        },
    });

    window.SpeechSynthesisUtterance = FakeUtterance;
    window.__speech = trace;

    // Stand in for a visitor who already allowed the reader this session.
    try { sessionStorage.setItem('a11y_tts_allowed', '1'); } catch (_) { /* noop */ }
}

test.beforeEach(async function ({ page }) {
    await page.addInitScript(installSpeechStub);
    await page.goto(FIXTURE);
    await page.evaluate('window.a11yReady');
    await page.click('#a11yFab');
    // The panel fades in over 0.22s; scanning or clicking mid-fade measures a
    // translucent widget nobody actually sees.
    await page.waitForFunction(function () {
        const panel = document.getElementById('a11yPanel');
        return !!panel && getComputedStyle(panel).opacity === '1';
    });
});

/** Tells the engine the utterance it queued has started playing. */
async function startCurrentUtterance(page) {
    await page.evaluate('window.__speech.utterances[window.__speech.utterances.length - 1].onstart({})');
}

test.describe('reading the page from the panel', function () {
    test('starts, pauses, resumes and stops with the status line keeping pace', async function ({ page }) {
        const status = page.locator('#a11yTtsStatus');
        const pause = page.locator('[data-a11y-action="tts-pause"]');
        const resume = page.locator('[data-a11y-action="tts-resume"]');
        const stop = page.locator('[data-a11y-action="tts-stop"]');

        await expect(pause).toBeDisabled();
        await expect(status).toHaveText('');

        await page.click('[data-a11y-action="tts-play"]');
        expect(await page.evaluate('window.__speech.utterances.length')).toBeGreaterThan(0);
        await startCurrentUtterance(page);
        await expect(status).toHaveText(id.ttsSpeaking);
        await expect(pause).toBeEnabled();
        await expect(resume).toBeDisabled();

        await pause.click();
        await expect(status).toHaveText(id.ttsPaused);
        await expect(resume).toBeEnabled();

        await resume.click();
        await expect(status).toHaveText(id.ttsSpeaking);

        await stop.click();
        await expect(status).toHaveText(id.ttsStopped);
        await expect(pause).toBeDisabled();
        expect(await page.evaluate('window.__speech.speaking')).toBe(false);
    });

    test('marks up the block it is reading and clears it again on stop', async function ({ page }) {
        await page.click('[data-a11y-action="tts-play"]');
        await startCurrentUtterance(page);
        await expect(page.locator('main h1')).toHaveClass(/a11y-tts-highlight/);
        await page.click('[data-a11y-action="tts-stop"]');
        expect(await page.evaluate('document.querySelectorAll(".a11y-tts-highlight").length')).toBe(0);
    });

    test('the speed slider reaches the engine, the readout and storage', async function ({ page }) {
        await page.locator('#a11yTtsRate').fill('1.5');
        await expect(page.locator('#a11yTtsRateValue')).toHaveText('1.5×');
        expect(await page.evaluate('A11yWidget.getState().tts.rate')).toBe(1.5);
        expect(await page.evaluate('JSON.parse(localStorage.getItem("a11y_widget")).tts.rate')).toBe(1.5);

        await page.click('[data-a11y-action="tts-play"]');
        expect(await page.evaluate('window.__speech.utterances[0].rate')).toBe(1.5);
    });

    test('the voice picker offers what the browser reports', async function ({ page }) {
        const select = page.locator('#a11yTtsVoice');
        await expect(select.locator('option')).toHaveCount(3);
        await expect(select.locator('option').nth(0)).toHaveText(id.ttsVoiceDefault);

        await select.selectOption('0');
        expect(await page.evaluate('A11yWidget.getState().tts.voice.name')).toBe('Bahasa Indonesia');
    });

    test('switching the reader off parks every control and stays silent', async function ({ page }) {
        await page.click('[data-a11y-action="tts-play"]');
        await startCurrentUtterance(page);
        await page.click('[data-a11y-action="tts-main"]');

        await expect(page.locator('[data-a11y-action="tts-play"]')).toBeDisabled();
        await expect(page.locator('#a11yTtsRate')).toBeDisabled();
        await expect(page.locator('#a11yTtsVoice')).toBeDisabled();
        await expect(page.locator('#a11yTtsStatus')).toHaveText('');
        expect(await page.evaluate('window.__speech.speaking')).toBe(false);

        const before = await page.evaluate('window.__speech.utterances.length');
        await page.evaluate('A11yWidget.tts.speakPage()');
        expect(await page.evaluate('window.__speech.utterances.length')).toBe(before);
    });
});

test.describe('axe over the reader controls', function () {
    test('clean while a block is being read', async function ({ page }) {
        await page.click('[data-a11y-action="tts-play"]');
        await startCurrentUtterance(page);
        await expect(page.locator('#a11yTtsStatus')).toHaveText(id.ttsSpeaking);

        const results = await new AxeBuilder({ page })
            .include('#a11yPanel')
            .include('#a11yFab')
            .analyze();
        expect(results.violations.map(function (v) {
            return v.id + ': ' + v.nodes[0].target[0];
        })).toEqual([]);
    });

    test('clean in inverted contrast with the voice list filled', async function ({ page }) {
        await page.evaluate('A11yWidget.setState({ contrast: \'reverse\' })');
        await expect(page.locator('#a11yTtsVoice').locator('option')).toHaveCount(3);

        const results = await new AxeBuilder({ page })
            .include('#a11yPanel')
            .analyze();
        expect(results.violations.map(function (v) {
            return v.id + ': ' + v.nodes[0].target[0];
        })).toEqual([]);
    });
});
