import { describe, it, expect } from 'vitest';
import { applyContrast, resetContrast } from '../../src/modules/contrast.js';
import { applyFont, resetFont } from '../../src/modules/font.js';
import { applySpacing, resetSpacing } from '../../src/modules/spacing.js';
import { applyAlign, resetAlign } from '../../src/modules/align.js';
import { applyCursor, resetCursor } from '../../src/modules/cursor.js';
import {
    applyTextScale, clampScale, getScaleBounds, destroyTextScale,
} from '../../src/modules/textScale.js';
import {
    applyUnderlineLinks, applyKeyboardNav, resetHighlights,
} from '../../src/modules/highlights.js';
import { applyHideImages, applyImgCaptions, destroyImages } from '../../src/modules/images.js';
import {
    applyAnimations, resetAnimations, setUserExplicit, destroyAnimations,
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
    it('clamps to the advertised bounds', function () {
        const { min, max } = getScaleBounds();
        expect(clampScale(0)).toBe(min);
        expect(clampScale(9999)).toBe(max);
        expect(min).toBe(70);
        expect(max).toBe(200);
    });

    it('writes a scaled style tag and the data attribute', function () {
        applyTextScale(150);
        expect(html().getAttribute('data-a11y-scale')).toBe('150');
        const style = document.getElementById('a11y-text-scale');
        expect(style.textContent).toContain('--a11y-scale-ratio: 1.5');
        expect(style.textContent).toContain('24px');
    });

    it('empties the style tag at 100% instead of leaving an override behind', function () {
        applyTextScale(150);
        applyTextScale(100);
        expect(html().hasAttribute('data-a11y-scale')).toBe(false);
        expect(document.getElementById('a11y-text-scale').textContent).toBe('');
    });

    it('re-attaches the style tag if the host removed it from head', function () {
        applyTextScale(150);
        document.getElementById('a11y-text-scale').remove();
        applyTextScale(180);
        const style = document.getElementById('a11y-text-scale');
        expect(style).not.toBeNull();
        expect(style.textContent).toContain('--a11y-scale-ratio: 1.8');
    });

    it('destroy removes the injected element entirely', function () {
        applyTextScale(120);
        destroyTextScale();
        expect(document.getElementById('a11y-text-scale')).toBeNull();
        expect(html().hasAttribute('data-a11y-scale')).toBe(false);
    });
});

describe('images', function () {
    function fixture() {
        document.body.innerHTML =
            '<article><img src="a.png" alt="Gedung pelayanan"><img src="b.png" alt=""></article>';
    }

    it('hides images through the data attribute only', function () {
        applyHideImages(true);
        expect(html().getAttribute('data-a11y-hide-images')).toBe('on');
        applyHideImages(false);
        expect(html().hasAttribute('data-a11y-hide-images')).toBe(false);
    });

    it('injects a caption per non-empty alt and removes it again', function () {
        fixture();
        applyImgCaptions(true);
        expect(document.querySelectorAll('.a11y-img-caption')).toHaveLength(1);
        expect(html().getAttribute('data-a11y-img-titles')).toBe('on');
        applyImgCaptions(false);
        expect(document.querySelectorAll('.a11y-img-caption')).toHaveLength(0);
        expect(html().hasAttribute('data-a11y-img-titles')).toBe(false);
    });

    it('is idempotent when toggled twice', function () {
        fixture();
        applyImgCaptions(true);
        applyImgCaptions(true);
        expect(document.querySelectorAll('.a11y-img-caption')).toHaveLength(1);
    });

    it('destroy sweeps captions even when the flag is already off', function () {
        fixture();
        applyImgCaptions(true);
        applyImgCaptions(false);
        document.body.querySelector('article').insertAdjacentHTML(
            'beforeend', '<span class="a11y-img-caption">sisa</span>',
        );
        destroyImages();
        expect(document.querySelectorAll('.a11y-img-caption')).toHaveLength(0);
    });
});

describe('animations', function () {
    it('leaves the attribute off until the user explicitly chooses', function () {
        resetAnimations();
        applyAnimations(true);
        expect(html().hasAttribute('data-a11y-animations')).toBe(false);
    });

    it('writes "on" only for an explicit enable, and "off" whenever disabled', function () {
        setUserExplicit(true);
        applyAnimations(true);
        expect(html().getAttribute('data-a11y-animations')).toBe('on');
        applyAnimations(false);
        expect(html().getAttribute('data-a11y-animations')).toBe('off');
        destroyAnimations();
        expect(html().hasAttribute('data-a11y-animations')).toBe(false);
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
