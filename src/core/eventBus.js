/**
 * Lightweight internal pub/sub event bus.
 * Used for cross-module communication and exposing public events.
 */

/**
 * @typedef {Object} EventBus
 * @property {function(string, function): void} on
 * @property {function(string, function): void} off
 * @property {function(string, ...any): void} emit
 * @property {function(): void} clear
 */

/**
 * Creates a new EventBus instance.
 * @returns {EventBus}
 */
export function createEventBus() {
    /** @type {Map<string, Set<function>>} */
    const listeners = new Map();

    /**
     * Subscribe to an event.
     * @param {string} event
     * @param {function} handler
     */
    function on(event, handler) {
        if (typeof handler !== 'function') { return; }
        if (!listeners.has(event)) { listeners.set(event, new Set()); }
        listeners.get(event).add(handler);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event
     * @param {function} handler
     */
    function off(event, handler) {
        if (!listeners.has(event)) { return; }
        listeners.get(event).delete(handler);
    }

    /**
     * Emit an event with optional payload.
     * @param {string} event
     * @param {...any} args
     */
    function emit(event, ...args) {
        if (!listeners.has(event)) { return; }
        listeners.get(event).forEach(function (handler) {
            try {
                handler(...args);
            } catch (err) {
                // Prevent one bad handler from breaking others
                if (typeof console !== 'undefined') {
                    console.error('[a11y-widget] Event handler error for "' + event + '":', err);
                }
            }
        });
    }

    /**
     * Remove all listeners (used on destroy).
     */
    function clear() {
        listeners.clear();
    }

    return { on, off, emit, clear };
}
