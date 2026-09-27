import { describe, it, expect, vi } from 'vitest';
import { initI18n, getStrings, getSpeechRules, getAvailableLocales, registerLocale } from '../../src/i18n/index.js';
import { rulesFor, applyReplacements } from '../../src/modules/tts/ttsReplacements.js';
import id from '../../src/i18n/id.js';
import en from '../../src/i18n/en.js';
import jv, { speechRules as jvRules } from '../../src/i18n/jv.js';

// Vitest gives every test file a fresh module graph, so registering locales
// here cannot leak into the `getAvailableLocales()` expectations in core.test.js.
describe('locale registration', function () {
    it('makes a code resolve that the bundle does not carry', function () {
        const warn = vi.spyOn(console, 'warn').mockImplementation(function () { });
        registerLocale('su', { panelTitle: 'Aksesibiliteit' }, []);
        expect(initI18n('su', 'id')).toBe('su');
        expect(getStrings().panelTitle).toBe('Aksesibiliteit');
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('keeps the base language where a registered pack has not translated', function () {
        // The Javanese pack is a scaffold: every key is still ''. Registering it
        // today must produce an Indonesian panel, not an empty one.
        registerLocale('jv', jv, jvRules);
        initI18n('jv', 'id');
        expect(getStrings().panelTitle).toBe(id.panelTitle);
        expect(getStrings().ttsReadPage).toBe(id.ttsReadPage);
    });

    it("speaks with the rules that were registered, not the base locale's", function () {
        registerLocale('jv', jv, [{ search: /&/g, replace: 'lan' }]);
        initI18n('jv', 'id');
        expect(applyReplacements('Kecamatan & Desa', 'jv')).toBe('Kecamatan lan Desa');
        // Indonesian keeps its own expansion for the same text.
        expect(applyReplacements('Kecamatan & Desa', 'id')).toBe('Kecamatan dan Desa');
    });

    it('lists a registered code once, and never drops a bundled one', function () {
        registerLocale('jv', jv, jvRules);
        registerLocale('jv', jv, jvRules);
        const codes = getAvailableLocales();
        expect(codes.filter(function (c) { return c === 'jv'; })).toHaveLength(1);
        expect(codes).toContain('id');
        expect(codes).toContain('en');
    });

    it('lets a host correct a bundled locale without waiting for a release', function () {
        registerLocale('en', { panelReset: 'Clear' }, [{ search: /&/g, replace: 'and' }]);
        expect(initI18n('en', 'id')).toBe('en');
        expect(getStrings().panelReset).toBe('Clear');
        expect(getStrings().panelTitle).toBe(en.panelTitle);
        // The registered rules replace the built-in set for that code — a host
        // narrowing one abbreviation should not be silently adding to it.
        expect(getSpeechRules('en')).toHaveLength(1);
        expect(rulesFor('en').map(function (r) { return r.replace; })).toContain('and');
        // The pack itself is never mutated — another page must still see 'Reset'.
        expect(en.panelReset).toBe('Reset');
    });
});
