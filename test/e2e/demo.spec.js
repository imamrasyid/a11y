import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DEMO = '/demo/index.html';

/**
 * The demo is the page a visitor judges the package from, and the snippet most
 * integrators copy. It gets the same treatment as the shipped code: it has to
 * mount without console noise, its own buttons have to reach the DOM, and axe
 * has to like it.
 */
test.beforeEach(async function ({ page }) {
    const noise = [];
    page.on('console', function (message) {
        if (message.type() === 'error' || message.type() === 'warning') { noise.push(message.text()); }
    });
    page.on('pageerror', function (error) { noise.push(String(error)); });
    await page.goto(DEMO);
    await expect(page.locator('#a11yFab')).toBeVisible();
    expect(noise).toEqual([]);
});

test.describe('the demo page', function () {
    test('mounts the panel and the skip link', async function ({ page }) {
        await page.click('#a11yFab');
        await expect(page.locator('#a11yPanel')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('#a11yFab')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.locator('.a11y-skip-link')).toBeVisible();
    });

    test('a setState button moves the attribute, the readout and the table', async function ({ page }) {
        const button = page.locator('[data-demo=\'{"contrast":"reverse"}\']');
        await expect(page.locator('#attrTable')).toContainText('Belum ada');

        await button.click();
        await expect(page.locator('html')).toHaveAttribute('data-a11y-contrast', 'reverse');
        await expect(page.locator('#demoOutput')).toContainText('{"contrast":"reverse"}');
        await expect(page.locator('#attrTable')).toContainText('data-a11y-contrast');
        await expect(page.locator('#attrTable')).toContainText('reverse');

        await page.locator('[data-demo-action="reset"]').click();
        await expect(page.locator('html')).not.toHaveAttribute('data-a11y-contrast');
        await expect(page.locator('#attrTable')).toContainText('Belum ada');
    });

    test('turning the reader on reaches the state that was requested', async function ({ page }) {
        await page.locator('[data-demo=\'{"tts":{"enabled":true}}\']').click();
        expect(await page.evaluate('A11yWidget.getState().tts.enabled')).toBe(true);
    });

    test('the widget does not scale itself with the page', async function ({ page }) {
        const panelBefore = await page.evaluate(() => {
            const target = document.querySelector('.a11y-panel__body') || document.getElementById('a11yPanel');
            return getComputedStyle(target).fontSize;
        });
        await page.locator('[data-demo=\'{"textScale":150}\']').click();
        await expect(page.locator('html')).toHaveAttribute('data-a11y-scale', '150');

        // 15px body -> 23px page text; the panel is pinned back to the size it
        // was authored at.
        expect(await page.evaluate('getComputedStyle(document.body).fontSize')).toBe('23px');
        const panelAfter = await page.evaluate(() => {
            const target = document.querySelector('.a11y-panel__body') || document.getElementById('a11yPanel');
            return getComputedStyle(target).fontSize;
        });
        expect(panelAfter).toBe(panelBefore);
    });

    test('axe finds nothing on the page an integrator copies from', async function ({ page }) {
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(function (v) {
            return v.id + ': ' + v.nodes[0].target[0];
        })).toEqual([]);
    });
});
