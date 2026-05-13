/**
 * Storage adapter factory.
 * Allows swapping localStorage with any custom storage implementation.
 *
 * A custom storage adapter must implement:
 *   getItem(key: string): string | null
 *   setItem(key: string, value: string): void
 *   removeItem(key: string): void
 */

/**
 * @typedef {Object} StorageAdapter
 * @property {function(string): string|null} getItem
 * @property {function(string, string): void} setItem
 * @property {function(string): void} removeItem
 */

/**
 * Creates a safe localStorage adapter.
 * Falls back to a no-op if localStorage is unavailable (e.g. private mode).
 * @returns {StorageAdapter}
 */
export function createLocalStorageAdapter() {
    try {
        // Test availability
        const test = '__a11y_test__';
        localStorage.setItem(test, '1');
        localStorage.removeItem(test);
    } catch (_) {
        return createNoopAdapter();
    }

    return {
        getItem(key) {
            try { return localStorage.getItem(key); } catch (_) { return null; }
        },
        setItem(key, value) {
            try { localStorage.setItem(key, value); } catch (_) { /* noop */ }
        },
        removeItem(key) {
            try { localStorage.removeItem(key); } catch (_) { /* noop */ }
        },
    };
}

/**
 * Creates a no-op adapter (state is not persisted).
 * @returns {StorageAdapter}
 */
export function createNoopAdapter() {
    return {
        getItem() { return null; },
        setItem() { /* noop */ },
        removeItem() { /* noop */ },
    };
}

/**
 * Creates a sessionStorage adapter.
 * @returns {StorageAdapter}
 */
export function createSessionStorageAdapter() {
    try {
        const test = '__a11y_test__';
        sessionStorage.setItem(test, '1');
        sessionStorage.removeItem(test);
    } catch (_) {
        return createNoopAdapter();
    }

    return {
        getItem(key) {
            try { return sessionStorage.getItem(key); } catch (_) { return null; }
        },
        setItem(key, value) {
            try { sessionStorage.setItem(key, value); } catch (_) { /* noop */ }
        },
        removeItem(key) {
            try { sessionStorage.removeItem(key); } catch (_) { /* noop */ }
        },
    };
}

/**
 * Validates that a custom adapter has the required interface.
 * @param {any} adapter
 * @returns {boolean}
 */
export function isValidAdapter(adapter) {
    return (
        adapter !== null &&
        typeof adapter === 'object' &&
        typeof adapter.getItem === 'function' &&
        typeof adapter.setItem === 'function' &&
        typeof adapter.removeItem === 'function'
    );
}
