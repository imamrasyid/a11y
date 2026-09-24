import { describe, it, expect, vi } from 'vitest';
import { applyContrast, resetContrast } from '../../src/modules/contrast.js';
import { applyFont, resetFont } from '../../src/modules/font.js';
import { applySpacing, resetSpacing } from '../../src/modules/spacing.js';
import { applyAlign, resetAlign } from '../../src/modules/align.js';
import { applyCursor, resetCursor } from '../../src/modules/cursor.js';
import {
    applyTextScale, clampScale, getScaleBounds, configureTextScale, destroyTextScale,
} from '../../src/modules/textScale.js';
import {
    applyUnderlineLinks, applyKeyboardNav, resetHighlights,
} from '../../src/modules/highlights.js';
import { applyHideImages, applyImgCaptions, resetImages } from '../../src/modules/images.js';
import {
    applyAnimations, resetAnimations, destroyAnimations,
} from '../../src/modules/animations.js';
import { applyReadingGuide, destroyReadingGuide } from '../../src/modules/readingGuide.js';
import { mountAnnouncer, announce, unmountAnnouncer } from '../../src/core/announcer.js';

const html = () => document.documentElement;

describe('attribute-only modules', function () {
    it('contrast sets the value or removes the attribute when none', function () {
        applyContrast('reverse');
        expect(html().getAttribute('data-a11y-contrast')).toBe('reverse');
        resetContrast();
        expect(html().hasAttribute('data-a11y-contrast')).toBe(false);
    });

    it('font, spacing and align use their non-default value as attribute value', function () {
        applyFont('readable');
        applySpacing('wide');
        applyAlign('left');
        expect(html().getAttribute('data-a11y-font')).toBe('readable');
        expect(html().getAttribute('data-a11y-spacing')).toBe('wide');
        expect(html().getAttribute('data-a11y-align')).toBe('left');
        resetFont(); resetSpacing(); resetAlign();
        expect(html().hasAttribute('data-a11y-font')).toBe(false);
        expect(html().hasAttribute('data-a11y-spacing')).toBe(false);
        expect(html().hasAttribute('data-a11y-align')).toBe(false);
    });

    it('boolean highlights toggle an "on" value', function () {
        applyUnderlineLinks(true);
        applyKeyboardNav(true);
        expect(html().getAttribute('data-a11y-underline-links')).toBe('on');
        expect(html().getAttribute('data-a11y-keyboard')).toBe('on');
        resetHighlights();
        expect(html().hasAttribute('data-a11y-underline-links')).toBe(false);
        expect(html().hasAttribute('data-a11y-keyboard')).toBe(false);
    });

    it('cursor supports white and black', function () {
        applyCursor('white');
        expect(html().getAttribute('data-a11y-cursor')).toBe('white');
        resetCursor();
        expect(html().hasAttribute('data-a11y-cursor')).toBe(false);
    });
});

