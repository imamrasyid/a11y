# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Ditambahkan

- Opsi `contentSelectors` dan `excludeSelectors` untuk "Baca halaman": daftar
  pertama yang berisi teks menang, dan subpohon yang dikecualikan (navigasi,
  footer, `header`, `aside`, UI widget itu sendiri) tidak ikut dibacakan.
  Selector yang tidak bisa diparsing dibuang dengan `console.warn`, bukan
  merobohkan pembaca.
- Opsi `fallbackLang`: locale yang dipakai teks panel ketika `lang` tidak punya
  string pack. `lang: 'jv'` tetap memilih suara Jawa.
- Tiap locale pack punya `speechRules` sendiri (`src/i18n/id.js`, `en.js`),
  dibaca lewat `getSpeechRules(lang)`.
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
- Harness pengujian: Vitest + jsdom (153 unit test untuk state, event bus,
  adapter penyimpanan, paritas kunci i18n, modul DOM, template panel, izin TTS,
  aturan ucapan per-locale, konten mana yang boleh dibacakan,
  baca-saat-seleksi, dan integrasi `A11yWidget` lewat API publik) serta
  Playwright + axe-core (19 uji e2e terhadap `test/fixtures/playground.html`,
  termasuk pemindaian kontras pada panel widget sendiri dan pada seksi pembaca
  yang sedang aktif).
- `test/server.js`: server berkas statis tanpa dependensi untuk e2e.
- Budget ukuran lewat `size-limit` (`dist/a11y-widget.umd.min.js` ≤ 13 kB,
  `dist/a11y-widget.css` ≤ 4 kB; hasil saat ini 12,66 kB dan 3,52 kB brotli, jadi
  anggarannya cuma menyisakan ruang naik beberapa persen — itulah gunanya) +
  skrip `size`, `test`, `test:e2e`, `test:coverage`, `prepack` (build sebelum
  packing) dan `pack:check` (`npm pack --dry-run`).
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
- Opsi `scaleBase` (`number | 'auto'`, default `'auto'`): ukuran dasar teks
  halaman diukur sekali saat `init()` dari `getComputedStyle(body).fontSize` —
  jatuh ke `<html>` lalu 16px kalau tidak ada layout engine. Angka 14px warisan
  tidak lagi jadi asumsi diam-diam.
- Opsi `styleNonce`: nonce CSP dipasang ke elemen `<style>` **sebelum** elemen
  itu disisipkan ke `<head>` (nonce setelah penyisipan diabaikan browser), jadi
  pengatur ukuran teks survive pada `style-src` yang ketat.
- Token warna baru di `:root` — `--a11y-accent`, `--a11y-warn-bg`,
  `--a11y-warn-text`, `--a11y-danger-bg`, `--a11y-danger-text` — masing-masing
  dengan pasangan gelap yang ikut di-`@include dark-surface`.
- `--a11y-scale-ratio` (default `1`) dibaca host yang punya type scale sendiri:
  `font-size: calc(1rem * var(--a11y-scale-ratio))`.
- Lima uji e2e yang mengukur hasil render betulan (`what the controls paint`):
  ukuran teks host 13px→26px sementara bagian bertuliskan px absolut dibiarkan,
  caption gambar yang benar-benar menempati ruang (termasuk gambar yang disuntik
  setelah render awal), reset `outline` milik situs yang dikembalikan modus
  keyboard, rata-kiri yang tidak meratakan panel, dan mode gelap yang benar-benar
  mengubah permukaan panel. Diukur di Chromium sungguhan, bukan jsdom.
- `demo/index.html` + `npm run demo`: halaman contoh yang memuat `dist/` lewat tag
  `<script>` persis seperti situs tanpa bundler, dengan tombol-tombol
  `setState()` dan tabel atribut `data-a11y-*` yang hidup — jadi terlihat siapa
  yang menulis atribut dan siapa yang menggambar hasilnya.
- `test/e2e/demo.spec.js`: demo diuji seperti kode yang dikirim — tanpa
  `console.error`/`warning` saat mount, tombolnya benar-benar mengubah atribut,
  panel tidak ikut membesar saat halaman di-zoom, dan axe memindai seluruh
  halaman itu.
- Pemindaian axe tambahan: panel dalam `prefers-color-scheme: dark` (bukan hanya
  dalam mode kontras), karena mode gelap baru hidup di rilis ini.
