/**
 * Panel HTML template builder.
 * Generates the accessibility panel markup from i18n strings.
 * All text is sourced from the strings object — no hardcoded copy.
 */

/**
 * Builds the full panel inner HTML.
 * @param {object} s - i18n strings object from getStrings()
 * @param {object} modules - enabled modules map
 * @returns {string}
 */
export function buildPanelHTML(s, modules) {
  const m = modules || {};

  // Build sections array — only include enabled ones
  const sections = [];

  if (m.contrast !== false) {
    sections.push(buildContrastSection(s));
  }
  if (m.textScale !== false) {
    sections.push(buildTextSizeSection(s));
  }
  if (m.font !== false || m.spacing !== false || m.align !== false) {
    sections.push(buildFontSpacingSection(s, m));
  }
  if (m.underlineLinks !== false || m.underlineHeaders !== false ||
    m.imgTitles !== false || m.highlightFocus !== false) {
    sections.push(buildHighlightSection(s, m));
  }
  if (m.cursor !== false || m.readingGuide !== false) {
    sections.push(buildCursorSection(s, m));
  }
  if (m.keyboard !== false || m.animations !== false || m.hideImages !== false) {
    sections.push(buildNavigationSection(s, m));
  }
  if (m.tts !== false) {
    sections.push(buildTTSSection(s));
  }

  // Join with dividers — no trailing divider, no double divider
  const body = sections.join('<div class="a11y-divider" aria-hidden="true"></div>');

  return (
    '<div class="a11y-panel__header">' +
    '<h2 class="a11y-panel__title">' +
    '<svg class="a11y-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">' +
    '<path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1 5h2v6h-2V7zm-4.5 1.5 1.4 1.4A7 7 0 0 0 12 19a7 7 0 0 0 4.1-1.1l1.4-1.4 1.4 1.4A9 9 0 0 1 12 21a9 9 0 0 1-6.9-3.1l1.4-1.4z"/>' +
    '</svg>' +
    esc(s.panelTitle) +
    '</h2>' +
    '<div class="a11y-panel__header-actions">' +
    '<button class="a11y-panel__reset" id="a11yReset" aria-label="' + esc(s.panelReset) + '">' +
    '<svg class="a11y-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">' +
    '<path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/>' +
    '</svg>' +
    esc(s.panelReset) +
    '</button>' +
    '<button class="a11y-panel__close" id="a11yClose" aria-label="' + esc(s.panelClose) + '">' +
    '<svg class="a11y-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">' +
    '<path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>' +
    '</button>' +
    '</div>' +
    '</div>' +
    '<div class="a11y-panel__body">' + body + '</div>' +
    '<div class="a11y-panel__footer">' +
    '<span class="a11y-panel__footer-badge">' + esc(s.footerLabel) + '</span>' +
    '</div>'
  );
}

// ─── Section builders ────────────────────────────────────────────────────────

function buildContrastSection(s) {
  return `
    <div class="a11y-section">
      <div class="a11y-section__label" id="a11y-label-contrast">${esc(s.sectionContrast)}</div>
      <div class="a11y-section__grid" role="group" aria-labelledby="a11y-label-contrast">
        ${buildOptBtn('contrast', 'none', s.contrastNone, '◑', true)}
        ${buildOptBtn('contrast', 'bright', s.contrastBright, '☀')}
        ${buildOptBtn('contrast', 'reverse', s.contrastReverse, '◐')}
        ${buildOptBtn('contrast', 'grayscale', s.contrastGrayscale, '⬛')}
      </div>
    </div>`;
}

function buildTextSizeSection(s) {
  return `
    <div class="a11y-section">
      <div class="a11y-section__label" id="a11y-label-textsize">${esc(s.sectionTextSize)}</div>
      <div class="a11y-textsize" role="group" aria-labelledby="a11y-label-textsize">
        <button class="a11y-textsize__btn" id="a11yTextDec" aria-label="${esc(s.textDecrease)}">T−</button>
        <div class="a11y-textsize__display" id="a11yTextDisplay" aria-live="polite" aria-atomic="true">100%</div>
        <button class="a11y-textsize__btn" id="a11yTextInc" aria-label="${esc(s.textIncrease)}">T+</button>
      </div>
    </div>`;
}

function buildFontSpacingSection(s, m) {
  return `
    <div class="a11y-section">
      <div class="a11y-section__label" id="a11y-label-font">${esc(s.sectionFontSpacing)}</div>
      <div class="a11y-section__list" role="group" aria-labelledby="a11y-label-font">
        ${m.font !== false ? buildToggleRow('font', 'readable', s.fontReadable, iconFont()) : ''}
        ${m.spacing !== false ? buildToggleRow('spacing', 'wide', s.spacingWide, iconSpacing()) : ''}
        ${m.align !== false ? buildToggleRow('align', 'left', s.alignLeft, iconAlign()) : ''}
      </div>
    </div>`;
}

