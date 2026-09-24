import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../../src/core/eventBus.js';
import { createNoopAdapter, isValidAdapter } from '../../src/core/storage.js';
import { initI18n, getStrings, getSpeechRules, t, getAvailableLocales } from '../../src/i18n/index.js';
import id from '../../src/i18n/id.js';
import en from '../../src/i18n/en.js';

describe('eventBus', function () {
    it('delivers payloads and supports off()', function () {
        const bus = createEventBus();
        const seen = [];
        const handler = function (v) { seen.push(v); };
        bus.on('x', handler);
        bus.emit('x', 1);
        bus.off('x', handler);
        bus.emit('x', 2);
        expect(seen).toEqual([1]);
    });

    it('keeps a throwing handler from breaking the other subscribers', function () {
        const spy = vi.spyOn(console, 'error').mockImplementation(function () { /* noop */ });
        const bus = createEventBus();
        let reached = false;
        bus.on('x', function () { throw new Error('boom'); });
        bus.on('x', function () { reached = true; });
        bus.emit('x');
        expect(reached).toBe(true);
        expect(spy).toHaveBeenCalled();
    });

    it('ignores non-function handlers and unknown events', function () {
        const bus = createEventBus();
        bus.on('x', null);
        expect(function () { bus.emit('nothing-listens'); }).not.toThrow();
    });
});

describe('storage adapters', function () {
    it('validates the adapter interface', function () {
        expect(isValidAdapter(createNoopAdapter())).toBe(true);
        expect(isValidAdapter({ getItem: function () { } })).toBe(false);
        expect(isValidAdapter(null)).toBe(false);
    });

    it('noop adapter silently discards writes', function () {
        const a = createNoopAdapter();
        a.setItem('k', 'v');
        expect(a.getItem('k')).toBeNull();
    });
});

describe('i18n', function () {
    it('keeps the id and en key sets identical', function () {
        expect(Object.keys(en).sort()).toEqual(Object.keys(id).sort());
    });

    it('exposes the built-in locales', function () {
        expect(getAvailableLocales()).toEqual(['id', 'en']);
    });

    it('merges a partial custom strings object over the base locale', function () {
        initI18n({ panelTitle: 'Barrierefreiheit' }, 'en');
        expect(getStrings().panelTitle).toBe('Barrierefreiheit');
        expect(getStrings().panelReset).toBe(en.panelReset);
    });

    it('resolves a known locale code', function () {
        initI18n('en', 'id');
        expect(getStrings()).toBe(en);
    });

    it('says so when a code has no string pack, instead of going quiet', function () {
        const warn = vi.spyOn(console, 'warn').mockImplementation(function () { });
        const used = initI18n('jv', 'id');
        expect(used).toBe('id');
        expect(getStrings()).toBe(id);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain('jv');
        warn.mockRestore();
    });

    it('falls back to the locale the host named, not to Indonesian', function () {
        const warn = vi.spyOn(console, 'warn').mockImplementation(function () { });
        initI18n('jv', 'en');
        expect(t('panelTitle')).toBe(en.panelTitle);
        warn.mockRestore();
    });
});

describe('speech rules', function () {
    it('travel with the locale that needs them', function () {
        expect(getSpeechRules('id').length).toBeGreaterThan(getSpeechRules('en').length);
    });

    it('are empty for a language nothing was written for', function () {
        expect(getSpeechRules('jv')).toEqual([]);
        expect(getSpeechRules(undefined)).toEqual([]);
    });
});