- `CONTRIBUTING.md` (kontrak dua lapis atribut/CSS, aturan token dark mode,
  cara menambah locale, larangan terjemahan mesin tanpa penutur asli, gaya
  commit), `SECURITY.md` (permukaan yang disentuh: nol dependensi, tanpa
  jaringan, kunci storage, mana yang ditulis dengan `textContent`), dan
  `.github/workflows/ci.yml` yang menjalankan semua gate di atas.
- `.nvmrc` supaya Node yang dipakai developer sama dengan yang di CI.

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
- **Fokus bisa tertinggal di panel yang sudah tertutup.** `openPanel()`
  memindahkan fokus ke kontrol pertama lewat `setTimeout(..., 50)`, jadi
  pengunjung yang menekan Escape (atau menutup dari luar) di dalam 50 ms itu
  kehilangan fokusnya lagi ke panel yang sudah `aria-hidden` — pengguna keyboard
  tertinggal di widget yang tidak terlihat. Timer kini memeriksa apakah panel
  masih terbuka.
- Selector portal `.post-details-article` tidak lagi di-hardcode di
  `getPageContent()`; situs yang memakainya menuliskannya sendiri lewat
  `contentSelectors`.
- `initI18n` mengembalikan Bahasa Indonesia secara diam-diam untuk kode yang
  tidak dikenal — bahkan ketika `baseLang: 'en'` diminta, dan tanpa satu pun
  pesan. Kini fallback itu dihormati dan kode tak dikenal dilaporkan ke console.
- Aturan normalisasi tidak lagi jadi satu daftar raksasa di mesin TTS:
  `Rp.`/`Kab.`/`DPRD` kini milik pack `id`, sehingga bahasa lain tidak pernah
  membacanya. `&` ikut berpindah — bukan simbol universal, karena diucapkan
  sebagai kata ("dan" / "and").
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
- **Mode gelap sebelumnya kode mati.** `_dark.scss` hanya menata ulang properti
  lewat `var(--a11y-*)`, sementara aturan panel, komponen, dan seksi pembaca
  masih menulis heksimal hasil compile — jadi mengaktifkan kontras terbalik tidak
  mengubah apa pun pada permukaan widget. Semua aturan permukaan kini memakai
  tokennya, dan `data-a11y-contrast: reverse` benar-benar terlihat.
- Mengaktifkan mode gelap memaksa beberapa pasangan warna diperiksa ulang:
  `$a11y-danger-text` `#dc3545` di atas chip merah muda hanya 3,86:1 (gagal AA)
  → `#b02531` (5,67:1 di atas chip, 6,66:1 di atas putih); teks aksen brand
  `#0d6efd` di atas putih 4,50:1 tanpa sisa → `$a11y-accent`
  `#0a58ca` (6,44:1), dengan aksen gelap `#8ab8ff` (6,92:1 di atas `#2a2a3e`).
  Tombol "Izinkan" pada prompt TTS ikut naik dari tepat-4,50 ke 6,44.
- **Caption gambar diperbaiki, bukan disederhanakan.** Build lama menambah
  `<span class="a11y-img-caption">` di belakang tiap `<img>` saat init: gambar
  yang datang kemudian (ajax, rute SPA, galeri) tidak dapat caption, dan
  pembaca layar mendengar teks alt dua kali. Percobaan pertama menggantinya dengan
  satu aturan CSS `img[alt]::after { content: attr(alt) }` — dan gaya terukur
  tetap melaporkan teksnya padahal tidak ada satu piksel pun yang digambar:
  elemen pengganti yang muatannya sudah terpasang tidak menghasilkan kotak
  `::before`/`::after` di Chromium maupun Firefox. Jadi span sisip kembali dipakai,
  dengan dua cacat legacy dibereskan: `aria-hidden="true"` sehingga alt tetap
  terdengar sekali, dan ada pengawas perubahan DOM (`MutationObserver`) selama fiturnya
  menyala sehingga gambar yang tiba belakangan ikut tercaption. Alt kosong
  (gambar dekoratif) tetap tanpa teks, dan mematikan fiturnya menghapus semua
  span yang ia tambah.
