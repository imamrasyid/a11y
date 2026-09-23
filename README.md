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
  // undo what they picked.
  defaults: {
    contrast: "none",
    textScale: 100,
    tts: { enabled: false },
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
A11yWidget.tts.setReplacements([...]);  // replace all rules
A11yWidget.tts.resetReplacements();     // back to built-in defaults
A11yWidget.tts.getReplacements();       // → ReplacementRule[]
```

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

---

## Custom storage

```js
// Use sessionStorage instead of localStorage
import { createSessionStorageAdapter } from "@a11y-widget/core/src/core/storage.js";

A11yWidget.init({
  storage: createSessionStorageAdapter(),
});

// Or bring your own adapter
A11yWidget.init({
  storage: {
    getItem: (key) => myStore.get(key),
    setItem: (key, value) => myStore.set(key, value),
    removeItem: (key) => myStore.delete(key),
  },
});
```

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

The stylesheet responds to `prefers-color-scheme: dark` automatically.
You can also force dark mode with a class or attribute on `<html>` or `<body>`:

```html
<html data-theme="dark">
  <!-- or -->
  <body class="dark-mode"></body>
</html>
```

### Data attributes reference

The widget sets these attributes on `<html>` — you can target them in your own CSS for deeper customisation:

| Attribute                     | Values                             |
| ----------------------------- | ---------------------------------- |
| `data-a11y-contrast`          | `bright` · `reverse` · `grayscale` |
| `data-a11y-font`              | `readable`                         |
| `data-a11y-spacing`           | `wide`                             |
| `data-a11y-align`             | `left`                             |
| `data-a11y-scale`             | `70`–`200` (numeric)               |
| `data-a11y-cursor`            | `white` · `black`                  |
| `data-a11y-animations`        | `on` · `off`                       |
| `data-a11y-underline-links`   | `on`                               |
| `data-a11y-underline-headers` | `on`                               |
| `data-a11y-highlight-focus`   | `on`                               |
| `data-a11y-hide-images`       | `on`                               |
| `data-a11y-keyboard`          | `on`                               |
| `data-a11y-reading-guide`     | `on`                               |

---

## Build

```bash
npm install
npm run build
```

Output in `dist/`:

| File                     | Format       | Use case                      |
| ------------------------ | ------------ | ----------------------------- |
| `a11y-widget.esm.js`     | ES Module    | Vite, Rollup, modern bundlers |
| `a11y-widget.cjs.js`     | CommonJS     | Node.js, older bundlers       |
| `a11y-widget.umd.js`     | UMD          | Script tag, AMD               |
| `a11y-widget.umd.min.js` | UMD minified | Production CDN                |
| `a11y-widget.css`        | CSS          | All environments              |

---

## License

MIT
