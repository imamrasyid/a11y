# a11y-widget

Modular, framework-agnostic accessibility widget — WCAG 2.1 AA.

Supports contrast modes, text scaling, font/spacing controls, TTS (Text-to-Speech), reading guide, keyboard navigation, and more. Works with any web app — no framework required.

---

## Install

> **Belum dipublish.** Paket ini belum ada di registry npm — scope `a11y-widget`
> belum diklaim, jadi tautan `npm install` dan CDN di bawah baru akan hidup setelah
> org/slug final. Sampai saat itu, pakai hasil build lokal: `npm run build` lalu
> salin `dist/` ke proyekmu (lihat *Plain HTML*).

```bash
npm install @a11y-widget/core
# or
yarn add @a11y-widget/core
```

Or via CDN (UMD — no bundler needed):

```html
<link
  rel="stylesheet"
  href="dist/a11y-widget.css"
/>
<script src="dist/a11y-widget.umd.min.js"></script>
```

---

## Quick start

### With a bundler (Vite, Webpack, Rollup…)

```js
import A11yWidget from "@a11y-widget/core";
import "@a11y-widget/core/css"; // → dist/a11y-widget.css

A11yWidget.init({ lang: "id", position: "bottom-right" });
```

### Plain HTML (script tag)

```html
<link rel="stylesheet" href="dist/a11y-widget.css" />
<script src="dist/a11y-widget.umd.min.js"></script>
<script>
  A11yWidget.init({ lang: "id" });
</script>
```

That's it. The widget mounts a FAB button and accessibility panel into `document.body`.

One instance per page: a second `init()` warns on the console and does nothing.
Call `A11yWidget.destroy()` first if your app tears the widget down between
routes.

### Try it without installing

```bash
npm run build && npm run demo
```

opens a page at `http://127.0.0.1:4173/demo/` that mounts the built UMD bundle
exactly the way a script-tag site does, with buttons that call `setState()` so
you can watch which attribute each control writes.

---

## What this widget is not

It is not a conformance claim. The widget hands visitors controls over how your
page is rendered; WCAG 2.1 AA is still about the page underneath — real headings,
labels on every field, source contrast that already passes, a focus order that
makes sense, and alt text that describes the picture. A panel of switches on top
of markup that fails those things is a workaround, and one a visitor who needs it
has to find.

Concretely: text scaling through this widget reaches 200 %, but it does not
release your site from 1.4.4 *Resize Text* — browser zoom has to keep working on
its own, and text your CSS pins to absolute pixels will not grow here either.

What is verified, in this repository's own test run:

- the widget's panel, FAB and reader controls, scanned by axe-core in four
  contrast modes and in the dark colour scheme, with zero violations;
- the demo/fixture pages the docs point at, scanned the same way;
- contrast token pairs measured at AA ratios for both light and dark surfaces;
- announced state changes, focus return, keyboard operability, and that stopping
  the reader really stops it.

What is not, and cannot be: whether *your* page reads correctly, whether your
alt text is accurate, or whether your own components are keyboard-operable. The
tooling in `package.json` (`lint`, `test`, `test:e2e`, `typecheck`, `size`) is
what covers the widget itself.

A few controls restyle everything on the page, including regions you may not want
touched: `align: "left"` and the highlight switches are sweeps with
`:not()` exclusions for the widget's own UI, but nothing else is exempt. Test
them against your layout before shipping.

---

## Options