- `text-align: revert !important` pada `.a11y-panel *` tidak hanya membatalkan
  sapuan rata-kiri host — `revert` menarik kembali seluruh origin penulis,
  sehingga deklarasi milik widget ikut hilang (readout ukuran teks kehilangan
  perataannya). Sapuan kini memakai `:not()` pada panel dan prompt TTS, sehingga
  tidak pernah menyentuh UI sendiri. Daftar `:not()` tujuh kelas diganti satu
  pola yang sama.
- Modus keyboard mengembalikan cincin fokus yang situs matikan secara agresif.
  Aturan `outline: none !important` pada `:focus` butuh `!important` juga untuk
  dikalahkan; aturan itu (dan pengecualian hover FAB, dan penjaga
  `visibility/opacity/top` penanda baca) hilang saat ekstraksi paket dan sudah
  dipulihkan.
- Penanda baca (reading guide) kini mati total saat fiturnya dimatikan:
  `display: none` saja masih menempatkan elemen di puncak viewport, jadi aturan
  host yang menulis ulang `display` (print sheet, reset dengan spesifisitas lebih
  tinggi) bisa memunculkan palang biru nyasar. Elemen sekarang juga digeser ke
  `top: -100px` plus `visibility/opacity` nol.

### Diubah

- `getPageContent(options)` menerima `contentSelectors`/`excludeSelectors`;
  `DEFAULT_REPLACEMENTS` berganti menjadi `UNIVERSAL_REPLACEMENTS` (hanya `+`),
  dan `addReplacements`/`setReplacements`/`resetReplacements`/`getReplacements`
  sekarang hanya menyentuh lapisan aturan milik host — aturan locale tidak bisa
  lagi ditimpa dari luar.
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
- `textScale` tidak lagi menulis ukuran piksel milik sendiri untuk `span`, `p`,
  `li`, `td`, `th` dan tiap level heading. Yang ditulis sekarang cuma `font-size`
  `<html>` dan `<body>` (ukuran dasar terukur × rasio, `!important`),
  `--a11y-scale-ratio`, dan satu blok yang mengembalikan UI widget ke ukuran dasar
  halaman sehingga panel tidak ikut membesar. Konsekuensi yang disengaja: teks
  yang situs kunci ke piksel absolut tidak ikut membesar — cascade itu jadi milik
  host.
- Ukuran dasar diukur **sekali** saat `init()`. `applyTextScale()` tidak pernah
  membaca `<body>` lagi, karena membaca balik ukuran yang barusan ditulis akan
  menggandakan 120% menjadi 144% lalu 172% dan terus melenceng tiap klik.
- Normalisasi internal panel bukan `.a11y-panel * { font-size: <tetap> }` —
  `*` akan meratakan skala tipografi panel sendiri (judul 15px, label opsi
  10,5px, readout 12px jadi satu ukuran semua). Yang dipakai blok pin pada empat
  akar UI widget: `.a11y-panel, .a11y-fab, .a11y-tts-prompt, .a11y-skip-link`.
- Modul gambar tidak lagi punya `destroyImages()` di permukaan publik:
  `resetImages()` sudah melepas atribut, span caption, dan pengawasnya, dan itu
  yang dilalui `destroy()`. Yang tersisa cuma `applyHideImages`,
  `applyImgCaptions`, dan `resetImages`.
- `playwright.config.js`: satu worker dan retries di CI setelah satu uji
  keyboard terbukti flaky saat berjalan paralel.
- README: tautan `npm install` dan CDN yang menunjuk paket belum terbit diganti
  catatan "belum dipublish".
- README tidak lagi menyuruh `import ... from "@a11y-widget/core/src/core/storage.js"`:
  jalur dalam `src/` memang tidak ada di peta `exports`, jadi contoh itu tidak
  akan pernah selesai di-resolve. Adapter storage cukup objek dengan tiga
  metode — `sessionStorage` sendiri sudah sah — dan hanya `.` / `./css` /
  `./scss` / `./dist/*` yang dijamin.
- Catatan "Dark mode" di README diperjelas: yang ikut skema sistem adalah kaca
  panel itu sendiri, bukan halaman situs; mode kontras dari panel adalah hal lain.
  Tabel atribut kini punya kolom "siapa yang bertindak" dan memuat
  `data-a11y-img-titles` yang sebelumnya hilang dari dokumentasi.
- Dua batasan ditulis apa adanya di README: teks yang situs kunci ke piksel
  absolut tidak ikut membesar, dan sebuah widget aksesibilitas bukan klaim
  conform — halaman aslinya tetap harus lolos WCAG sendiri.

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
