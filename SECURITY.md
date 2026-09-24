# Security policy

## Reporting a problem

> **TODO before publishing:** name a channel you actually monitor. Until then,
> use the repository's private vulnerability reporting (the "Report a
> vulnerability" form on the Security tab) so the report is not public. Do not
> open a normal issue for anything exploitable.

Tell us what page configuration triggers it and what the widget is configured
with (`init()` options, and whether a CSP is set). Expect an acknowledgement as
fast as whoever maintains this is able — this package has no service-level
commitment yet, and that is worth knowing before you depend on it.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | yes       |
| < 1.0   | no — the single-file legacy widget is being retired |

## What the code touches

Understanding the surface is usually enough to rule most of this out:

- **No network access.** The runtime has zero dependencies, builds no URLs, and
  sends nothing. Nothing is fetched at runtime, including fonts and icons — the
  icons are inline SVG and the cursor images are `data:` URIs in the stylesheet.
- **Storage.** Visitor choices live under one `localStorage` key
  (`a11y_widget`, or your `storageKey`), and the reader's per-session permission
  under one `sessionStorage` key (`a11y_tts_allowed`). A custom `storage`
  adapter is your code: whatever it does with the payload is your boundary, and
  the payload is a JSON string of small setting values, not page content.
- **DOM writes.** The widget's own nodes are built with `innerHTML` from strings
  that come from the compiled panel template and the active string pack, so a
  string pack is HTML-authoring context: never build one from visitor input.
  Everything that arrives from outside the page — operating-system voice names,
  page text in the reader status line, state labels — is written with
  `textContent`.
- **`contentSelectors` / `excludeSelectors`.** These are passed to
  `querySelectorAll`, so they are CSS, not HTML: no markup is parsed and no
  script is reachable through them. They are still integration-time
  configuration and belong to whoever calls `init()`, not to a visitor. An
  unparsable rule is dropped with a console warning.
- **Text-to-speech.** Speech only starts after the visitor allows it, and the
  allow choice is per session. Text goes to `speechSynthesis`, which is the
  browser's own API: depending on browser and voice, some operating-system
  voices synthesise outside the browser. If that matters on your site, ship with
  `modules: { tts: false }`.
- **CSP.** One `<style>` element is injected by the text-size control. Under a
  `style-src` policy that trusts only nonced styles, pass `styleNonce` — the
  nonce is set before the element is inserted, which is the only order a browser
  respects.

## A note on what this package cannot make safe

An accessibility widget changes how a page is rendered for a visitor. Controls
that sweep the whole document — contrast modes, `align: "left"`, hiding images —
can visibly break a layout that depended on the styling they override. That is a
correctness risk you should test for, not a vulnerability, and it is why the demo
page exists: run your own content through every switch before deploying.