```js
A11yWidget.init({
  // localStorage key for persisting user preferences
  storageKey: "my_app_a11y",

  // Older storage keys to adopt once (e.g. from a previous build of this widget).
  // The first key holding a payload is copied to `storageKey` and deleted.
  // Skipped entirely when `storageKey` already has data.
  migrateFrom: ["kebumen_a11y"],

  // Custom storage adapter (must implement getItem/setItem/removeItem)
  storage: sessionStorage,

  // DOM element to mount the widget into
  container: document.getElementById("app"),

  // FAB and panel position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  position: "bottom-right",

  // Locale: 'id' | 'en' | custom strings object
  lang: "id",

  // Base locale for partial string overrides
  baseLang: "id",

  // Locale whose strings are used when `lang` has no string pack of its own.
  // `lang: 'jv'` still selects a Javanese voice; the panel then speaks `baseLang`.
  fallbackLang: "id",

  // Which containers "read page" may read, most specific first. The first list
  // that holds text wins.
  contentSelectors: ["main", "article", "[role=main]"],

  // Subtrees skipped inside those containers — navigation, footers, adverts.
  // An unparsable rule is dropped with a console warning, never fatal.
  excludeSelectors: ["nav", "footer", "[role=banner]", ".iklan"],

  // Pixel size the text-size control multiplies. 'auto' (default) measures
  // getComputedStyle(document.body).fontSize once per init(), falling back to the
  // root size and then to 16px. A number fixes the base without measuring.
  scaleBase: "auto",

  // CSP nonce for the <style> tag the text-size control injects. Needed when your
  // style-src policy trusts only nonced styles. See "Content Security Policy".
  styleNonce: typeof window !== "undefined" ? window.__csp_nonce__ : undefined,

  // Disable specific modules (all enabled by default)
  modules: {
    tts: true,
    cursor: true,
    readingGuide: true,
    contrast: true,
    textScale: true,
    font: true,
    spacing: true,
    align: true,
    underlineLinks: true,
    underlineHeaders: true,
    imgTitles: true,
    highlightFocus: true,
    hideImages: true,
    animations: true,
    keyboard: true,
  },

  // Starting values for a visitor with no stored preferences. A preference the
  // visitor has already saved always wins — changing these in a deploy will not
  // undo what they picked. `tts` merges one level deep.
  defaults: {
    contrast: "none",
    textScale: 100,
    tts: {
      enabled: false,
      // 'selection' speaks whatever the visitor selects with the mouse. Off by
      // default because a screen reader already announces selections.
      autoSpeak: "none",
    },
  },

  // Inject skip-to-content link (default: true)
  skipLink: true,

  // Speak a welcome message on first visit (default: false)
  welcomeMessage: false,
  welcomeText: "Welcome to our website.",

  // Shorthand callback for state changes
  onStateChange(state) {
    console.log("State changed:", state);
  },
});
```

---

## API

### Lifecycle

```js
A11yWidget.init(options); // Initialize the widget
// Remove every node, attribute and injected id the widget created. Listeners
// you registered with on() stay subscribed — remove them with off().
A11yWidget.destroy();
```

### Panel

```js
A11yWidget.open(); // Open the panel
A11yWidget.close(); // Close the panel
A11yWidget.toggle(); // Toggle the panel
A11yWidget.isOpen(); // → boolean
```

### State

```js
// Get a read-only snapshot of the current state
const state = A11yWidget.getState();

// Merge a partial state update (nested keys such as tts merge one level deep)
A11yWidget.setState({ contrast: "reverse", textScale: 120 });
A11yWidget.setState({ tts: { rate: 1.4 } }); // keeps tts.enabled as-is

// Reset all settings to defaults and delete the stored payload
A11yWidget.reset();

// Reset a single module
A11yWidget.resetModule("contrast");
A11yWidget.resetModule("tts");
```

### Events

```js
A11yWidget.on("stateChange", (state) => {
  console.log("New state:", state);
});

A11yWidget.on("open", () => console.log("Panel opened"));
A11yWidget.on("close", () => console.log("Panel closed"));
A11yWidget.on("reset", () => console.log("Settings reset"));
A11yWidget.on("tts:start", () => console.log("TTS started"));
A11yWidget.on("tts:end", () => console.log("TTS ended"));
A11yWidget.on("tts:pause", () => console.log("TTS paused"));
A11yWidget.on("tts:resume", () => console.log("TTS resumed"));
A11yWidget.on("tts:cancel", () => console.log("TTS cancelled"));

A11yWidget.off("stateChange", handler);
```

Available events: `init`, `destroy`, `open`, `close`, `stateChange`, `reset`, `tts:start`, `tts:end`, `tts:pause`, `tts:resume`, `tts:cancel`

### TTS

```js
// Speak a string
A11yWidget.tts.speak('Hello world');
A11yWidget.tts.speak('Hello', { rate: 1.5, lang: 'en' });

// Read the full page
A11yWidget.tts.speakPage();

// Playback control
A11yWidget.tts.pause();
A11yWidget.tts.resume();
A11yWidget.tts.cancel();

// Status
A11yWidget.tts.isPlaying();   // → boolean
A11yWidget.tts.isPaused();    // → boolean
A11yWidget.tts.isSupported(); // → boolean

// Voice management
const voices = A11yWidget.tts.getVoices();
A11yWidget.tts.setVoice(voices[0]);
A11yWidget.tts.setRate(1.2);

// Permission
A11yWidget.tts.grantPermission();
A11yWidget.tts.revokePermission();

// Custom text replacements (e.g. expand abbreviations before speaking)
A11yWidget.tts.addReplacements([
  { search: /\bPT\b/gi, replace: 'Perseroan Terbatas', lang: 'id' },
]);
A11yWidget.tts.setReplacements([...]);  // replace the rules you added
A11yWidget.tts.resetReplacements();     // drop them; built-in and locale rules stay
A11yWidget.tts.getReplacements();       // → ReplacementRule[] (your layer only)
```

