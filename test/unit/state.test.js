import { describe, it, expect } from 'vitest';
import {
    DEFAULTS, createDefaultState, mergeState, resetModuleState,
    serializeState, deserializeState, saveState, loadState,
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
        expect(loadState(adapter, 'unit_test')).toMatchObject({ textScale: 130, hideImages: true });
    });

    it('loads defaults when nothing was stored', function () {
        expect(loadState(createNoopAdapter(), 'missing').textScale).toBe(100);
    });
});
