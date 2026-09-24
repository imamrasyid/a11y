import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const FIXTURE = '/test/fixtures/playground.html';

// The panel fades in over 0.22s. Scanning while it is still translucent makes
// axe blend the widget against the page and report colours nobody ever sees.
async function waitForPanelSettle(page) {
    await page.waitForFunction(function () {
        const panel = document.getElementById('a11yPanel');
        return !!panel && getComputedStyle(panel).opacity === '1';
    });
}

test.beforeEach(async function ({ page }) {
    await page.goto(FIXTURE);
    await page.evaluate('window.a11yReady');
});

test.describe('mounting in a real browser', function () {
    test('loads the UMD bundle and mounts the widget', async function ({ page }) {
        await expect(page.locator('#a11yFab')).toBeVisible();
        await expect(page.locator('#a11yPanel')).toBeHidden();
        expect(await page.title()).toContain('a11y-widget');
    });

    test('opens on FAB click and is operable by keyboard', async function ({ page }) {
        await page.click('#a11yFab');
        await expect(page.locator('#a11yPanel')).toBeVisible();
        await expect(page.locator('#a11yPanel')).toHaveAttribute('aria-hidden', 'false');
        await page.keyboard.press('Escape');
        await expect(page.locator('#a11yPanel')).toBeHidden();
        await expect(page.locator('#a11yFab')).toBeFocused();
    });

    test('the skip link appears on the first Tab press', async function ({ page }) {
        await page.keyboard.press('Tab');
        await expect(page.locator('.a11y-skip-link')).toBeVisible();
    });
});

test.describe('state reaches the DOM', function () {
    test('contrast mode repaints the page and excludes the widget', async function ({ page }) {
        await page.click('#a11yFab');
        await page.click('[data-a11y-action="contrast"][data-a11y-value="grayscale"]');
        await expect(page.locator('html')).toHaveAttribute('data-a11y-contrast', 'grayscale');
        const filter = await page.evaluate('getComputedStyle(document.documentElement).filter');
        expect(filter).toContain('grayscale');
        const panelFilter = await page.evaluate('getComputedStyle(document.getElementById("a11yPanel")).filter');
        expect(panelFilter).toBe('none');
    });

    test('text scale at the maximum keeps the panel inside the viewport', async function ({ page }) {
        await page.click('#a11yFab');
        for (let i = 0; i < 12; i++) { await page.click('#a11yTextInc'); }
        await expect(page.locator('html')).toHaveAttribute('data-a11y-scale', '200');
        await expect(page.locator('#a11yTextDisplay')).toHaveText('200%');
        const box = await page.locator('#a11yPanel').boundingBox();
        const viewport = page.viewportSize();
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        await expect(page.locator('.a11y-panel__body')).toBeInViewport();
    });

    test('announces a setting change with the label the panel shows', async function ({ page }) {
        await page.click('#a11yFab');
        await page.click('[data-a11y-action="toggle"][data-a11y-key="hideImages"]');
        await expect(page.locator('.a11y-live-region')).toHaveText('Sembunyikan gambar: aktif');
    });

    test('destroy() leaves no trace', async function ({ page }) {
        await page.click('#a11yFab');
        await expect(page.locator('main')).toHaveAttribute('id', 'a11y-main-content');
        await page.evaluate('A11yWidget.destroy()');
        expect(await page.evaluate(
            'document.querySelectorAll("#a11yFab, #a11yPanel, .a11y-live-region, .a11y-skip-link, .a11y-reading-guide, style[id^=\\"a11y\\"]").length',
        )).toBe(0);
        expect(await page.evaluate('document.querySelector("main").hasAttribute("id")')).toBe(false);
        expect(await page.evaluate(
            '[...document.documentElement.attributes].filter(function (a) { return a.name.indexOf("data-a11y-") === 0; }).length',
        )).toBe(0);
    });
});

