/**
 * Javanese (Basa Jawa) strings — SCAFFOLD, not a translation.
 *
 * Every value is empty on purpose, because no native reviewer has confirmed a
 * single word of this pack yet. An empty value is not a gap in the panel: the
 * resolver treats it as "not translated yet" and keeps the base locale's
 * wording (see `mergeOver` in ./index.js), so this file is safe to register
 * today and gets better one key at a time.
 *
 * The comment after each key is the Indonesian it has to match. Reviewers:
 * replace the '' with Basa Jawa, then delete that comment — a key still
 * carrying its reference is a key nobody has signed off on.
 *
 * Not imported by ./index.js, so nothing here is in the bundle until a host
 * opts in:
 *
 *   import jv, { speechRules } from '@a11y-widget/core/locales/jv';
 *   A11yWidget.registerLocale('jv', jv, speechRules);
 *   A11yWidget.init({ lang: 'jv' });
 *
 * Machine translation is not a review. Ngoko and krama are two registers with
 * different vocabularies and endings, and a panel a visitor cannot trust is
 * worse than a panel in Indonesian.
 */
export default {
    // Panel
    panelTitle: '',              // 'Aksesibilitas'
    panelReset: '',              // 'Reset'
    panelClose: '',              // 'Tutup panel aksesibilitas'
    panelOpen: '',               // 'Buka panel aksesibilitas'
    footerLabel: '',             // 'WCAG 2.1 AA'

    // Skip link
    skipLink: '',                // 'Lewati ke konten utama'

    // Sections
    sectionContrast: '',         // 'Kontras Warna'
    sectionTextSize: '',         // 'Ukuran Teks'
    sectionFontSpacing: '',      // 'Font & Spasi'
    sectionHighlight: '',        // 'Sorot Konten'
    sectionCursor: '',           // 'Kursor'
    sectionNavigation: '',       // 'Navigasi & Lainnya'
    sectionTTS: '',              // 'Baca Halaman'

    // Contrast options
    contrastNone: '',            // 'Normal'
    contrastBright: '',          // 'Terang'
    contrastReverse: '',         // 'Terbalik'
    contrastGrayscale: '',       // 'Grayscale'

    // Text size
    textDecrease: '',            // 'Perkecil teks'
    textIncrease: '',            // 'Perbesar teks'

    // Font & spacing
    fontReadable: '',            // 'Font mudah dibaca'
    spacingWide: '',             // 'Spasi baris lebar'
    alignLeft: '',               // 'Rata kiri'

    // Highlights
    underlineLinks: '',          // 'Garis bawah tautan'
    underlineHeaders: '',        // 'Garis bawah judul'
    imgTitles: '',               // 'Tampilkan alt gambar'
    highlightFocus: '',          // 'Sorot elemen hover'

    // Cursor
    cursorDefault: '',           // 'Normal'
    cursorWhite: '',             // 'Putih besar'
    cursorBlack: '',             // 'Hitam besar'
    readingGuide: '',            // 'Panduan baca'

    // Navigation
    keyboard: '',                // 'Navigasi keyboard'
    animations: '',              // 'Hentikan animasi'
    hideImages: '',              // 'Sembunyikan gambar'

    // TTS
    ttsEnable: '',               // 'Aktifkan pembaca teks'
    ttsReader: '',               // 'Pembaca teks'
    ttsReadPage: '',             // 'Baca halaman'
    ttsPause: '',                // 'Jeda'
    ttsResume: '',               // 'Lanjut'
    ttsStop: '',                 // 'Berhenti'
    ttsRate: '',                 // 'Kecepatan baca'
    ttsVoice: '',                // 'Suara'
    ttsVoiceDefault: '',         // 'Otomatis (sesuai bahasa halaman)'
    ttsSpeaking: '',             // 'Sedang membacakan teks.'
    ttsPaused: '',               // 'Pembacaan dijeda.'
    ttsEnded: '',                // 'Selesai membacakan.'
    ttsStopped: '',              // 'Pembacaan dihentikan.'
    ttsNothingToRead: '',        // 'Tidak ada teks untuk dibacakan.'
    ttsWelcome: '',              // 'Selamat datang. Panel aksesibilitas bisa dibuka lewat tombol di pojok layar.'
    ttsPermissionTitle: '',      // 'Pembaca Teks'
    ttsPermissionBody: '',       // 'ingin mengaktifkan pembaca teks untuk membantu aksesibilitas halaman ini.'
    ttsPermissionAllow: '',      // 'Izinkan'
    ttsPermissionDeny: '',       // 'Tolak'
    ttsPermissionLabel: '',      // 'Izin pembaca teks'

    // Announce messages
    announceContrast: '',        // 'Kontras'
    announceCursor: '',          // 'Kursor'
    announceFontReadable: '',    // 'Font mudah dibaca'
    announceFontDefault: '',     // 'Font default'
    announceSpacingWide: '',     // 'Spasi lebar aktif'
    announceSpacingNormal: '',   // 'Spasi normal'
    announceAlignLeft: '',       // 'Rata kiri aktif'
    announceAlignDefault: '',    // 'Rata default'
    announceAnimationsOff: '',   // 'Animasi dinonaktifkan'
    announceAnimationsOn: '',    // 'Animasi aktif'
    announceTextSize: '',        // 'Ukuran teks'
    announceActive: '',          // 'aktif'
    announceInactive: '',        // 'nonaktif'
    announceReset: '',           // 'Semua pengaturan aksesibilitas telah direset'
};

/**
 * Speech rules for Javanese: what the reader says out loud instead of the
 * printed form. Empty until a reviewer fills it in, and empty is a fine answer
 * — the reader then pronounces Javanese text as written rather than applying
 * Indonesian abbreviations to it.
 *
 * Add a rule per line when there is one to add:
 *   { search: /&/g, replace: 'lan' },
 *
 * @type {Array<{search: RegExp, replace: string}>}
 */
export const speechRules = [];
