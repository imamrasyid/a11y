/**
 * Indonesian (Bahasa Indonesia) translations.
 */
export default {
    // Panel
    panelTitle: 'Aksesibilitas',
    panelReset: 'Reset',
    panelClose: 'Tutup panel aksesibilitas',
    panelOpen: 'Buka panel aksesibilitas',
    footerLabel: 'WCAG 2.1 AA',

    // Skip link
    skipLink: 'Lewati ke konten utama',

    // Sections
    sectionContrast: 'Kontras Warna',
    sectionTextSize: 'Ukuran Teks',
    sectionFontSpacing: 'Font & Spasi',
    sectionHighlight: 'Sorot Konten',
    sectionCursor: 'Kursor',
    sectionNavigation: 'Navigasi & Lainnya',
    sectionTTS: 'Baca Halaman',

    // Contrast options
    contrastNone: 'Normal',
    contrastBright: 'Terang',
    contrastReverse: 'Terbalik',
    contrastGrayscale: 'Grayscale',

    // Text size
    textDecrease: 'Perkecil teks',
    textIncrease: 'Perbesar teks',

    // Font & spacing
    fontReadable: 'Font mudah dibaca',
    spacingWide: 'Spasi baris lebar',
    alignLeft: 'Rata kiri',

    // Highlights
    underlineLinks: 'Garis bawah tautan',
    underlineHeaders: 'Garis bawah judul',
    imgTitles: 'Tampilkan alt gambar',
    highlightFocus: 'Sorot elemen hover',

    // Cursor
    cursorDefault: 'Normal',
    cursorWhite: 'Putih besar',
    cursorBlack: 'Hitam besar',
    readingGuide: 'Panduan baca',

    // Navigation
    keyboard: 'Navigasi keyboard',
    animations: 'Hentikan animasi',
    hideImages: 'Sembunyikan gambar',

    // TTS
    ttsEnable: 'Aktifkan pembaca teks',
    ttsReader: 'Pembaca teks',
    ttsReadPage: 'Baca halaman',
    ttsPause: 'Jeda',
    ttsResume: 'Lanjut',
    ttsStop: 'Berhenti',
    ttsRate: 'Kecepatan baca',
    ttsVoice: 'Suara',
    ttsVoiceDefault: 'Otomatis (sesuai bahasa halaman)',
    ttsSpeaking: 'Sedang membacakan teks.',
    ttsPaused: 'Pembacaan dijeda.',
    ttsEnded: 'Selesai membacakan.',
    ttsStopped: 'Pembacaan dihentikan.',
    ttsNothingToRead: 'Tidak ada teks untuk dibacakan.',
    ttsWelcome: 'Selamat datang. Panel aksesibilitas bisa dibuka lewat tombol di pojok layar.',
    ttsPermissionTitle: 'Pembaca Teks',
    ttsPermissionBody: 'ingin mengaktifkan pembaca teks untuk membantu aksesibilitas halaman ini.',
    ttsPermissionAllow: 'Izinkan',
    ttsPermissionDeny: 'Tolak',
    ttsPermissionLabel: 'Izin pembaca teks',

    // Announce messages
    announceContrast: 'Kontras',
    announceCursor: 'Kursor',
    announceFontReadable: 'Font mudah dibaca',
    announceFontDefault: 'Font default',
    announceSpacingWide: 'Spasi lebar aktif',
    announceSpacingNormal: 'Spasi normal',
    announceAlignLeft: 'Rata kiri aktif',
    announceAlignDefault: 'Rata default',
    announceAnimationsOff: 'Animasi dinonaktifkan',
    announceAnimationsOn: 'Animasi aktif',
    announceTextSize: 'Ukuran teks',
    announceActive: 'aktif',
    announceInactive: 'nonaktif',
    announceReset: 'Semua pengaturan aksesibilitas telah direset',
};

/**
 * Speech rules for this locale: what the reader says out loud instead of the
 * printed form. They live with the locale so a new pack brings its own rules
 * instead of editing the TTS engine, and so `lang: 'en'` never expands "Rp."
 * to "Rupiah".
 *
 * @type {Array<{search: RegExp, replace: string}>}
 */
export const speechRules = [
    // Read aloud, "&" becomes a word — and that word is different in every
    // language, so it belongs to the locale pack rather than to a shared list.
    { search: /&amp;/g, replace: 'dan' },
    { search: /&/g, replace: 'dan' },
    { search: /\bKab\.\s*/gi, replace: 'Kabupaten ' },
    { search: /\bKec\.\s*/gi, replace: 'Kecamatan ' },
    { search: /\bKel\.\s*/gi, replace: 'Kelurahan ' },
    { search: /\bDr\.\s*/gi, replace: 'Doktor ' },
    { search: /\bProf\.\s*/gi, replace: 'Profesor ' },
    { search: /\bSH\b/gi, replace: 'Sarjana Hukum' },
    { search: /\bSE\b/gi, replace: 'Sarjana Ekonomi' },
    { search: /\bST\b/gi, replace: 'Sarjana Teknik' },
    { search: /\bSIP\b/gi, replace: 'Sarjana Ilmu Pemerintahan' },
    { search: /\bM\.Si\b/gi, replace: 'Magister Sains' },
    { search: /\bM\.M\b/gi, replace: 'Magister Manajemen' },
    { search: /\bPemkab\b/gi, replace: 'Pemerintah Kabupaten' },
    { search: /\bPemkot\b/gi, replace: 'Pemerintah Kota' },
    { search: /\bDiskominfo\b/gi, replace: 'Dinas Komunikasi dan Informatika' },
    { search: /\bBPBD\b/gi, replace: 'Badan Penanggulangan Bencana Daerah' },
    { search: /\bDPRD\b/gi, replace: 'Dewan Perwakilan Rakyat Daerah' },
    { search: /\bAPBD\b/gi, replace: 'Anggaran Pendapatan dan Belanja Daerah' },
    { search: /\bASN\b/gi, replace: 'Aparatur Sipil Negara' },
    { search: /\bOPD\b/gi, replace: 'Organisasi Perangkat Daerah' },
    { search: /\bUMKM\b/gi, replace: 'Usaha Mikro Kecil dan Menengah' },
    { search: /\bRSUD\b/gi, replace: 'Rumah Sakit Umum Daerah' },
    { search: /\bPKM\b/gi, replace: 'Puskesmas' },
    { search: /\bWIB\b/gi, replace: 'Waktu Indonesia Barat' },
    { search: /\bWITA\b/gi, replace: 'Waktu Indonesia Tengah' },
    { search: /\bWIT\b/gi, replace: 'Waktu Indonesia Timur' },
    { search: /Rp\.?\s*/g, replace: 'Rupiah ' },
];
