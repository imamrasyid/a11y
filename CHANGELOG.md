# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Ditambahkan

- Harness pengujian: Vitest + jsdom (73 unit test untuk state, event bus,
  adapter penyimpanan, paritas kunci i18n, modul DOM, template panel, dan
  integrasi `A11yWidget` lewat API publik) serta Playwright + axe-core
  (12 uji e2e terhadap `test/fixtures/playground.html`, termasuk pemindaian
  kontras pada panel widget sendiri).
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