function buildHighlightSection(s, m) {
  return `
    <div class="a11y-section">
      <div class="a11y-section__label" id="a11y-label-highlight">${esc(s.sectionHighlight)}</div>
      <div class="a11y-section__list" role="group" aria-labelledby="a11y-label-highlight">
        ${m.underlineLinks !== false ? buildToggleKey('underlineLinks', s.underlineLinks, iconUnderline()) : ''}
        ${m.underlineHeaders !== false ? buildToggleKey('underlineHeaders', s.underlineHeaders, iconHeading()) : ''}
        ${m.imgTitles !== false ? buildToggleKey('imgTitles', s.imgTitles, iconImage()) : ''}
        ${m.highlightFocus !== false ? buildToggleKey('highlightFocus', s.highlightFocus, iconCursor()) : ''}
      </div>
    </div>`;
}

function buildCursorSection(s, m) {
  const grid = m.cursor !== false
    ? '<div class="a11y-section__grid" role="group" aria-labelledby="a11y-label-cursor">' +
    buildOptBtn('cursor', 'default', s.cursorDefault, '↖', true) +
    buildOptBtn('cursor', 'white', s.cursorWhite, '🖱') +
    buildOptBtn('cursor', 'black', s.cursorBlack, '🖱') +
    '</div>'
    : '';

  const guide = m.readingGuide !== false
    ? '<div class="a11y-section__list" style="margin-top:8px;">' +
    buildToggleKey('readingGuide', s.readingGuide, iconReadingGuide()) +
    '</div>'
    : '';

  return (
    '<div class="a11y-section">' +
    '<div class="a11y-section__label" id="a11y-label-cursor">' + esc(s.sectionCursor) + '</div>' +
    grid +
    guide +
    '</div>'
  );
}

function buildNavigationSection(s, m) {
  return `
    <div class="a11y-section">
      <div class="a11y-section__label" id="a11y-label-nav">${esc(s.sectionNavigation)}</div>
      <div class="a11y-section__list" role="group" aria-labelledby="a11y-label-nav">
        ${m.keyboard !== false ? buildToggleKey('keyboard', s.keyboard, iconKeyboard()) : ''}
        ${m.animations !== false ? buildToggleRow('animations', null, s.animations, iconAnimations()) : ''}
        ${m.hideImages !== false ? buildToggleKey('hideImages', s.hideImages, iconHideImages()) : ''}
      </div>
    </div>`;
}

function buildTTSSection(s) {
  return `
    <div class="a11y-section">
      <div class="a11y-section__label" id="a11y-label-tts">${esc(s.sectionTTS)}</div>
      <div class="a11y-section__list" role="group" aria-labelledby="a11y-label-tts">
        ${buildToggleRow('tts-main', null, s.ttsEnable, iconTTS())}
      </div>
    </div>`;
}

// ─── Component helpers ───────────────────────────────────────────────────────

function buildOptBtn(action, value, label, icon, defaultActive) {
  return `
    <button class="a11y-opt${defaultActive ? ' a11y-opt--active' : ''}"
      data-a11y-action="${esc(action)}"
      data-a11y-value="${esc(value)}"
      aria-pressed="${defaultActive ? 'true' : 'false'}">
      <span class="a11y-opt__icon" aria-hidden="true">${icon}</span>
      <span class="a11y-opt__label">${esc(label)}</span>
    </button>`;
}

function buildToggleRow(action, value, label, iconHtml) {
  const dataValue = value ? ` data-a11y-value="${esc(value)}"` : '';
  return `
    <button class="a11y-toggle-row"
      data-a11y-action="${esc(action)}"${dataValue}
      aria-pressed="false">
      <span class="a11y-toggle-row__left">
        <span class="a11y-toggle-row__icon" aria-hidden="true">${iconHtml}</span>
        ${esc(label)}
      </span>
      <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
    </button>`;
}

function buildToggleKey(key, label, iconHtml) {
  return `
    <button class="a11y-toggle-row"
      data-a11y-action="toggle"
      data-a11y-key="${esc(key)}"
      aria-pressed="false">
      <span class="a11y-toggle-row__left">
        <span class="a11y-toggle-row__icon" aria-hidden="true">${iconHtml}</span>
        ${esc(label)}
      </span>
      <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
    </button>`;
}

// ─── Inline SVG icons ────────────────────────────────────────────────────────

function iconFont() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/></svg>';
}
function iconSpacing() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>';
}
function iconAlign() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>';
}
function iconUnderline() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>';
}
function iconHeading() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M5 4v3h5.5v12h3V7H19V4z"/></svg>';
}
function iconImage() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
}
function iconCursor() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 4.702z"/></svg>';
}
function iconReadingGuide() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M3 9h18v2H3zm0 4h18v2H3z"/></svg>';
}
function iconKeyboard() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 5H5v-2h2v2zm9 0H8v-2h8v2zm0-3h-2v-2h2v2zm0-3h-2V8h2v2zm3 6h-2v-2h2v2zm0-3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>';
}
function iconAnimations() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>';
}
function iconHideImages() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M21 17.2 6.8 3H19c1.1 0 2 .9 2 2v12.2zM3 5.8 17.2 20H5c-1.1 0-2-.9-2-2V5.8zM3 3l18 18-1.4 1.4L1.6 4.4 3 3z"/></svg>';
}
function iconTTS() {
  return '<svg viewBox="0 0 24 24" class="a11y-icon"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
