# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Ditambahkan

- Seksi pembaca teks di panel menjadi kontrol pemutaran penuh, bukan lagi
  sakelar tunggal: **Baca halaman / Jeda / Lanjut / Berhenti**, slider kecepatan
  0,5–2,0 dengan readout (`1,0×`), `<select>` suara yang diisi dari
  `getVoices()` + peristiwa `voiceschanged`, dan baris status
  `role="status" aria-live="polite"` yang menyatakan apa yang terjadi
  ("Sedang membacakan teks.", "Pembacaan dijeda.", "Selesai membacakan.",
  "Pembacaan dihentikan.", "Tidak ada teks untuk dibacakan."). Seksinya tidak
  dirender sama sekali kalau `speechSynthesis` tidak ada.
- `options.tts.autoSpeak: 'none' | 'selection'` (default `'none'`): satu-satunya
  perilaku legacy yang dibawa dari `a11y.js` lama. Hover-to-speak dan
  tab-to-speak sengaja tidak diikuti.
- 14 kunci i18n untuk kontrol pemutaran dan status di `id` + `en` (kini 67/67;
  paritas kunci dijaga uji unit).
- `test/unit/speechStub.js`: pengganti `speechSynthesis` yang dikendalikan
  test — sebuah uji memutuskan kapan utterance mulai dan selesai, jadi tidak
  ada timer atau tebakan waktu. Stub ini meniru `onend` yang dipicu Chromium
  di dalam `cancel()`.
- Harness pengujian: Vitest + jsdom (133 unit test untuk state, event bus,
  adapter penyimpanan, paritas kunci i18n, modul DOM, template panel, izin TTS,
  baca-saat-seleksi, dan integrasi `A11yWidget` lewat API publik) serta
  Playwright + axe-core (19 uji e2e terhadap `test/fixtures/playground.html`,
  termasuk pemindaian kontras pada panel widget sendiri dan pada seksi pembaca
  yang sedang aktif).
- `test/server.js`: server berkas statis tanpa dependensi untuk e2e.
- Budget ukuran lewat `size-limit` (`dist/a11y-widget.umd.min.js` ≤ 20 kB,
  `dist/a11y-widget.css` ≤ 8 kB) + skrip `size`, `test`, `test:e2e`,
  `test:coverage`, `prepack` (build sebelum packing) dan `pack:check`
  (`npm pack --dry-run`).
- `types/index.d.ts` sekarang menjangkau seluruh API publik (`A11yStrings`
  dengan 53 kunci, `LangOption`, `StateKey`, `PageChunk`, `SetStatePayload`,
  opsi `init`).
- Pemeriksaan tipe di sisi konsumen: `typescript` (dev-only) + `tsconfig.json` +
  `test/types/consumer.ts` yang mengimpor paket lewat nama itself
  (`@a11y-widget/core`) sehingga hanya lolos kalau `exports["."].types` benar,
  lengkap dengan `@ts-expect-error` untuk nilai yang harus ditolak. Skrip:
  `npm run typecheck`.
- Kondisi `exports["."].types`, field `sideEffects`, `publishConfig.access`,
  dan subpath `./dist/*` + `./package.json`.
- `LICENSE` (MIT), berkas ini, dan `.editorconfig`.

- Opsi `init({ migrateFrom: ['kebumen_a11y'] })`: preferensi yang disimpan build
  lama (atau widget berkas tunggal sebelum paket ini) dipindah ke `storageKey`
  sekali, lalu kunci lamanya dihapus. Kalau `storageKey` sudah berisi data,
  migrasi dilewati dan kunci lama dibiarkan utuh.
- `state.animationsExplicit` ikut dipersist sehingga pilihan "animasi menyala
  melawan `prefers-reduced-motion`" bertahan setelah reload (temuan #4).
- `sanitizeState()` + `loadStoredPatch()`: payload dari storage disaring — kunci
  tak dikenal dan nilai di luar daftar yang sah (mis. `contrast: 'neon'`) tidak
  lagi bisa menyentuh DOM, dan "belum pernah memilih" kini bisa dibedakan dari
  "memilih nilai default".

### Diperbaiki

- **Menghentikan pembaca malah melanjutkan ke blok berikutnya.** `cancel()`
  mengosongkan antrean sesudah `synth.cancel()`, padahal browser masih memicu
  `onend` untuk utterance yang baru dibuang; handler itu menaikkan
  `chunkIndex` lalu memanggil `speakChunk()` sementara antreannya masih penuh.
  Kini antrean dan callback dilepas sebelum `synth.cancel()`, jadi menekan
  "Berhenti" benar-benar berhenti dan tidak lagi melaporkan "selesai
  membacakan" yang palsu.
- `getPageContent()` hanya membaca `innerText`, sehingga halaman tanpa properti
  itu (jsdom, dokumen non-HTML) tidak menghasilkan teks sama sekali — dan
  kontrol pembaca tidak punya apa pun untuk dimainkan. Kini jatuh ke
  `textContent`.
- Dua permintaan bicara berurutan bisa memicu dua probe izin sekaligus, dan
  grant yang baru tidak tersimpan bila `sessionStorage` diblokir atau kuotanya
  habis. Probe kini tunggal (satu in-flight, permintaan terbaru menang) dan
  grant dipegang juga di memori.
