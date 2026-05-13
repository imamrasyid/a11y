/**
 * A11y Widget — Pemerintah Kabupaten Kebumen
 * Aksesibilitas WCAG 2.1 AA
 * Konsisten dengan konvensi: assets/main/assets/js/
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'kebumen_a11y';
  const HTML = document.documentElement;

  const DEFAULTS = {
    contrast: 'none',
    textScale: 100,
    font: 'default',
    spacing: 'normal',
    align: 'default',
    underlineLinks: false,
    underlineHeaders: false,
    imgTitles: false,
    highlightFocus: false,
    hideImages: false,
    animations: true,
    cursor: 'default',
    readingGuide: false,
    keyboard: false,
    tts: {
      enabled: true,
      rate: 1.0,
      voice: null,
    },
  };

  let state = Object.assign({}, DEFAULTS);

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign({}, DEFAULTS, parsed);
        state.tts = Object.assign({}, DEFAULTS.tts, parsed.tts || {});
        // Kalau user pernah menyimpan state animations (apapun nilainya),
        // berarti pernah eksplisit memilih — tandai agar applyAnimations tahu
        if (parsed.animations !== undefined) {
          _animationsUserExplicit = true;
        }
      }
    } catch (_) { }
  }

  function applyState() {
    const s = state;

    if (s.contrast === 'none') HTML.removeAttribute('data-a11y-contrast');
    else HTML.setAttribute('data-a11y-contrast', s.contrast);

    applyTextScale(s.textScale);

    if (s.font === 'default') HTML.removeAttribute('data-a11y-font');
    else HTML.setAttribute('data-a11y-font', s.font);

    if (s.spacing === 'normal') HTML.removeAttribute('data-a11y-spacing');
    else HTML.setAttribute('data-a11y-spacing', s.spacing);

    if (s.align === 'default') HTML.removeAttribute('data-a11y-align');
    else HTML.setAttribute('data-a11y-align', s.align);

    setAttr('data-a11y-underline-links', s.underlineLinks);
    setAttr('data-a11y-underline-headers', s.underlineHeaders);
    setAttr('data-a11y-img-titles', s.imgTitles);
    setAttr('data-a11y-highlight-focus', s.highlightFocus);
    setAttr('data-a11y-hide-images', s.hideImages);
    setAttr('data-a11y-reading-guide', s.readingGuide);
    setAttr('data-a11y-keyboard', s.keyboard);

    applyAnimations(s.animations);

    if (s.cursor === 'default') HTML.removeAttribute('data-a11y-cursor');
    else HTML.setAttribute('data-a11y-cursor', s.cursor);

    applyImgCaptions(s.imgTitles);

    applyHighlightFocus(s.highlightFocus);

    applyKeyboardNav(s.keyboard);

    applyAlignLeft(s.align === 'left');

    applyTTSState();

    syncUI();
  }

  function setAttr(attr, bool) {
    if (bool) HTML.setAttribute(attr, 'on');
    else HTML.removeAttribute(attr);
  }

  let textScaleStyleEl = null;

  function applyTextScale(scale) {
    if (!textScaleStyleEl) {
      textScaleStyleEl = document.createElement('style');
      textScaleStyleEl.id = 'a11y-text-scale';
      document.head.appendChild(textScaleStyleEl);
    }

    if (scale === 100) {
      textScaleStyleEl.textContent = '';
      return;
    }

    const r = scale / 100;

    textScaleStyleEl.textContent = `
      :root {
        --fontSize: ${Math.round(14 * r)}px !important;
        --fontSizeSmall: ${Math.round(12 * r)}px !important;
        --fontSizeLarge: ${Math.round(16 * r)}px !important;
        --card-title-fontSize: ${Math.round(22 * r)}px !important;
        --h1: ${Math.round(40 * r)}px !important;
        --h2: ${Math.round(32 * r)}px !important;
        --h3: ${Math.round(26 * r)}px !important;
        --h4: ${Math.round(20 * r)}px !important;
        --h5: ${Math.round(18 * r)}px !important;
        --h6: ${Math.round(16 * r)}px !important;
      }
      /* Elemen yang pakai px hardcoded langsung */
      html[data-a11y-scale] p,
      html[data-a11y-scale] li,
      html[data-a11y-scale] td,
      html[data-a11y-scale] th,
      html[data-a11y-scale] span:not(.a11y-opt__icon):not(.a11y-opt__label):not(.a11y-toggle-row__icon) {
        font-size: ${Math.round(14 * r)}px !important;
      }
      html[data-a11y-scale] h1 { font-size: ${Math.round(40 * r)}px !important; }
      html[data-a11y-scale] h2 { font-size: ${Math.round(32 * r)}px !important; }
      html[data-a11y-scale] h3 { font-size: ${Math.round(26 * r)}px !important; }
      html[data-a11y-scale] h4 { font-size: ${Math.round(20 * r)}px !important; }
      html[data-a11y-scale] h5 { font-size: ${Math.round(18 * r)}px !important; }
      html[data-a11y-scale] h6 { font-size: ${Math.round(16 * r)}px !important; }
      html[data-a11y-scale] .nav-link,
      html[data-a11y-scale] .main-nav nav .navbar-nav .nav-item a { font-size: ${Math.round(13 * r)}px !important; }
      html[data-a11y-scale] .news-card-title,
      html[data-a11y-scale] .card-title { font-size: ${Math.round(22 * r)}px !important; }
      html[data-a11y-scale] a { font-size: inherit; }
    `;

    if (scale !== 100) HTML.setAttribute('data-a11y-scale', scale);
    else HTML.removeAttribute('data-a11y-scale');
  }

  /* ── Animations ──────────────────────────────────────────────────────────────
   * Opsi D: dua attribute eksplisit di <html>
   *
   *   data-a11y-animations="off"  → user matikan animasi via panel
   *   data-a11y-animations="on"   → user aktifkan animasi via panel (override OS)
   *   (tidak ada attribute)       → state default, OS prefers-reduced-motion berlaku
   *
   * Hierarki prioritas (dari rendah ke tinggi):
   *   1. CSS animasi normal (wave, AOS, dll)
   *   2. @media prefers-reduced-motion: reduce  → pause wave (OS preference)
   *   3. html[data-a11y-animations="off"] *     → pause semua (user pilih off)
   *   4. html[data-a11y-animations="on"] .wave  → running !important (user pilih on)
   *
   * "on" hanya di-set saat user secara eksplisit memilih — ditandai dengan
   * _animationsUserExplicit. Saat default (belum pernah diubah user), attribute
   * tidak di-set agar OS preference tetap berlaku natural.
   *
   * Weather effects (canvas/rAF) tidak terpengaruh oleh animation-play-state.
   * ─────────────────────────────────────────────────────────────────────────── */
  let animStyleEl = null;

  // true = user pernah secara eksplisit mengubah setting ini dari panel
  let _animationsUserExplicit = false;

  function applyAnimations(enabled) {
    if (!animStyleEl) {
      animStyleEl = document.createElement('style');
      animStyleEl.id = 'a11y-animations';
      document.head.appendChild(animStyleEl);
    }

    if (enabled) {
      animStyleEl.textContent = '';
      if (_animationsUserExplicit) {
        // User eksplisit aktifkan — set "on" agar override prefers-reduced-motion
        HTML.setAttribute('data-a11y-animations', 'on');
        HTML.removeAttribute('data-a11y-animations-user');
      } else {
        // State default (belum pernah diubah user) — hapus attribute,
        // biarkan OS prefers-reduced-motion berlaku secara natural
        HTML.removeAttribute('data-a11y-animations');
        HTML.removeAttribute('data-a11y-animations-user');
      }
      return;
    }

    // User eksplisit matikan — pause semua via CSS attribute selector
    HTML.setAttribute('data-a11y-animations', 'off');
    HTML.setAttribute('data-a11y-animations-user', 'true');
    animStyleEl.textContent = [
      'html[data-a11y-animations="off"] *,',
      'html[data-a11y-animations="off"] *::before,',
      'html[data-a11y-animations="off"] *::after {',
      '  animation-play-state: paused !important;',
      '  transition-duration: 0.001ms !important;',
      '}'
    ].join('\n');
  }

  function resumeAllAnimations() {
    // Dipakai oleh resetAll() — kembali ke state default (tanpa attribute)
    // sehingga OS prefers-reduced-motion kembali berlaku secara natural
    _animationsUserExplicit = false;
    if (animStyleEl) animStyleEl.textContent = '';
    HTML.removeAttribute('data-a11y-animations');
    HTML.removeAttribute('data-a11y-animations-user');
  }

  function applyImgCaptions(enable) {
    document.querySelectorAll('img[alt]').forEach(function (img) {
      const alt = img.getAttribute('alt');
      if (!alt || alt.trim() === '') return;

      let cap = img.nextElementSibling;
      const isCaption = cap && cap.classList.contains('a11y-img-caption');

      if (enable) {
        if (!isCaption) {
          const el = document.createElement('span');
          el.className = 'a11y-img-caption';
          el.textContent = alt;
          img.parentNode.insertBefore(el, img.nextSibling);
        }
      } else {
        if (isCaption) cap.remove();
      }
    });
  }

  let highlightStyleEl = null;

  function applyHighlightFocus(enable) {
    if (!highlightStyleEl) {
      highlightStyleEl = document.createElement('style');
      highlightStyleEl.id = 'a11y-highlight-focus';
      document.head.appendChild(highlightStyleEl);
    }
    if (enable) {
      highlightStyleEl.textContent = `
        a:hover, button:hover, [role="button"]:hover,
        .nav-link:hover, .navbar-social-link:hover,
        .news-card:hover, .service-card:hover, .blog-card:hover {
          outline: 2px dashed #0d6efd !important;
          outline-offset: 3px !important;
        }
      `;
    } else {
      highlightStyleEl.textContent = '';
    }
  }

  let keyboardStyleEl = null;

  function applyKeyboardNav(enable) {
    if (!keyboardStyleEl) {
      keyboardStyleEl = document.createElement('style');
      keyboardStyleEl.id = 'a11y-keyboard-nav';
      document.head.appendChild(keyboardStyleEl);
    }
    if (enable) {
      keyboardStyleEl.textContent = `
        *:focus, a:focus, button:focus, input:focus,
        select:focus, textarea:focus, [tabindex]:focus,
        .nav-link:focus, .navbar-social-link:focus,
        .a11y-fab:focus, .a11y-panel button:focus {
          outline: 3px solid #0d6efd !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 5px rgba(13,110,253,0.2) !important;
        }
      `;
    } else {
      keyboardStyleEl.textContent = '';
    }
  }

  let alignStyleEl = null;

  function applyAlignLeft(enable) {
    if (!alignStyleEl) {
      alignStyleEl = document.createElement('style');
      alignStyleEl.id = 'a11y-align-left';
      document.head.appendChild(alignStyleEl);
    }
    if (enable) {
      alignStyleEl.textContent = `
        p, li, td, th, .post-details-article p,
        .news-card-excerpt, .card-text,
        .section-title, .default-section-title,
        .default-section-title-middle {
          text-align: left !important;
        }
      `;
    } else {
      alignStyleEl.textContent = '';
    }
  }

  let readingGuideEl = null;

  function initReadingGuide() {
    readingGuideEl = document.createElement('div');
    readingGuideEl.className = 'a11y-reading-guide';
    readingGuideEl.setAttribute('aria-hidden', 'true');
    readingGuideEl.style.top = '-100px';
    document.body.appendChild(readingGuideEl);

    document.addEventListener('mousemove', function (e) {
      if (!state.readingGuide || !readingGuideEl) return;
      readingGuideEl.style.top = (e.clientY - 18) + 'px';
    });
  }


  const TTS = (function () {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    let voices = [];
    let chunks = [];
    let chunkIndex = 0;
    let highlightedEl = null;
    let activeRange = null;
    let onProgressCb = null;
    let onEndCb = null;
    let onStartCb = null;
    let _rate = 1.0;
    let _voice = null;
    let _paused = false;

    const TEXT_REPLACEMENTS = [
      { search: /\bKab\.\s*/gi, replace: 'Kabupaten ', lang: 'id' },
      { search: /\bKec\.\s*/gi, replace: 'Kecamatan ', lang: 'id' },
      { search: /\bKel\.\s*/gi, replace: 'Kelurahan ', lang: 'id' },
      { search: /\bDr\.\s*/gi, replace: 'Doktor ', lang: 'id' },
      { search: /\bProf\.\s*/gi, replace: 'Profesor ', lang: 'id' },
      { search: /\bSH\b/gi, replace: 'Sarjana Hukum', lang: 'id' },
      { search: /\bSE\b/gi, replace: 'Sarjana Ekonomi', lang: 'id' },
      { search: /\bST\b/gi, replace: 'Sarjana Teknik', lang: 'id' },
      { search: /\bSIP\b/gi, replace: 'Sarjana Ilmu Pemerintahan', lang: 'id' },
      { search: /\bM\.Si\b/gi, replace: 'Magister Sains', lang: 'id' },
      { search: /\bM\.M\b/gi, replace: 'Magister Manajemen', lang: 'id' },
      { search: /\bPemkab\b/gi, replace: 'Pemerintah Kabupaten', lang: 'id' },
      { search: /\bPemkot\b/gi, replace: 'Pemerintah Kota', lang: 'id' },
      { search: /\bDiskominfo\b/gi, replace: 'Dinas Komunikasi dan Informatika', lang: 'id' },
      { search: /\bBPBD\b/gi, replace: 'Badan Penanggulangan Bencana Daerah', lang: 'id' },
      { search: /\bDPRD\b/gi, replace: 'Dewan Perwakilan Rakyat Daerah', lang: 'id' },
      { search: /\bAPBD\b/gi, replace: 'Anggaran Pendapatan dan Belanja Daerah', lang: 'id' },
      { search: /\bASN\b/gi, replace: 'Aparatur Sipil Negara', lang: 'id' },
      { search: /\bOPD\b/gi, replace: 'Organisasi Perangkat Daerah', lang: 'id' },
      { search: /\bUMKM\b/gi, replace: 'Usaha Mikro Kecil dan Menengah', lang: 'id' },
      { search: /\bRSUD\b/gi, replace: 'Rumah Sakit Umum Daerah', lang: 'id' },
      { search: /\bPKM\b/gi, replace: 'Puskesmas', lang: 'id' },
      { search: /&amp;/g, replace: 'dan', lang: null },
      { search: /&/g, replace: 'dan', lang: null },
      { search: /\+/g, replace: 'plus', lang: null },
      { search: /Rp\.?\s*/g, replace: 'Rupiah ', lang: 'id' },
      { search: /\bWIB\b/gi, replace: 'Waktu Indonesia Barat', lang: 'id' },
      { search: /\bWITA\b/gi, replace: 'Waktu Indonesia Tengah', lang: 'id' },
      { search: /\bWIT\b/gi, replace: 'Waktu Indonesia Timur', lang: 'id' },
    ];

    function applyTextReplacements(text) {
      const lang = localStorage.getItem('selectedLanguage') || 'id';
      let result = text;
      TEXT_REPLACEMENTS.forEach(function (rule) {
        if (rule.lang === null || rule.lang === lang) {
          result = result.replace(rule.search, rule.replace);
        }
      });
      return result;
    }

    function loadVoices() {
      if (!synth) return;
      voices = synth.getVoices();
      if (!voices.length) {
        synth.addEventListener('voiceschanged', function () {
          voices = synth.getVoices();
        });
      }
    }

    function getVoices() { return voices; }

    function getIndonesianVoice() {
      return voices.find(function (v) {
        return v.lang === 'id-ID' || v.lang.startsWith('id');
      }) || voices[0] || null;
    }

    function getPageContent() {
      const selectors = [
        'main', 'article', '.post-details-article',
        '.content-area', '#content', '.main-content',
        '.container'
      ];
      let el = null;
      for (let i = 0; i < selectors.length; i++) {
        el = document.querySelector(selectors[i]);
        if (el) break;
      }
      if (!el) el = document.body;

      const nodes = el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,blockquote');
      const result = [];
      nodes.forEach(function (node) {
        const txt = node.innerText && node.innerText.trim();
        if (txt && txt.length > 2) result.push({ el: node, text: txt });
      });
      return result;
    }


    function highlightWord(el, charIndex, charLength) {
      if (!el || charIndex === undefined) return;

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
              const highlight = new Highlight(range);
              CSS.highlights.set('a11y-tts-word', highlight);
              activeRange = range;
            } else {
              const mark = document.createElement('mark');
              mark.className = 'a11y-tts-word-mark';
              mark.setAttribute('aria-hidden', 'true');
              try {
                range.surroundContents(mark);
                activeRange = mark;
              } catch (_) {
              }
            }
          } catch (_) {
          }
          break;
        }
        offset += nodeLen;
      }
    }

    function clearWordHighlight() {
      if (typeof CSS !== 'undefined' && CSS.highlights) {
        CSS.highlights.delete('a11y-tts-word');
      }
      if (activeRange && activeRange.nodeType === Node.ELEMENT_NODE && activeRange.parentNode) {
        const parent = activeRange.parentNode;
        while (activeRange.firstChild) {
          parent.insertBefore(activeRange.firstChild, activeRange);
        }
        parent.removeChild(activeRange);
      }
      activeRange = null;
    }

    function getTextNodes(el) {
      const nodes = [];
      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let node;
      while ((node = walker.nextNode())) {
        nodes.push(node);
      }
      return nodes;
    }

    function highlightElement(el) {
      clearHighlight();
      if (!el) return;
      el.classList.add('a11y-tts-highlight');
      highlightedEl = el;
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function clearHighlight() {
      clearWordHighlight();
      if (highlightedEl) {
        highlightedEl.classList.remove('a11y-tts-highlight');
        highlightedEl = null;
      }
    }

    function splitText(text) {
      if (!text || !text.trim()) return [];
      const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
      const result = [];
      let current = '';
      sentences.forEach(function (s) {
        const trimmed = s.trim();
        if (!trimmed) return;
        if ((current + trimmed).length > 200) {
          if (current) result.push(current.trim());
          current = trimmed;
        } else {
          current += (current ? ' ' : '') + trimmed;
        }
      });
      if (current.trim()) result.push(current.trim());
      return result.length ? result : [text.trim()];
    }

    function speak(text, rate, voice, onStart, onProgress, onEnd) {
      if (!synth) return;
      if (!text || !text.trim()) return;
      cancel();
      _rate = rate || 1.0;
      _voice = voice || getIndonesianVoice();
      onStartCb = onStart;
      onProgressCb = onProgress;
      onEndCb = onEnd;
      _paused = false;

      const processed = applyTextReplacements(text);
      chunks = splitText(processed);
      chunkIndex = 0;
      speakChunk();
    }

    function speakChunks(chunkList, rate, voice, onStart, onProgress, onEnd) {
      if (!synth) return;
      cancel();
      _rate = rate || 1.0;
      _voice = voice || getIndonesianVoice();
      onStartCb = onStart;
      onProgressCb = onProgress;
      onEndCb = onEnd;
      _paused = false;
      chunks = chunkList.map(function (c) {
        if (typeof c === 'string') return applyTextReplacements(c);
        return { el: c.el, text: applyTextReplacements(c.text) };
      });
      chunkIndex = 0;
      speakChunk();
    }

    function speakChunk() {
      if (chunkIndex >= chunks.length) {
        clearHighlight();
        if (onEndCb) onEndCb();
        return;
      }

      const chunk = chunks[chunkIndex];
      const chunkEl = chunk.el || null;
      const chunkTxt = chunk.text || chunk;

      const utt = new SpeechSynthesisUtterance(chunkTxt);
      utt.rate = _rate;
      const lang = localStorage.getItem('selectedLanguage') || 'id';
      utt.lang = lang === 'en' ? 'en-US' : 'id-ID';
      if (_voice) utt.voice = _voice;

      utt.onstart = function () {
        if (chunkIndex === 0 && onStartCb) onStartCb();
        if (chunkEl) highlightElement(chunkEl);
        if (onProgressCb) onProgressCb(chunkIndex, chunks.length);
      };

      utt.onboundary = function (e) {
        if (e.name !== 'word') return;
        if (chunkEl) {
          highlightWord(chunkEl, e.charIndex, e.charLength || 1);
        }
      };

      utt.onend = function () {
        clearHighlight();
        chunkIndex++;
        if (!_paused) speakChunk();
      };

      utt.onerror = function (e) {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          chunkIndex++;
          speakChunk();
        }
      };

      synth.speak(utt);
    }

    function pause() {
      if (synth && synth.speaking) {
        _paused = true;
        synth.pause();
      }
    }

    function resume() {
      if (synth && synth.paused) {
        _paused = false;
        synth.resume();
      }
    }

    function cancel() {
      _paused = false;
      clearHighlight();
      if (synth) synth.cancel();
      chunks = [];
      chunkIndex = 0;
    }

    function isPlaying() {
      return synth && synth.speaking && !synth.paused;
    }

    function isPaused() {
      return synth && synth.paused;
    }

    function isSupported() {
      return 'speechSynthesis' in window;
    }

    loadVoices();

    return {
      speak: speak,
      cancel: cancel,
      isPlaying: isPlaying,
      isPaused: isPaused,
      isSupported: isSupported,
      getVoices: getVoices,
    };
  })();

  let ttsSelectListener = null;
  let ttsLinkListeners = [];
  let ttsTabListener = null;

  function getSelectedVoice() {
    const voices = TTS.getVoices();
    if (!voices.length) {
      const direct = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      if (!direct.length) return null;
      return direct.find(function (v) { return v.lang === 'id-ID' || v.lang.startsWith('id'); }) || direct[0] || null;
    }

    const lang = localStorage.getItem('selectedLanguage') || 'id';
    const langMap = {
      'id': ['id-ID', 'id'],
      'en': ['en-US', 'en-GB', 'en'],
      'jv': ['jv', 'id-ID', 'id'],
    };
    const preferred = langMap[lang] || langMap['id'];

    for (let i = 0; i < preferred.length; i++) {
      const code = preferred[i];
      const female = voices.find(function (v) {
        return (v.lang === code || v.lang.startsWith(code)) &&
          /female|wanita|perempuan/i.test(v.name);
      });
      if (female) return female;
      const any = voices.find(function (v) {
        return v.lang === code || v.lang.startsWith(code);
      });
      if (any) return any;
    }
    return voices[0] || null;
  }

  function enableSelectTextSpeak() {
    ttsSelectListener = function () {
      setTimeout(function () {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const text = sel.toString().trim();
        if (text.length < 3) return;
        ttsSpeakWithPermission(function () {
          TTS.speak(text, state.tts.rate, getSelectedVoice(), null, null, null);
        });
      }, 50);
    };
    document.addEventListener('mouseup', ttsSelectListener);
    document.addEventListener('touchend', ttsSelectListener);
  }

  function disableSelectTextSpeak() {
    if (ttsSelectListener) {
      document.removeEventListener('mouseup', ttsSelectListener);
      document.removeEventListener('touchend', ttsSelectListener);
      ttsSelectListener = null;
    }
  }

  let _ttsLinkHoverTimer = null;
  let _ttsLinkDelegate = null;

  function enableSpeakLinks() {
    _ttsLinkDelegate = function (e) {
      const el = e.target.closest('a');
      if (!el) return;
      if (el.closest('#a11yPanel') || el.closest('.a11y-skip-link')) return;
      const txt = el.textContent.trim();
      if (!txt) return;

      clearTimeout(_ttsLinkHoverTimer);
      _ttsLinkHoverTimer = setTimeout(function () {
        ttsSpeakWithPermission(function () {
          TTS.speak(txt, state.tts.rate, getSelectedVoice(), null, null, null);
        });
      }, 300);
    };

    _ttsLinkDelegate._leave = function (e) {
      if (e.target.closest('a')) clearTimeout(_ttsLinkHoverTimer);
    };

    document.addEventListener('mouseover', _ttsLinkDelegate);
    document.addEventListener('mouseout', _ttsLinkDelegate._leave);
  }

  function disableSpeakLinks() {
    clearTimeout(_ttsLinkHoverTimer);
    if (_ttsLinkDelegate) {
      document.removeEventListener('mouseover', _ttsLinkDelegate);
      document.removeEventListener('mouseout', _ttsLinkDelegate._leave);
      _ttsLinkDelegate = null;
    }
    ttsLinkListeners.forEach(function (item) {
      item.el.removeEventListener('mouseenter', item.fn);
    });
    ttsLinkListeners = [];
  }

  function enableTabNav() {
    ttsTabListener = function (e) {
      if (e.key !== 'Tab') return;
      const el = document.activeElement;
      if (!el) return;
      let text = '';
      const tag = el.tagName;
      if (tag === 'A') text = (el.textContent.trim() || el.getAttribute('aria-label') || '');
      else if (tag === 'BUTTON') text = (el.textContent.trim() || el.getAttribute('aria-label') || '');
      else if (tag === 'INPUT') text = (el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.type || '');
      else if (tag === 'SELECT') text = (el.getAttribute('aria-label') || '');
      else if (tag === 'TEXTAREA') text = (el.getAttribute('placeholder') || '');
      else text = el.getAttribute('aria-label') || el.textContent.trim().substring(0, 60);
      if (text.trim()) {
        ttsSpeakWithPermission(function () {
          TTS.speak(text, state.tts.rate, getSelectedVoice(), null, null, null);
        });
      }
    };
    document.addEventListener('keyup', ttsTabListener);
  }

  function disableTabNav() {
    if (ttsTabListener) {
      document.removeEventListener('keyup', ttsTabListener);
      ttsTabListener = null;
    }
  }

  const TTS_WELCOME_KEY = 'kebumen_tts_welcomed';
  const TTS_PERMISSION_KEY = 'kebumen_tts_allowed';
  const TTS_WELCOME_TEXTS = {
    'id': 'Selamat datang di Portal Resmi Pemerintah Kabupaten Kebumen.',
    'en': 'Welcome to the Official Portal of Kebumen Regency Government.',
    'jv': 'Sugeng rawuh ing Portal Resmi Pemerintah Kabupaten Kebumen.',
  };

  let _ttsPermissionGranted = false;
  let _ttsPromptEl = null;
  let _ttsPendingSpeak = null;

  function isMobileOrSafari() {
    const ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod|Android/i.test(ua) ||
      (/Safari/i.test(ua) && !/Chrome/i.test(ua));
  }

  function ttsPermissionGranted() {
    return sessionStorage.getItem(TTS_PERMISSION_KEY) === '1';
  }

  function buildTTSPrompt() {
    if (_ttsPromptEl) return;

    const el = document.createElement('div');
    el.className = 'a11y-tts-prompt';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Izin pembaca teks');
    el.innerHTML = `
      <div class="a11y-tts-prompt__text">
        <strong><i class="fas fa-volume-up" aria-hidden="true"></i> Pembaca Teks</strong>
        ${window.location.hostname} ingin mengaktifkan pembaca teks untuk membantu aksesibilitas halaman ini.
      </div>
      <div class="a11y-tts-prompt__actions">
        <button class="a11y-tts-prompt__btn a11y-tts-prompt__btn--deny" id="a11yTtsPromptDeny">
          Tolak
        </button>
        <button class="a11y-tts-prompt__btn a11y-tts-prompt__btn--allow" id="a11yTtsPromptAllow">
          Izinkan
        </button>
      </div>
    `;
    document.body.appendChild(el);
    _ttsPromptEl = el;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add('a11y-tts-prompt--visible');
        document.getElementById('a11yTtsPromptAllow').focus();
      });
    });

    document.getElementById('a11yTtsPromptAllow').addEventListener('click', function () {
      onTTSPermissionResult(true);
    });

    document.getElementById('a11yTtsPromptDeny').addEventListener('click', function () {
      onTTSPermissionResult(false);
    });
  }

  function removeTTSPrompt() {
    if (!_ttsPromptEl) return;
    _ttsPromptEl.classList.remove('a11y-tts-prompt--visible');
    setTimeout(function () {
      if (_ttsPromptEl && _ttsPromptEl.parentNode) {
        _ttsPromptEl.parentNode.removeChild(_ttsPromptEl);
      }
      _ttsPromptEl = null;
    }, 320);
  }

  function onTTSPermissionResult(allowed) {
    removeTTSPrompt();
    if (allowed) {
      sessionStorage.setItem(TTS_PERMISSION_KEY, '1');
      _ttsPermissionGranted = true;
      if (_ttsPendingSpeak) {
        const pending = _ttsPendingSpeak;
        _ttsPendingSpeak = null;
        pending();
      }
    } else {
      state.tts.enabled = false;
      applyState();
      saveState();
    }
  }

  /**
   * Wrapper speak yang aware permission.
   * - Desktop: langsung speak, tangkap error not-allowed → tampilkan prompt
   * - Mobile/Safari: tampilkan prompt dulu sebelum speak pertama
   */
  function ttsSpeakWithPermission(speakFn) {
    if (!TTS.isSupported()) return;

    if (ttsPermissionGranted()) {
      speakFn();
      return;
    }

    if (isMobileOrSafari()) {
      _ttsPendingSpeak = speakFn;
      buildTTSPrompt();
      return;
    }

    if (!_ttsPendingSpeak) _ttsPendingSpeak = speakFn;
    try {
      const testUtt = new SpeechSynthesisUtterance(' ');
      testUtt.volume = 0;
      testUtt.rate = 10;
      testUtt.onend = function () {
        sessionStorage.setItem(TTS_PERMISSION_KEY, '1');
        _ttsPermissionGranted = true;
        if (_ttsPendingSpeak) {
          const fn = _ttsPendingSpeak;
          _ttsPendingSpeak = null;
          fn();
        }
      };
      testUtt.onerror = function (e) {
        if (e.error === 'not-allowed') {
          buildTTSPrompt();
        } else {
          sessionStorage.setItem(TTS_PERMISSION_KEY, '1');
          _ttsPermissionGranted = true;
          if (_ttsPendingSpeak) {
            const fn = _ttsPendingSpeak;
            _ttsPendingSpeak = null;
            fn();
          }
        }
      };
      window.speechSynthesis.speak(testUtt);
    } catch (_) {
      buildTTSPrompt();
    }
  }
  function getTTSWelcomeText() {
    const lang = localStorage.getItem('selectedLanguage') || 'id';
    return TTS_WELCOME_TEXTS[lang] || TTS_WELCOME_TEXTS['id'];
  }
  let _ttsEnabledPrev = null;

  function applyTTSState() {
    const enabled = state.tts.enabled;

    if (_ttsEnabledPrev !== enabled) {
      _ttsEnabledPrev = enabled;
      disableSelectTextSpeak();
      disableSpeakLinks();
      disableTabNav();
      if (enabled) {
        enableSelectTextSpeak();
        enableSpeakLinks();
        enableTabNav();
      }
    }

    syncTTSUI();
  }

  function playWelcomeMessage() {
    if (!TTS.isSupported()) return;
    if (sessionStorage.getItem(TTS_WELCOME_KEY)) return;

    function doSpeak() {
      if (!state.tts.enabled) return;
      const voice = getSelectedVoice();
      const lang = localStorage.getItem('selectedLanguage') || 'id';
      const langCode = lang === 'en' ? 'en-US' : 'id-ID';
      const utt = new SpeechSynthesisUtterance(getTTSWelcomeText());
      utt.lang = langCode;
      utt.rate = state.tts.rate || 1.0;
      if (voice) utt.voice = voice;

      utt.onend = function () {
        sessionStorage.setItem(TTS_WELCOME_KEY, '1');
        sessionStorage.setItem(TTS_PERMISSION_KEY, '1');
        _ttsPermissionGranted = true;
      };
      utt.onerror = function (e) {
        if (e.error === 'not-allowed') {
          _ttsPendingSpeak = doSpeak;
          buildTTSPrompt();
        } else {
          sessionStorage.setItem(TTS_WELCOME_KEY, '1');
        }
      };

      window.speechSynthesis.speak(utt);
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      setTimeout(doSpeak, 1000);
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', function onReady() {
        window.speechSynthesis.removeEventListener('voiceschanged', onReady);
        setTimeout(doSpeak, 1000);
      });
    }
  }

  function syncTTSUI() {
    const panel = document.getElementById('a11yPanel');
    if (!panel) return;
    syncToggleRow(panel, '[data-a11y-action="tts-main"]', state.tts.enabled);
  }

  let liveRegion = null;

  function announce(msg) {
    if (!liveRegion) return;
    liveRegion.textContent = '';
    setTimeout(function () { liveRegion.textContent = msg; }, 50);
  }

  function buildWidget() {
    const skip = document.createElement('a');
    skip.href = '#a11y-main-content';
    skip.className = 'a11y-skip-link';
    skip.textContent = 'Lewati ke konten utama';
    document.body.insertBefore(skip, document.body.firstChild);

    const main = document.querySelector('main') || document.querySelector('.main-content') || document.querySelector('#content');
    if (main && !main.id) main.id = 'a11y-main-content';
    else if (main && main.id) skip.href = '#' + main.id;

    liveRegion = document.createElement('div');
    liveRegion.className = 'a11y-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('role', 'status');
    document.body.appendChild(liveRegion);

    const fab = document.createElement('button');
    fab.id = 'a11yFab';
    fab.className = 'a11y-fab';
    fab.setAttribute('aria-label', 'Buka panel aksesibilitas');
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'a11yPanel');
    fab.innerHTML = '<i class="fas fa-universal-access" aria-hidden="true"></i>';
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.id = 'a11yPanel';
    panel.className = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-label', 'Panel Aksesibilitas');
    panel.innerHTML = buildPanelHTML();
    document.body.appendChild(panel);

    initReadingGuide();

    bindEvents(fab, panel);
  }

  function buildPanelHTML() {
    return `
      <div class="a11y-panel__header">
        <h2 class="a11y-panel__title">
          <i class="fas fa-universal-access me-2" aria-hidden="true"></i>Aksesibilitas
        </h2>
        <div class="a11y-panel__header-actions">
          <button class="a11y-panel__reset" id="a11yReset" aria-label="Reset semua pengaturan aksesibilitas">
            <i class="fas fa-undo" aria-hidden="true"></i> Reset
          </button>
          <button class="a11y-panel__close" id="a11yClose" aria-label="Tutup panel aksesibilitas">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <div class="a11y-panel__body">

        <!-- Kontras Warna -->
        <div class="a11y-section">
          <div class="a11y-section__label">Kontras Warna</div>
          <div class="a11y-section__grid">
            <button class="a11y-opt" data-a11y-action="contrast" data-a11y-value="none" aria-pressed="true">
              <span class="a11y-opt__icon" aria-hidden="true">◑</span>
              <span class="a11y-opt__label">Normal</span>
            </button>
            <button class="a11y-opt" data-a11y-action="contrast" data-a11y-value="bright" aria-pressed="false">
              <span class="a11y-opt__icon" aria-hidden="true">☀</span>
              <span class="a11y-opt__label">Terang</span>
            </button>
            <button class="a11y-opt" data-a11y-action="contrast" data-a11y-value="reverse" aria-pressed="false">
              <span class="a11y-opt__icon" aria-hidden="true">◐</span>
              <span class="a11y-opt__label">Terbalik</span>
            </button>
            <button class="a11y-opt" data-a11y-action="contrast" data-a11y-value="grayscale" aria-pressed="false">
              <span class="a11y-opt__icon" aria-hidden="true">⬛</span>
              <span class="a11y-opt__label">Grayscale</span>
            </button>
          </div>
        </div>

        <div class="a11y-divider"></div>

        <!-- Ukuran Teks -->
        <div class="a11y-section">
          <div class="a11y-section__label">Ukuran Teks</div>
          <div class="a11y-textsize">
            <button class="a11y-textsize__btn" id="a11yTextDec" aria-label="Perkecil teks">T−</button>
            <div class="a11y-textsize__display" id="a11yTextDisplay" aria-live="polite" aria-atomic="true">100%</div>
            <button class="a11y-textsize__btn" id="a11yTextInc" aria-label="Perbesar teks">T+</button>
          </div>
        </div>

        <div class="a11y-divider"></div>

        <!-- Font & Spasi -->
        <div class="a11y-section">
          <div class="a11y-section__label">Font & Spasi</div>
          <div class="a11y-section__list">
            <button class="a11y-toggle-row" data-a11y-action="font" data-a11y-value="readable" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-font"></i></span>
                Font mudah dibaca
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
            <button class="a11y-toggle-row" data-a11y-action="spacing" data-a11y-value="wide" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-text-height"></i></span>
                Spasi baris lebar
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
            <button class="a11y-toggle-row" data-a11y-action="align" data-a11y-value="left" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-align-left"></i></span>
                Rata kiri
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
          </div>
        </div>

        <div class="a11y-divider"></div>

        <!-- Sorot Konten -->
        <div class="a11y-section">
          <div class="a11y-section__label">Sorot Konten</div>
          <div class="a11y-section__list">
            <button class="a11y-toggle-row" data-a11y-action="toggle" data-a11y-key="underlineLinks" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-underline"></i></span>
                Garis bawah tautan
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
            <button class="a11y-toggle-row" data-a11y-action="toggle" data-a11y-key="underlineHeaders" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-heading"></i></span>
                Garis bawah judul
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
            <button class="a11y-toggle-row" data-a11y-action="toggle" data-a11y-key="imgTitles" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-image"></i></span>
                Tampilkan alt gambar
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
            <button class="a11y-toggle-row" data-a11y-action="toggle" data-a11y-key="highlightFocus" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-mouse-pointer"></i></span>
                Sorot elemen hover
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
          </div>
        </div>

        <div class="a11y-divider"></div>

        <!-- Kursor & Panduan -->
        <div class="a11y-section">
          <div class="a11y-section__label">Kursor</div>
          <div class="a11y-section__grid">
            <button class="a11y-opt" data-a11y-action="cursor" data-a11y-value="default" aria-pressed="true">
              <span class="a11y-opt__icon" aria-hidden="true">↖</span>
              <span class="a11y-opt__label">Normal</span>
            </button>
            <button class="a11y-opt" data-a11y-action="cursor" data-a11y-value="white" aria-pressed="false">
              <span class="a11y-opt__icon" aria-hidden="true">🖱</span>
              <span class="a11y-opt__label">Putih besar</span>
            </button>
            <button class="a11y-opt" data-a11y-action="cursor" data-a11y-value="black" aria-pressed="false">
              <span class="a11y-opt__icon" aria-hidden="true">🖱</span>
              <span class="a11y-opt__label">Hitam besar</span>
            </button>
          </div>
          <div class="a11y-section__list mt-2" style="margin-top:8px;">
            <button class="a11y-toggle-row" data-a11y-action="toggle" data-a11y-key="readingGuide" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-ruler-horizontal"></i></span>
                Panduan baca
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
          </div>
        </div>

        <div class="a11y-divider"></div>

        <!-- Navigasi & Lainnya -->
        <div class="a11y-section">
          <div class="a11y-section__label">Navigasi & Lainnya</div>
          <div class="a11y-section__list">
            <button class="a11y-toggle-row" data-a11y-action="toggle" data-a11y-key="keyboard" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-keyboard"></i></span>
                Navigasi keyboard
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
            <button class="a11y-toggle-row" data-a11y-action="animations" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-ban"></i></span>
                Hentikan animasi
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
            <button class="a11y-toggle-row" data-a11y-action="toggle" data-a11y-key="hideImages" aria-pressed="false">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-eye-slash"></i></span>
                Sembunyikan gambar
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
          </div>
        </div>

        <div class="a11y-divider"></div>

        <!-- Baca Halaman (TTS) -->
        <div class="a11y-section">
          <div class="a11y-section__label">Baca Halaman</div>
          <div class="a11y-section__list">
            <button class="a11y-toggle-row" data-a11y-action="tts-main" aria-pressed="true">
              <span class="a11y-toggle-row__left">
                <span class="a11y-toggle-row__icon" aria-hidden="true"><i class="fas fa-volume-up"></i></span>
                Aktifkan pembaca teks
              </span>
              <span class="a11y-toggle-row__switch" aria-hidden="true"></span>
            </button>
          </div>
        </div>

      </div>

      <div class="a11y-panel__footer">
        <span class="a11y-panel__footer-link">WCAG 2.1 AA</span>
        <span class="a11y-panel__footer-link">Pemkab Kebumen</span>
      </div>
    `;
  }

  function syncUI() {
    const panel = document.getElementById('a11yPanel');
    if (!panel) return;

    panel.querySelectorAll('[data-a11y-action="contrast"]').forEach(function (btn) {
      const active = btn.dataset.a11yValue === state.contrast;
      btn.classList.toggle('a11y-opt--active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    panel.querySelectorAll('[data-a11y-action="cursor"]').forEach(function (btn) {
      const active = btn.dataset.a11yValue === state.cursor;
      btn.classList.toggle('a11y-opt--active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    syncToggleRow(panel, '[data-a11y-action="font"]', state.font === 'readable');

    syncToggleRow(panel, '[data-a11y-action="spacing"]', state.spacing === 'wide');

    syncToggleRow(panel, '[data-a11y-action="align"]', state.align === 'left');

    syncToggleRow(panel, '[data-a11y-action="animations"]', !state.animations);

    const boolKeys = ['underlineLinks', 'underlineHeaders', 'imgTitles', 'highlightFocus', 'hideImages', 'readingGuide', 'keyboard'];
    boolKeys.forEach(function (key) {
      const btn = panel.querySelector('[data-a11y-key="' + key + '"]');
      if (btn) syncToggleRow(null, null, state[key], btn);
    });

    const disp = document.getElementById('a11yTextDisplay');
    if (disp) disp.textContent = state.textScale + '%';

    syncTTSUI();
  }

  function syncToggleRow(parent, selector, active, el) {
    const btn = el || (parent && parent.querySelector(selector));
    if (!btn) return;
    btn.classList.toggle('a11y-toggle-row--active', active);
    btn.setAttribute('aria-pressed', String(active));
  }

  function bindEvents(fab, panel) {
    fab.addEventListener('click', function () {
      const isOpen = panel.classList.contains('a11y-panel--open');
      togglePanel(!isOpen);
    });

    panel.addEventListener('click', function (e) {
      if (e.target.closest('#a11yClose')) togglePanel(false);
    });

    panel.addEventListener('click', function (e) {
      if (e.target.closest('#a11yReset')) resetAll();
    });

    panel.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-a11y-action="contrast"]');
      if (!btn) return;
      state.contrast = btn.dataset.a11yValue;
      applyState(); saveState();
      announce('Kontras: ' + btn.querySelector('.a11y-opt__label').textContent);
    });

    panel.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-a11y-action="cursor"]');
      if (!btn) return;
      state.cursor = btn.dataset.a11yValue;
      applyState(); saveState();
      announce('Kursor: ' + btn.querySelector('.a11y-opt__label').textContent);
    });

    panel.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-a11y-action="font"]');
      if (!btn) return;
      state.font = state.font === 'readable' ? 'default' : 'readable';
      applyState(); saveState();
      announce('Font mudah dibaca: ' + (state.font === 'readable' ? 'aktif' : 'nonaktif'));
    });

    panel.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-a11y-action="spacing"]');
      if (!btn) return;
      state.spacing = state.spacing === 'wide' ? 'normal' : 'wide';
      applyState(); saveState();
      announce('Spasi lebar: ' + (state.spacing === 'wide' ? 'aktif' : 'nonaktif'));
    });

    panel.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-a11y-action="align"]');
      if (!btn) return;
      state.align = state.align === 'left' ? 'default' : 'left';
      applyState(); saveState();
      announce('Rata kiri: ' + (state.align === 'left' ? 'aktif' : 'nonaktif'));
    });

    panel.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-a11y-action="animations"]');
      if (!btn) return;
      state.animations = !state.animations;
      _animationsUserExplicit = true; // user secara eksplisit memilih
      applyState(); saveState();
      announce('Animasi: ' + (state.animations ? 'aktif' : 'dinonaktifkan'));
    });

    panel.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-a11y-action="toggle"][data-a11y-key]');
      if (!btn) return;
      const key = btn.dataset.a11yKey;
      if (key in state) {
        state[key] = !state[key];
        applyState(); saveState();
        announce(btn.querySelector('.a11y-toggle-row__left').textContent.trim() + ': ' + (state[key] ? 'aktif' : 'nonaktif'));
      }
    });

    document.getElementById('a11yTextInc').addEventListener('click', function () {
      if (state.textScale < 200) {
        state.textScale = Math.min(200, state.textScale + 10);
        applyState(); saveState();
        announce('Ukuran teks: ' + state.textScale + '%');
      }
    });

    document.getElementById('a11yTextDec').addEventListener('click', function () {
      if (state.textScale > 70) {
        state.textScale = Math.max(70, state.textScale - 10);
        applyState(); saveState();
        announce('Ukuran teks: ' + state.textScale + '%');
      }
    });

    panel.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-a11y-action^="tts-"]');
      if (!btn) return;
      if (btn.dataset.a11yAction === 'tts-main') {
        state.tts.enabled = !state.tts.enabled;
        if (!state.tts.enabled) TTS.cancel();
      }
      applyState(); saveState();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('a11y-panel--open')) {
        togglePanel(false);
        fab.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && !fab.contains(e.target)) {
        if (panel.classList.contains('a11y-panel--open')) togglePanel(false);
      }
    });
  }

  function togglePanel(open) {
    const fab = document.getElementById('a11yFab');
    const panel = document.getElementById('a11yPanel');
    if (!fab || !panel) return;

    panel.classList.toggle('a11y-panel--open', open);
    fab.setAttribute('aria-expanded', String(open));

    if (open) {
      const first = panel.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])');
      if (first) setTimeout(function () { first.focus(); }, 50);
    }
  }

  function resetAll() {
    _ttsEnabledPrev = null;
    _ttsPendingSpeak = null;
    removeTTSPrompt();
    resumeAllAnimations();
    TTS.cancel();
    disableSelectTextSpeak();
    disableSpeakLinks();
    disableTabNav();
    state = Object.assign({}, DEFAULTS);
    state.tts = Object.assign({}, DEFAULTS.tts);
    if (textScaleStyleEl) textScaleStyleEl.textContent = '';
    if (animStyleEl) animStyleEl.textContent = '';
    if (highlightStyleEl) highlightStyleEl.textContent = '';
    if (keyboardStyleEl) keyboardStyleEl.textContent = '';
    if (alignStyleEl) alignStyleEl.textContent = '';
    HTML.removeAttribute('data-a11y-scale');
    HTML.removeAttribute('data-a11y-animations');
    HTML.removeAttribute('data-a11y-animations-user');
    applyState();
    saveState();
    announce('Semua pengaturan aksesibilitas telah direset');
  }

  function init() {
    loadState();
    buildWidget();
    applyState();
    playWelcomeMessage();
    document.addEventListener('visibilitychange', function () {
      if (!TTS.isSupported()) return;
      if (document.hidden) {
        if (TTS.isPlaying()) TTS.cancel();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