describe('textScale', function () {
    const css = () => document.getElementById('a11y-text-scale').textContent;

    it('clamps to the advertised bounds', function () {
        const { min, max } = getScaleBounds();
        expect(clampScale(0)).toBe(min);
        expect(clampScale(9999)).toBe(max);
        expect(min).toBe(70);
        expect(max).toBe(200);
    });

    it('multiplies the sizes it measured instead of naming its own', function () {
        configureTextScale({ scaleBase: 14 });
        applyTextScale(150);
        expect(html().getAttribute('data-a11y-scale')).toBe('150');
        expect(css()).toContain('--a11y-scale-ratio: 1.5');
        // <html> keeps the root size the page came with (jsdom reports none, so
        // the 16px fallback), <body> the declared base.
        expect(css()).toContain('html[data-a11y-scale] { font-size: 24px !important; }');
        expect(css()).toContain('html[data-a11y-scale] body { font-size: 21px !important; }');
        destroyTextScale();
    });

    it('leaves every host element alone', function () {
        configureTextScale({ scaleBase: 16 });
        applyTextScale(150);
        // The old tag rewrote <span>, <p>, <li>, <td> and each heading level to
        // pixel values of its own choosing; that cascade belongs to the host.
        expect(css()).not.toMatch(/\bspan\b/);
        expect(css()).not.toMatch(/\bh[1-6]\b/);
        expect(css()).not.toMatch(/\bp,|\bli\b|\btd\b|\bth\b/);
        destroyTextScale();
    });

    it('keeps the widget UI at the size the page gave it', function () {
        configureTextScale({ scaleBase: 14 });
        applyTextScale(200);
        expect(css()).toContain(
            'html[data-a11y-scale] .a11y-panel, .a11y-fab, .a11y-tts-prompt, '
            + '.a11y-skip-link { font-size: 14px; }',
        );
        destroyTextScale();
    });

    it('measures once, so the size it just wrote is never scaled again', function () {
        const spy = vi.spyOn(window, 'getComputedStyle');
        configureTextScale({ scaleBase: 'auto' });
        applyTextScale(120);
        applyTextScale(150);
        // Reading <body> twice would feed 120% back into the 150% step, and every
        // click would compound the one before it.
        const read = (el) => spy.mock.calls.filter(function (c) { return c[0] === el; }).length;
        expect(read(document.body)).toBe(1);
        expect(read(document.documentElement)).toBe(1);
        expect(css()).toContain('body { font-size: 24px !important; }');
        spy.mockRestore();
        destroyTextScale();
    });

    it('empties the style tag at 100% instead of leaving an override behind', function () {
        configureTextScale({ scaleBase: 16 });
        applyTextScale(150);
        applyTextScale(100);
        expect(html().hasAttribute('data-a11y-scale')).toBe(false);
        expect(css()).toBe('');
        destroyTextScale();
    });

    it('re-attaches the style tag if the host removed it from head', function () {
        configureTextScale({ scaleBase: 16 });
        applyTextScale(150);
        document.getElementById('a11y-text-scale').remove();
        applyTextScale(180);
        const style = document.getElementById('a11y-text-scale');
        expect(style).not.toBeNull();
        expect(style.textContent).toContain('--a11y-scale-ratio: 1.8');
        destroyTextScale();
    });

    it('carries the CSP nonce onto the tag before it is inserted', function () {
        configureTextScale({ scaleBase: 16, styleNonce: 'r4nd0m' });
        applyTextScale(120);
        const style = document.getElementById('a11y-text-scale');
        expect(style.getAttribute('nonce')).toBe('r4nd0m');
        destroyTextScale();
        configureTextScale({ scaleBase: 16 });
        applyTextScale(120);
        expect(document.getElementById('a11y-text-scale').hasAttribute('nonce')).toBe(false);
        destroyTextScale();
    });

    it('destroy removes the injected element entirely', function () {
        configureTextScale({ scaleBase: 16 });
        applyTextScale(120);
        destroyTextScale();
        expect(document.getElementById('a11y-text-scale')).toBeNull();
        expect(html().hasAttribute('data-a11y-scale')).toBe(false);
    });
});

