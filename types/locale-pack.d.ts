/**
 * The shape every file behind `@a11y-widget/core/locales/<code>` has: a locale
 * pack's strings as its default export, and the rules the reader pronounces
 * that language with as a named one.
 *
 * A single declaration covers the whole subpath because the exports map points
 * `./locales/*` at the matching `src/i18n/*.js` — the packs are data, and data
 * that differs only in wording does not need its own type.
 */

import type { A11yStrings, ReplacementRule } from "./index";

declare const strings: Partial<A11yStrings>;
export default strings;

export const speechRules: ReplacementRule[];
