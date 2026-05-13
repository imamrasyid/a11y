/**
 * Animations module.
 * Sets data attributes on <html> only.
 * All CSS rules live in _modifiers.scss — no style injection here.
 *
 * Attribute hierarchy (low → high):
 *   (no attribute)                    → OS prefers-reduced-motion applies naturally
 *   data-a11y-animations="off"        → user explicitly disabled
 *   data-a11y-animations="on"         → user explicitly enabled (overrides OS)
 */

/**
 * Tracks whether the user has explicitly changed this setting.
 * When false, no attribute is set so OS preference applies naturally.
 * @type {boolean}
 */
let userExplicit = false;

/**
 * Applies the animations setting.
 * @param {boolean} enabled
 * @param {boolean} [explicit] - Pass true when triggered by user interaction.
 */
export function applyAnimations(enabled, explicit) {
    const html = document.documentElement;

    if (explicit !== undefined) {
        userExplicit = explicit;
    }

    if (enabled) {
        if (userExplicit) {
            html.setAttribute('data-a11y-animations', 'on');
        } else {
            // Default state — remove attribute, let OS preference apply naturally
            html.removeAttribute('data-a11y-animations');
        }
    } else {
        html.setAttribute('data-a11y-animations', 'off');
    }
}

/**
 * Resets to default state — removes attribute so OS preference applies.
 */
export function resetAnimations() {
    userExplicit = false;
    document.documentElement.removeAttribute('data-a11y-animations');
}

/** @returns {boolean} */
export function isUserExplicit() {
    return userExplicit;
}

/**
 * Restores the userExplicit flag (used when loading persisted state).
 * @param {boolean} value
 */
export function setUserExplicit(value) {
    userExplicit = value;
}

/**
 * Alias kept for lifecycle symmetry with other modules.
 */
export function destroyAnimations() {
    resetAnimations();
}