The panel's reader section is a full transport — read page, pause, resume, stop —
with a rate slider (0,5×–2,0×), a voice list filled from `getVoices()` and
`voiceschanged`, and a `role="status"` line that says what happened. Transport
buttons are disabled rather than hidden while idle, so the section never changes
height mid-read.

Nothing speaks until the visitor allows it. The first request shows an in-page
prompt whose answer is kept in `sessionStorage`, so a page reload inside one
session does not ask again. If `speechSynthesis` is missing entirely, the reader
section is not rendered at all.

---

## Custom i18n

Pass a full or partial strings object to override any label:

```js
A11yWidget.init({
  lang: {
    panelTitle: "Barrierefreiheit",
    panelReset: "Zurücksetzen",
    sectionContrast: "Farbkontrast",
    // ... only override what you need
  },
  baseLang: "en", // fallback for keys not provided
});
```

`id` and `en` ship complete packs (67 keys each — parity is a unit test), and
every pack carries its own `speechRules`, so `Rp.` or `DPRD` is only ever spoken
where it belongs. A locale code without a pack is still accepted: `lang: 'jv'`
selects a Javanese voice while the panel falls back to `baseLang`, with a
`console.warn` telling you why.

```js
A11yWidget.getAvailableLocales(); // → ['id', 'en']
A11yWidget.DEFAULTS;              // the state a first-time visitor starts from
```

---

## Custom storage

```js
// Use sessionStorage instead of localStorage — anything with the three methods
// is accepted, including the built-in objects themselves.
A11yWidget.init({ storage: sessionStorage });

// Or bring your own adapter (back it with a cookie, IndexedDB, your user API…)
A11yWidget.init({
  storage: {
    getItem: (key) => myStore.get(key) ?? null,
    setItem: (key, value) => myStore.set(key, value),
    removeItem: (key) => myStore.delete(key),
  },
});
```

Internal modules are not exported paths: import `@a11y-widget/core`, the
`/css` subpath, and `/scss`. Deep imports into `src/` are free to change between
minor versions.

---

## CSS

The stylesheet is included in the package and must be loaded separately from the JS.

### With a bundler

```js
import "@a11y-widget/core/css";
// or explicitly:
import "@a11y-widget/core/dist/a11y-widget.css";
```

### Plain HTML

```html
<link rel="stylesheet" href="dist/a11y-widget.css" />
```

### Theming via CSS custom properties

All visual tokens are CSS variables on `:root`. Override any of them after importing the stylesheet:

```css
:root {
  --a11y-primary: #7c3aed; /* purple brand */
  --a11y-primary-dark: #6d28d9;
  --a11y-radius: 8px; /* less rounded */
  --a11y-panel-width: 360px;
  --a11y-z: 9999;
}
```

### Dark mode

This is the widget's own chrome, not your page's theme: the panel, FAB and
prompt follow `prefers-color-scheme: dark`, and you can force it the same way
many sites do — `html[data-theme="dark"]`, `html.dark`, `html.dark-mode` or
`body.dark-mode` all re-point the surface tokens. Setting a contrast mode in the
panel ("Terbalik", "Cerah", "Grayscale") restyles the whole page and is a
different thing.

Every surface token is a custom property, so a theme of your own only has to
override variables:

```css
:root {
  --a11y-bg: #ffffff;
  --a11y-text: #1a1a2e;
  --a11y-accent: #0a58ca; /* used where brand colour carries text */
  --a11y-warn-bg: #fff3cd;
  --a11y-warn-text: #856404;
  --a11y-danger-bg: #fde8e8;
  --a11y-danger-text: #b02531;
}
```

### Text scaling: what grows, and what does not

The control multiplies the page's own sizes; it never names new ones. It writes
`font-size` on `<html>` (so `rem` follows) and on `<body>` (so inherited sizes
and `em` follow), both derived from the base it measured at `init()`, plus
`--a11y-scale-ratio` for a host that drives its own type scale:

```css
.card__title { font-size: calc(1.25rem * var(--a11y-scale-ratio)); }
```

Two consequences are deliberate:

- Text your site pins to an absolute pixel size below `<body>` (`.note {
  font-size: 11px }`) does **not** grow. The old build rewrote `span`, `p`, `li`,
  `td` and every heading level to pixel values of its own choosing to force this;
  that cascade belongs to the host now. Use `rem` for body copy if you want the
  control to reach it.
- The widget's own UI is pinned back to the base size, so the panel does not
  inflate along with the article behind it.

### Content Security Policy

The text-size control injects one `<style>` element — the only stylesheet the
widget ever adds to your `<head>`. Under a `style-src` policy that trusts only
nonced styles, pass the page's nonce and it is set before the element is
inserted (a nonce applied after insertion is ignored by the browser):

```js
A11yWidget.init({ styleNonce: document.querySelector('script[nonce]').nonce });
```

Everything else the widget does goes through attributes and classes on elements
it owns, so it needs no `unsafe-inline` for styles. The widget makes no network
requests and has no runtime dependencies.

### Data attributes reference

The widget sets these attributes on `<html>` — you can target them in your own
CSS for deeper customisation. The last column says who acts: `CSS` means the
attribute alone is styled by the stylesheet, `JS` means a module also writes or
moves nodes for it.

| Attribute                     | Values                              | Reacts    |
| ----------------------------- | ----------------------------------- | --------- |
| `data-a11y-contrast`          | `bright` · `reverse` · `grayscale`  | CSS       |
| `data-a11y-font`              | `readable`                          | CSS       |
| `data-a11y-spacing`           | `wide`                              | CSS       |
| `data-a11y-align`             | `left`                              | CSS       |
| `data-a11y-scale`             | `70`–`200` (numeric)                | JS        |
| `data-a11y-cursor`            | `white` · `black`                   | CSS       |
| `data-a11y-animations`        | `on` · `off`                        | CSS       |
| `data-a11y-underline-links`   | `on`                                | CSS       |
| `data-a11y-underline-headers` | `on`                                | CSS       |
| `data-a11y-img-titles`        | `on`                                | JS        |
| `data-a11y-highlight-focus`   | `on`                                | CSS       |
| `data-a11y-hide-images`       | `on`                                | CSS       |
| `data-a11y-keyboard`          | `on`                                | CSS       |
| `data-a11y-reading-guide`     | `on`                                | JS        |

`data-a11y-img-titles` is the one control that cannot be pure CSS: a loaded
replaced element generates no `::before`/`::after` box in Chromium or Firefox, so
`img::after { content: attr(alt) }` computes a value and paints nothing. The
module inserts a `<span class="a11y-img-caption" aria-hidden="true">` after each
picture with a non-empty alt — `aria-hidden` because the image already announces
that text once — and watches the DOM while the setting is on, so a picture that
arrives later is captioned too. Turning the setting off removes every span it
added.

---

## Build output

```bash
npm install
npm run build
```

| File                     | Format       | Use case                      |
| ------------------------ | ------------ | ----------------------------- |
| `a11y-widget.esm.js`     | ES Module    | Vite, Rollup, modern bundlers |
| `a11y-widget.cjs.js`     | CommonJS     | Node.js, older bundlers       |
| `a11y-widget.umd.js`     | UMD          | Script tag, AMD               |
| `a11y-widget.umd.min.js` | UMD minified | Production CDN                |
| `a11y-widget.css`        | CSS          | All environments              |

Size is checked in CI against a budget (`npm run size`, brotli): the UMD build
and the stylesheet are held under 13 kB and 4 kB respectively, with only a few
percent of headroom over what ships today. Zero runtime dependencies — anything
under `devDependencies` stays out of the bundle.

---

## Development

```bash
npm run lint         # ESLint over src/ and test/
npm test             # Vitest + jsdom
npm run test:e2e     # Playwright + axe-core against test/fixtures and demo/
npm run typecheck    # consumer-side check of types/index.d.ts
npm run size         # budgets above
npm run pack:check   # what would actually ship in the tarball
npm run demo         # static server on 127.0.0.1:4173, prints the demo URL
```

Contributing notes, the conventions a change has to follow, and how to add a
locale are in [CONTRIBUTING.md](CONTRIBUTING.md). Security reports: [SECURITY.md](SECURITY.md).

---

## License

MIT
