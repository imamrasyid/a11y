import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const FIXTURE = '/test/fixtures/playground.html';

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