describe('images', function () {
    function fixture() {
        document.body.innerHTML =
            '<article>'
            + '<img id="a" src="a.png" alt="Gedung pelayanan">'
            + '<img id="b" src="b.png" alt="">'
            + '</article>';
    }

    const captions = () => Array.from(document.querySelectorAll('.a11y-img-caption'));

    it('hides images through the data attribute only', function () {
        applyHideImages(true);
        expect(html().getAttribute('data-a11y-hide-images')).toBe('on');
        applyHideImages(false);
        expect(html().hasAttribute('data-a11y-hide-images')).toBe(false);
    });

    it('puts one caption under each picture that carries alt text', function () {
        fixture();
        applyImgCaptions(true);
        expect(html().getAttribute('data-a11y-img-titles')).toBe('on');
        expect(captions()).toHaveLength(1);
        expect(captions()[0].textContent).toBe('Gedung pelayanan');
        // The alt is announced by the image itself; a screen reader hearing the
        // inserted text too would hear every picture twice.
        expect(captions()[0].getAttribute('aria-hidden')).toBe('true');
        // Direct sibling of the picture, so it stays with it in any layout.
        expect(captions()[0].previousElementSibling.id).toBe('a');
        applyImgCaptions(false);
        expect(html().hasAttribute('data-a11y-img-titles')).toBe(false);
    });

    it('leaves the host markup as it found it once the setting is off', function () {
        fixture();
        applyImgCaptions(true);
        applyImgCaptions(false);
        expect(captions()).toHaveLength(0);
        expect(document.querySelector('article').children).toHaveLength(2);
    });

    it('captions a picture that arrives after the setting was turned on', async function () {
        fixture();
        applyImgCaptions(true);
        const img = document.createElement('img');
        img.src = 'c.png';
        img.alt = 'Gambar yang disuntikkan setelah render awal';
        document.querySelector('article').appendChild(img);
        // A MutationObserver callback is a microtask, so the caption lands after
        // this tick — the reason the module watches instead of scanning once.
        await new Promise(function (resolve) { setTimeout(resolve, 0); });
        expect(captions()).toHaveLength(2);
        expect(captions()[1].textContent).toBe('Gambar yang disuntikkan setelah render awal');
        applyImgCaptions(false);
        expect(captions()).toHaveLength(0);
    });

    it('skips pictures inside the widget and never adds a second caption', function () {
        fixture();
        const panel = document.createElement('div');
        panel.className = 'a11y-panel';
        panel.innerHTML = '<img src="icon.png" alt="Ikon panel">';
        document.body.appendChild(panel);

        applyImgCaptions(true);
        applyImgCaptions(true);
        expect(captions()).toHaveLength(1);
        expect(captions()[0].previousElementSibling.id).toBe('a');
    });

    it('resetImages drops both the attributes and the inserted text', function () {
        fixture();
        applyHideImages(true);
        applyImgCaptions(true);
        resetImages();
        expect(html().hasAttribute('data-a11y-hide-images')).toBe(false);
        expect(html().hasAttribute('data-a11y-img-titles')).toBe(false);
        expect(captions()).toHaveLength(0);
    });
});

describe('animations', function () {
    it('leaves the attribute off until the user explicitly chooses', function () {
        resetAnimations();
        applyAnimations(true, false);
        expect(html().hasAttribute('data-a11y-animations')).toBe(false);
    });

    it('writes "on" only for an explicit enable, and "off" whenever disabled', function () {
        applyAnimations(true, true);
        expect(html().getAttribute('data-a11y-animations')).toBe('on');
        applyAnimations(false, true);
        expect(html().getAttribute('data-a11y-animations')).toBe('off');
        destroyAnimations();
        expect(html().hasAttribute('data-a11y-animations')).toBe(false);
    });

    it('remembers the explicit choice across calls that omit the flag', function () {
        applyAnimations(true, true);
        applyAnimations(false);
        expect(html().getAttribute('data-a11y-animations')).toBe('off');
        applyAnimations(true);
        expect(html().getAttribute('data-a11y-animations')).toBe('on');
        resetAnimations();
    });
});

describe('readingGuide', function () {
    it('mounts lazily, toggles by attribute, and detaches the element on destroy', function () {
        applyReadingGuide(true);
        expect(document.querySelectorAll('.a11y-reading-guide')).toHaveLength(1);
        expect(html().getAttribute('data-a11y-reading-guide')).toBe('on');
        applyReadingGuide(false);
        expect(html().hasAttribute('data-a11y-reading-guide')).toBe(false);
        destroyReadingGuide();
        expect(document.querySelectorAll('.a11y-reading-guide')).toHaveLength(0);
    });
});

describe('announcer', function () {
    it('creates one polite live region and re-announces by clearing first', async function () {
        mountAnnouncer();
        mountAnnouncer();
        const regions = document.querySelectorAll('.a11y-live-region');
        expect(regions).toHaveLength(1);
        expect(regions[0].getAttribute('aria-live')).toBe('polite');

        announce('Kontras: reverse');
        await new Promise(function (r) { setTimeout(r, 80); });
        expect(regions[0].textContent).toBe('Kontras: reverse');

        unmountAnnouncer();
        expect(document.querySelectorAll('.a11y-live-region')).toHaveLength(0);
    });
});