- Label opsi panel saat `:hover` (`#0d6efd` di atas `#f0f4ff`, 10,5px) hanya
  4,3:1; token `--a11y-active-bg` dan latar hover tombol teks berada tepat di
  angka 4,50:1 — lulus tanpa sisa. Keduanya turun ke `$a11y-primary-dark`
  (5,8:1 dan 6,4:1).
- Uji e2e yang mengklik FAB lalu memindai dengan axe mengukur panel saat animasi
  `opacity` 0,22s masih berjalan, sehingga axe mencampur warna dengan halaman
  dan melaporkan rasio yang tidak pernah dilihat siapa pun. Scan kini menunggu
  panel mapan.
- `npm run lint` gagal total: `.eslintrc.js` memakai `module.exports` di paket
  `"type": "module"` → `ReferenceError: module is not defined`.
  Diganti menjadi `.eslintrc.cjs`.
- `textScale` menyimpan referensi elemen `<style>` yang bisa dilepas host saat
  `<head>` dibangun ulang (navigasi SPA, Turbo, manajer style). Semua aturan
  yang ditulis setelah itu hilang tanpa suara → kini dipasang ulang.
- Deklarasi TypeScript tidak terjangkau oleh resolver modern (`moduleResolution:
  "bundler"` / `"node16"`) karena `exports["."]` tidak punya kondisi `types`.
  Sekaligus: `setState()` dan `defaults` bertipe `Partial<A11yState>` sehingga
  menolak `{ tts: { rate: 1.2 } }` padahal `mergeState` mendukung merge sebagian
  untuk `tts` → tipe baru `SetStatePayload`.
- Kontras teks redup di panel: `$a11y-text-muted` `#6c757d` → `#5c666f`
  (badge footer hanya 4,26:1 di atas `$a11y-bg-hover`, syarat AA 4,5:1) dan
  `$a11y-dark-text-muted` `#9090a0` → `#a6a6bc` (4,46:1 di atas
  `$a11y-dark-bg-hover`). axe-core kini nol pelanggaran pada panel.

### Diubah

- `syncUI(state)` menjadi `syncUI(state, ttsView)`: panel butuh gambaran
  pemutaran (sedang bicara, dijeda, daftar suara, status) yang bukan bagian
  dari state yang dipersist. Kontrol transportasi sengaja **dinonaktifkan,
  bukan disembunyikan**, supaya tinggi seksi tidak berubah setiap kali pembaca
  mulai atau berhenti.
- Pengumuman screen reader memakai label yang terlihat di panel, bukan kunci
  state mentah: `"Kontras: Terbalik"` menggantikan `"Kontras: reverse"`,
  `"Sembunyikan gambar: aktif"` menggantikan `"hideImages: aktif"`.
- `options.defaults` tidak lagi menimpa preferensi yang sudah tersimpan.
  Sebelumnya pilihan pengunjung hilang setiap kali host mengubah nilai default.
- `destroy()` tidak lagi mengosongkan seluruh event bus: hanya langganan
  internal (termasuk opsi `onStateChange`) yang dilepas. Listener yang host
  pasang lewat `on()` tetap hidup dan menjadi tanggung jawab host (`off()`).
- `reset()` menghapus isi storage alih-alih menulis state default, sehingga
  kunjungan berikutnya benar-benar mulai bersih.
- `skipLink` melepas `id` yang ia suntikkan ke elemen utama host saat
  `destroy()`; kalau tidak ada elemen target yang bisa dituju, tautan skip tidak
  dibuat sama sekali (sebelumnya menunjuk ke `#a11y-main-content` yang tidak
  ada).
- `applyAnimations(enabled, explicit)` kini satu-satunya jalur flag eksplisit;
  `setUserExplicit()` dihapus dan `loadState()` diganti `loadStoredPatch()`.

- `playwright.config.js`: satu worker dan retries di CI setelah satu uji
  keyboard terbukti flaky saat berjalan paralel.
- README: tautan `npm install` dan CDN yang menunjuk paket belum terbit diganti
  catatan "belum dipublish".

## [1.0.0]

Ekstraksi pertama widget aksesibilitas dari berkas tunggal portal pemerintah
(legacy `a11y.js` / `a11y.css`) menjadi paket modular `src/` → `dist/` dengan
format ESM/CJS/UMD, stylesheet SCSS, locale `id`/`en`, dan 14 modul fitur.

---

## Sebelum paket ini bisa dipublish

- Buat npm org `a11y-widget` (scope `@a11y-widget/core` saat ini 404 dan tidak
  bisa diklaim tanpa org). Cadangan unscoped yang masih bebas: `wcag-widget`,
  `a11ykit`. Nama `a11y-widget` dan `a11y` sudah dipakai pihak lain.
- Ganti placeholder `TODO` pada `author` dan `repository.url` di `package.json`.
- Tentukan pemegang hak cipta pada `LICENSE` (kini tertulis "the a11y-widget
  contributors").
- Hapus catatan "belum dipublish" di README, atau pindahkan ke badge yang benar.
