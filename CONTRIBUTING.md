# Contributing

Setup, the rules a change has to follow, and how to verify it here.

## Get running

```bash
nvm use                 # Node version comes from .nvmrc
npm ci
npm run build           # dist/ is not committed; build before running anything
npm run demo            # http://127.0.0.1:4173/demo/
```

There is no watch mode for the demo page — `npm run build:watch` rebuilds both
bundles, then reload the tab.

## Gates

All of these run in CI (`.github/workflows/ci.yml`) and must pass locally before
a branch is offered:

| Command              | What it protects                                           |
| -------------------- | ---------------------------------------------------------- |
| `npm run lint`       | style of `src/` and `test/` (warnings allowed, errors not)  |
| `npm test`           | unit + integration under jsdom                              |
| `npm run test:e2e`   | Playwright + axe-core against `test/fixtures` and `demo/`   |
| `npm run typecheck`  | `types/index.d.ts` checked from a consumer's side           |
| `npm run size`       | brotli budgets for the UMD bundle and the stylesheet         |
| `npm run pack:check` | the file list that would actually ship                      |

## The two-layer contract

JS modules set and remove `data-a11y-*` attributes on `<html>`; `_modifiers.scss`
turns them into pixels. Keep it that way: a new control should be an attribute
plus a CSS rule, not a stylesheet written from JS. Only four things are allowed to
insert nodes outside the panel, because they cannot work any other way:

- the text-size `<style>` tag (`modules/textScale.js`),
- the reading-guide element,
- the ARIA live region / announcer,
- panel, FAB, skip link and the TTS prompt and status line.

If a change adds a fifth, say so in the commit body — the point of the list is
that it stays short.

The image captions are the exception that was already allowed to grow: a loaded
replaced element generates no `::before`/`::after` box, so "show alt text" cannot
be drawn by CSS and `modules/images.js` inserts a span per picture — with
`aria-hidden`, because the image announces the alt once already, and with a
MutationObserver so late pictures are captioned too. Do not "simplify" it back to
a pseudo-element: the computed style will keep reporting the text while the
screen shows nothing.

## Dark mode is only alive where a rule reads a variable

`_dark.scss` re-points custom properties through `@include dark-surface`; it never
repeats selectors. A component rule that hardcodes an SCSS hex therefore keeps
rendering the light palette in dark mode, and nothing fails loudly — it just looks
wrong. Surface rules must use `var(--a11y-bg)`, `var(--a11y-text)`,
`var(--a11y-danger-text)` and so on. The exceptions are legitimate: `rgba()` and
mixin arguments cannot take a `var()`, so shadows and the reading-guide tint stay
SCSS.

## Contrast is measured, not eyeballed

Every token pair that carries text is checked against the surface it actually sits
on, at the size it renders at. AA is 4.5:1 for normal text and 3:1 for large text;
a pair landing on 4.50 exactly counts as fragile and should move. When you change
a token, re-run the axe scans (`npm run test:e2e`) — the panel is scanned in four
contrast modes and in the dark colour scheme.

## Adding a locale

- Keys must match the `id` pack exactly; the i18n cases in
  `test/unit/core.test.js` fail on a missing or extra key, so add the strings to
  every pack in one change.
- Only `id` and `en` are imported by `src/i18n/index.js`, and that import is what
  puts a language into the bundle. A new pack is therefore a file a host pulls in
  itself and hands to `registerLocale()` — adding a language must never make the
  widget heavier for the sites that did not ask for it.
- A key left as `''` means "not translated yet", and the resolver keeps the base
  locale's wording for it. That is what lets an unfinished pack be useful: fill
  what a reviewer has signed off on, leave the rest empty, and the panel degrades
  one key at a time instead of going blank.
- Speech normalisation belongs to the locale: `speechRules` in the pack holds the
  abbreviations and symbols that language reads differently (`Rp.`, `Kab.`, `&`).
  `UNIVERSAL_REPLACEMENTS` is for symbols that behave the same everywhere.
- A locale can ship voice selection without panel strings: pass its code through
  `lang`, let `baseLang`/`fallbackLang` supply the text, and leave a
  `console.warn` explaining the fallback. `src/i18n/jv.js` is both this case and
  the review worksheet for it — every value empty, every key annotated with the
  Indonesian it has to match. Reviewers delete that annotation as they confirm a
  key, so a key still carrying it is a key nobody has signed off on.
- Do not commit machine translations of a language you do not speak. A translation
  needs a native reviewer; an unreviewed pack is worse than a fallback, because it
  looks finished.

## Tests worth keeping

- Assert what a browser paints, not what a string contains. jsdom reports no
  layout, so a computed size or a rendered caption has to be checked in Chromium
  (`test/e2e/*.spec.js`); jsdom tests cover attributes, state and injected CSS text.
- No counts of unrelated things. `expect(spy).toHaveBeenCalledTimes(2)` broke the
  first time an implementation detail changed — filter the calls by what you
  actually care about instead.
- Wait for the panel to settle before measuring or scanning it: it fades in over
  0.22 s, and axe mid-fade blends the widget against the page and reports colours
  nobody ever sees.
- Headless Chromium has `speechSynthesis` but no voices and fires no events. Use
  `test/unit/speechStub.js` (or the e2e init-script equivalent) and let the test
  decide when an utterance starts and ends. No timers, no guessed durations.
- The text-size control measures its base **once** per `init()`. A test that calls
  `applyTextScale()` twice and re-measures will compound the scale; if you touch
  that module, keep the "measures once" case honest.

## House style

- Code comments and identifiers in English; commit messages in Bahasa Indonesia,
  imperative subject (`fix: ...`, `feat: ...`) plus a body of short bullets saying
  what changed and why.
- One commit per milestone, and nothing gets pushed without being asked.
- ASCII apostrophes in source and test names (`'`), not typographic ones (`’`):
  a curly quote in a test title makes it ungreppable and turns a simple search
  into a debugging session.
- A change to the public surface lands in three files together: `src/index.js`,
  `types/index.d.ts` and the README; `CHANGELOG.md` gets an entry under
  `[Unreleased]`.

## Before this package can be published

Tracked at the bottom of `CHANGELOG.md`. Short version: the npm org has to be
created, `author` and `repository.url` in `package.json` are deliberate `TODO`
placeholders, and the README's install/CDN lines stay marked "belum dipublish"
until a real registry entry exists. Do not fill those in with invented values.
