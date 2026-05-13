/**
 * TTS highlight module.
 * Handles element-level and word-level highlighting during speech.
 * Uses CSS Custom Highlights API when available, falls back to <mark> injection.
 */

const HIGHLIGHT_CLASS = 'a11y-tts-highlight';
const WORD_MARK_CLASS = 'a11y-tts-word-mark';
const CSS_HIGHLIGHT_KEY = 'a11y-tts-word';

/** @type {Element|null} */
let highlightedEl = null;
/** @type {Range|Element|null} */
let activeWordRange = null;

// ─── Element Highlight ───────────────────────────────────────────────────────

/**
 * Highlights a DOM element as the currently-spoken block.
 * @param {Element} el
 */
export function highlightElement(el) {
    clearHighlight();
    if (!el) { return; }
    el.classList.add(HIGHLIGHT_CLASS);
    highlightedEl = el;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Removes the element-level highlight.
 */
export function clearHighlight() {
    clearWordHighlight();
    if (highlightedEl) {
        highlightedEl.classList.remove(HIGHLIGHT_CLASS);
        highlightedEl = null;
    }
}

// ─── Word Highlight ──────────────────────────────────────────────────────────

/**
 * Highlights a specific word within an element using charIndex/charLength
 * from the SpeechSynthesisUtterance boundary event.
 * @param {Element} el
 * @param {number} charIndex
 * @param {number} charLength
 */
export function highlightWord(el, charIndex, charLength) {
    if (!el || charIndex === undefined) { return; }

    const textNodes = getTextNodes(el);
    let offset = 0;

    for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        const nodeLen = node.textContent.length;

        if (offset + nodeLen > charIndex) {
            const startInNode = charIndex - offset;
            const endInNode = Math.min(startInNode + charLength, nodeLen);

            try {
                const range = document.createRange();
                range.setStart(node, startInNode);
                range.setEnd(node, endInNode);

                clearWordHighlight();

                if (typeof CSS !== 'undefined' && CSS.highlights) {
                    // Modern: CSS Custom Highlights API (no DOM mutation)
                    const highlight = new Highlight(range);
                    CSS.highlights.set(CSS_HIGHLIGHT_KEY, highlight);
                    activeWordRange = range;
                } else {
                    // Fallback: wrap in <mark>
                    const mark = document.createElement('mark');
                    mark.className = WORD_MARK_CLASS;
                    mark.setAttribute('aria-hidden', 'true');
                    try {
                        range.surroundContents(mark);
                        activeWordRange = mark;
                    } catch (_) {
                        // surroundContents fails if range crosses element boundaries — skip
                    }
                }
            } catch (_) {
                // Range creation can fail in edge cases — silently skip
            }
            break;
        }
        offset += nodeLen;
    }
}

/**
 * Removes the word-level highlight.
 */
export function clearWordHighlight() {
    if (typeof CSS !== 'undefined' && CSS.highlights) {
        CSS.highlights.delete(CSS_HIGHLIGHT_KEY);
    }

    // Remove injected <mark> if present
    if (
        activeWordRange &&
        activeWordRange.nodeType === Node.ELEMENT_NODE &&
        activeWordRange.parentNode
    ) {
        const parent = activeWordRange.parentNode;
        while (activeWordRange.firstChild) {
            parent.insertBefore(activeWordRange.firstChild, activeWordRange);
        }
        parent.removeChild(activeWordRange);
    }

    activeWordRange = null;
}

// ─── Internal ────────────────────────────────────────────────────────────────

/**
 * Returns all text nodes within an element.
 * @param {Element} el
 * @returns {Text[]}
 */
function getTextNodes(el) {
    const nodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
        nodes.push(node);
    }
    return nodes;
}