test.describe('what the controls paint', function () {
    const fontSize = function (page, selector) {
        return page.evaluate(function (s) {
            return getComputedStyle(document.querySelector(s)).fontSize;
        }, selector);
    };
    const computed = function (page, selector, property) {
        return page.evaluate(function (args) {
            return getComputedStyle(document.querySelector(args[0]))[args[1]];
        }, [selector, property]);
    };
    const caption = function (page, selector) {
        return page.evaluate(function (s) {
            return getComputedStyle(document.querySelector(s), '::after').content;
        }, selector);
    };

    test('text scaling grows the page from the size the site declared', async function ({ page }) {
        // 13px is what the fixture's own stylesheet says — proof the control
        // measured the page instead of assuming a number of its own.
        expect(await fontSize(page, 'article p')).toBe('13px');
        await page.evaluate('A11yWidget.setState({ textScale: 200 })');
        expect(await fontSize(page, 'article p')).toBe('26px');
        // Text the site pinned to an absolute size is left alone: the sweep that
        // rewrote every <span> on the page is gone for good.
        expect(await fontSize(page, '#hostNote')).toBe('11px');
        // And the widget keeps the layout it was authored with at either end.
        expect(await fontSize(page, '.a11y-panel__body')).toBe('13px');
        expect(await fontSize(page, '.a11y-opt__label')).toBe('10.5px');
    });

    test('alt captions are drawn by CSS, including for an image that arrives late', async function ({ page }) {
        await page.evaluate('A11yWidget.setState({ imgTitles: true })');
        expect(await caption(page, 'article img[alt]')).toContain('Gedung pelayanan publik');
        // An empty alt means a decorative image: nothing appears under it.
        expect(await caption(page, 'article img[alt=""]')).toBe('none');

        const before = await page.evaluate('document.querySelector("article").children.length');
        await page.click('#dynamic-add');
        expect(await page.evaluate('document.querySelector("article").children.length')).toBe(before + 1);
        expect(await caption(page, 'article img:last-child')).toContain('Gambar yang disuntikkan setelah render awal');
        // No markup of ours was inserted anywhere, so a screen reader still hears
        // each alt once.
        expect(await page.evaluate('document.querySelectorAll("[class*=a11y-img]").length')).toBe(0);
        // Hiding pictures hides their caption with them — the pseudo-element
        // inherits the visibility of the image it hangs off.
        await page.evaluate('A11yWidget.setState({ hideImages: true })');
        expect(await computed(page, 'article img[alt]', 'visibility')).toBe('hidden');
    });

    test('keyboard mode puts back a focus ring the site switched off', async function ({ page }) {
        await page.evaluate('document.querySelector("#beranda a").focus()');
        expect(await computed(page, '#beranda a', 'outlineStyle')).toBe('none');
        expect(await computed(page, '#beranda a', 'outlineWidth')).toBe('0px');

        await page.evaluate('A11yWidget.setState({ keyboard: true })');
        expect(await computed(page, '#beranda a', 'outlineStyle')).toBe('solid');
        expect(await computed(page, '#beranda a', 'outlineWidth')).toBe('3px');
    });

    test('align-left straightens the page without flattening the centring of the panel', async function ({ page }) {
        expect(await computed(page, '.a11y-textsize__display', 'textAlign')).toBe('center');
        await page.evaluate('A11yWidget.setState({ align: \'left\' })');
        expect(await computed(page, 'article p', 'textAlign')).toBe('left');
        // Undoing the sweep with `text-align: revert` on .a11y-panel * rolled back
        // the widget's own declarations too, so the readout lost its centring.
        expect(await computed(page, '.a11y-textsize__display', 'textAlign')).toBe('center');
        expect(await computed(page, '.a11y-opt', 'textAlign')).toBe('center');
    });

    test('dark mode re-points the panel surfaces', async function ({ page }) {
        await page.click('#a11yFab');
        await waitForPanelSettle(page);
        expect(await computed(page, '#a11yPanel', 'backgroundColor')).toBe('rgb(255, 255, 255)');
        await page.emulateMedia({ colorScheme: 'dark' });
        expect(await computed(page, '#a11yPanel', 'backgroundColor')).toBe('rgb(30, 30, 46)');
        expect(await computed(page, '#a11yPanel', 'color')).toBe('rgb(224, 224, 240)');
        expect(await computed(page, '.a11y-panel__footer-badge', 'color')).toBe('rgb(166, 166, 188)');
        // The dark scheme needs a light accent: #0a58ca on #2a2a3e is 2.2:1.
        expect(await computed(page, '.a11y-panel__title .a11y-icon', 'color')).toBe('rgb(138, 184, 255)');
    });
});

test.describe('accessibility of the widget itself', function () {
    const modes = [
        { name: 'default', contrast: 'none' },
        { name: 'bright', contrast: 'bright' },
        { name: 'reverse', contrast: 'reverse' },
        { name: 'grayscale', contrast: 'grayscale' },
    ];

    for (const mode of modes) {
        test(`panel is clean in ${mode.name} contrast`, async function ({ page }) {
            await page.evaluate('A11yWidget.setState({ contrast: \'' + mode.contrast + '\' })');
            await page.click('#a11yFab');
            await waitForPanelSettle(page);
            const results = await new AxeBuilder({ page })
                .include('#a11yPanel')
                .include('#a11yFab')
                .analyze();
            expect(results.violations.map(function (v) { return v.id + ': ' + v.description })).toEqual([]);
        });
    }

    test('the fixture page itself is free of violations', async function ({ page }) {
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(function (v) { return v.id; })).toEqual([]);
    });
});
