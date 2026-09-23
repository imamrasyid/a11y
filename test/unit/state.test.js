import { describe, it, expect } from 'vitest';
import {
    DEFAULTS, createDefaultState, mergeState, resetModuleState,
    serializeState, deserializeState, sanitizeState, saveState,
    loadStoredPatch, migrateState,
} from '../../src/core/state.js';
import { createNoopAdapter, createLocalStorageAdapter } from '../../src/core/storage.js';

describe('createDefaultState', function () {
    it('returns a fresh copy that cannot mutate the frozen DEFAULTS', function () {
        const s = createDefaultState();
        s.tts.rate = 3;
        s.contrast = 'reverse';
        expect(DEFAULTS.tts.rate).toBe(1);
        expect(DEFAULTS.contrast).toBe('none');
    });

    it('applies overrides on top of the defaults', function () {
        const s = createDefaultState({ contrast: 'grayscale', tts: { rate: 1.5 } });
        expect(s.contrast).toBe('grayscale');
        expect(s.tts).toEqual({ enabled: true, rate: 1.5, voice: null });
    });
});

describe('mergeState', function () {
    it('keeps untouched keys and merges nested tts one level deep', function () {
        const next = mergeState(createDefaultState(), { tts: { enabled: false } });
        expect(next.tts.enabled).toBe(false);
        expect(next.tts.rate).toBe(1);
    });

    it('never returns the same object reference', function () {
        const current = createDefaultState();
        expect(mergeState(current, { font: 'readable' })).not.toBe(current);
    });
});

describe('resetModuleState', function () {
    it('restores a scalar key', function () {
        const s = resetModuleState(mergeState(createDefaultState(), { align: 'left' }), 'align');
        expect(s.align).toBe('default');
    });

    it('restores a nested key without sharing the frozen default object', function () {
        const s = resetModuleState(mergeState(createDefaultState(), { tts: { rate: 9 } }), 'tts');
        expect(s.tts.rate).toBe(1);
        expect(s.tts).not.toBe(DEFAULTS.tts);
    });

    it('leaves unrelated keys alone', function () {
        const s = resetModuleState(mergeState(createDefaultState(), { font: 'readable' }), 'align');
        expect(s.font).toBe('readable');
    });
});

describe('serialization', function () {
    it('drops the non-serializable voice object', function () {
        const raw = serializeState(mergeState(createDefaultState(), { tts: { voice: { name: 'id' } } }));
        expect(JSON.parse(raw).tts.voice).toBeNull();
    });

    it('falls back to defaults for unparsable payloads', function () {
        expect(deserializeState('{not json').contrast).toBe('none');
    });

    it('loads stored values on top of the defaults', function () {
        const s = deserializeState('{"contrast":"bright"}');
        expect(s.contrast).toBe('bright');
        expect(s.font).toBe('default');
    });

    it('survives a round trip through storage', function () {
        const state = mergeState(createDefaultState(), { textScale: 130, hideImages: true });
        const adapter = createLocalStorageAdapter();
        saveState(state, adapter, 'unit_test');
        expect(loadStoredPatch(adapter, 'unit_test')).toMatchObject({ textScale: 130, hideImages: true });
    });

    it('reports nothing stored as null, not as defaults', function () {
        expect(loadStoredPatch(createNoopAdapter(), 'missing')).toBeNull();
    });

    it('persists the explicit animations choice', function () {
        const adapter = createLocalStorageAdapter();
        saveState(mergeState(createDefaultState(), { animations: true, animationsExplicit: true }), adapter, 'unit_test');
        expect(loadStoredPatch(adapter, 'unit_test').animationsExplicit).toBe(true);
    });

    it('ignores a payload it cannot parse', function () {
        const adapter = {
            getItem: function () { return '}}broken'; },
            setItem: function () { /* noop */ },
            removeItem: function () { /* noop */ },
        };
        expect(loadStoredPatch(adapter, 'unit_test')).toBeNull();
    });
});

describe('sanitizeState', function () {
    it('drops keys this version does not know', function () {
        const clean = sanitizeState({ contrast: 'bright, tapi salah', buatan: 'x' });
        expect(clean).not.toHaveProperty('buatan');
    });

    it('drops out-of-range enum values instead of trusting storage', function () {
        expect(sanitizeState({ contrast: 'neon' })).toEqual({});
        expect(sanitizeState({ cursor: '<script>' })).toEqual({});
        expect(sanitizeState({ hideImages: 'yes' })).toEqual({});
        expect(sanitizeState({ textScale: 'besar' })).toEqual({});
    });

    it('keeps values that are valid', function () {
        expect(sanitizeState({ contrast: 'reverse', textScale: 150, keyboard: true }))
            .toEqual({ contrast: 'reverse', textScale: 150, keyboard: true });
    });

    it('keeps only the recognised tts subkeys', function () {
        const clean = sanitizeState({ tts: { enabled: false, rate: 1.4, voice: { name: 'x' }, bogus: 1 } });
        expect(clean.tts).toEqual({ enabled: false, rate: 1.4 });
    });

    it('tolerates non-object payloads', function () {
        expect(sanitizeState(null)).toEqual({});
        expect(sanitizeState(['contrast'])).toEqual({});
        expect(sanitizeState('kontras')).toEqual({});
    });
});

describe('migrateState', function () {
    function memStore() {
        const data = {};
        return {
            getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
            setItem: function (k, v) { data[k] = v; },
            removeItem: function (k) { delete data[k]; },
            data: data,
        };
    }

    it('copies a legacy payload onto the current key and deletes the old one', function () {
        const store = memStore();
        store.setItem('kebumen_a11y', JSON.stringify({ contrast: 'grayscale', textScale: 120 }));

        const migrated = migrateState(store, 'a11y_widget', ['kebumen_a11y']);

        expect(migrated).toMatchObject({ contrast: 'grayscale', textScale: 120 });
        expect(store.data.kebumen_a11y).toBeUndefined();
        expect(JSON.parse(store.data.a11y_widget)).toMatchObject({ contrast: 'grayscale', textScale: 120 });
    });

    it('treats a legacy animations value as an explicit choice', function () {
        const store = memStore();
        store.setItem('legacy', JSON.stringify({ animations: true }));
        expect(migrateState(store, 'now', ['legacy']).animationsExplicit).toBe(true);
    });

    it('never overwrites a payload that already exists', function () {
        const store = memStore();
        store.setItem('legacy', JSON.stringify({ contrast: 'grayscale' }));
        store.setItem('now', JSON.stringify({ contrast: 'bright' }));

        expect(migrateState(store, 'now', ['legacy'])).toBeNull();
        expect(store.data.legacy).toBeTruthy();
        expect(JSON.parse(store.data.now).contrast).toBe('bright');
    });

    it('returns null when no legacy key holds anything usable', function () {
        const store = memStore();
        store.setItem('legacy', 'bukan json');
        expect(migrateState(store, 'now', ['legacy', 'tidak-ada'])).toBeNull();
        expect(store.data.now).toBeUndefined();
    });

    it('does nothing without a legacy key list', function () {
        expect(migrateState(memStore(), 'now', [])).toBeNull();
        expect(migrateState(memStore(), 'now', undefined)).toBeNull();
    });
});
