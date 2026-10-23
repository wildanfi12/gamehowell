# HOWELL Catch & Win

Game arcade web berbahasa Indonesia untuk demo INDOCOMTECH 2026. Dibangun dengan Canvas, ES modules, CSS, dan Web Audio. Tanpa framework, CDN, font eksternal, atau instalasi paket.

## Membuka langsung (paling mudah)

Buka `HOWELL-MAIN-LANGSUNG.html` yang diberikan terpisah dengan klik ganda, lalu pilih Chrome atau Edge. Semua gambar, CSS, dan JavaScript sudah berada di dalam file tersebut; tidak perlu server, Node.js, atau koneksi internet.

Untuk versi folder, ekstrak ZIP seluruhnya dahulu, lalu buka `index.html`. Versi ini sekarang memakai script biasa sehingga tidak lagi bergantung pada ES modules saat dibuka langsung. Jangan membuka index.html dari dalam pratinjau ZIP.

## Menjalankan lewat server (opsional)

1. Ekstrak ZIP ke folder pilihan.
2. Pasang Node.js LTS bila belum tersedia.
3. Buka terminal di folder yang berisi `package.json`.
4. Jalankan `npm start`.
5. Buka `http://127.0.0.1:4173`.

Alternatif jika Python tersedia: `python -m http.server 8080 --bind 127.0.0.1`, lalu buka `http://127.0.0.1:8080`. Server bawaan hanya mendengarkan localhost. Untuk mencoba di smartphone, gunakan hosting HTTPS sebagaimana langkah GitHub Pages di bawah.

Setelah mengedit modul sumber di `js/`, jalankan `node build.mjs` untuk memperbarui `js/app.js` dan file HTML satu berkas. `index.html` menggunakan `js/app.js`.

## Fitur

- 30 detik, tiga nyawa, 10 jenis produk asli dengan poin konfigurabel.
- Tote bag asli; kontrol drag Pointer Events, mouse, dan tombol panah/A/D.
- Tabrakan hanya ketika produk melewati bukaan tas. Produk masuk dengan mengecil dan memudar di belakang foto tas.
- Bom, paket rusak generik, lima bonus: poin ganda 5 detik, magnet 4 detik, lambat 3 detik, nyawa maksimal tiga, dan +30 poin. Bonus +30 juga digandakan ketika poin ganda aktif.
- Kombo 3, 5, 10 tangkapan: KEREN!, HEBAT!, MASTER HOWELL! Kombo direset oleh hazard, bukan produk yang terlewat.
- Kesulitan bertahap pada detik 10 dan 20. Lane spawn bergantian untuk mengurangi tumpukan.
- Layar loading, beranda, tutorial, gameplay, jeda, hasil, papan skor, dan hadiah.
- Pause otomatis saat tab tersembunyi atau jendela kehilangan fokus. Resume manual.
- Efek suara sintetis, tanpa file audio eksternal; audio dimulai setelah interaksi pengguna. Tidak ada musik latar.
- Rekor otomatis disimpan. Papan skor perlu tombol Simpan setelah memasukkan nama; satu entri per ronde. Maksimum 50 entri disimpan, 20 ditampilkan. Tidak ada data yang dikirim ke server.
- Reduced motion, safe-area, penyesuaian ukuran canvas, dan DPR maksimum 2.

## Konfigurasi

Edit `js/config.js`: durasi, nyawa, ukuran objek dan tas, nilai poin, bobot produk, interval spawn, probabilitas hazard/bonus, kecepatan tiap tahap, durasi bonus, volume, ambang hadiah, dan lokasi aset. `debug: true` menampilkan FPS, jumlah objek, state, interval, kecepatan, dan hitbox bukaan tas.

`mode: 'demo'` mendokumentasikan lingkungan aktif. Mengganti nilainya tidak mengaktifkan layanan hadiah: demo UI tetap berlaku sampai integrasi server yang sebenarnya dibuat.

## Aset

Semua 10 foto produk dan totebag berasal dari file individual yang diberikan pengguna. Salinan runtime dipotong hanya pada margin transparan, lalu diperkecil proporsional ke maksimum 520 piksel dan dikompresi PNG lossless. Isi produk, warna, label, dan branding tidak digambar ulang. File sumber pada drive D tidak diubah. Total gambar sekitar 2,6 MB.

Pemetaan file terdapat di `PRODUCTS` pada `js/config.js`. Totebag ada di `assets/player/howell-totebag.png`. Ganti file tersebut dengan PNG transparan resmi dengan proporsi yang sama. Untuk tas berbeda, kalibrasikan `bag.openingY`, `openingWidth`, `width`, dan `height`, lalu cek hitbox dengan debug. Aset hilang memunculkan penanda sementara dan pemberitahuan tanpa menghentikan game.

**Aset yang belum tersedia:** file logo HOWELL mandiri. Header saat ini memakai teks tipografis sementara; bukan reproduksi logo resmi. Logo asli tetap terlihat pada totebag dan foto produk. Situs referensi `https://wildanfi12.github.io/Howell/` tidak dapat diakses saat pengerjaan. Untuk mengganti header, tambahkan logo resmi ke `assets/branding/` lalu ganti isi tautan `#brand` dengan elemen img berukuran proporsional. Warna aksen diambil secara visual dari tas, bukan klaim kode warna merek resmi.

## GitHub dan GitHub Pages

1. Buat repository baru, misalnya `howell-catch-win`, di akun GitHub Anda.
2. Pilih **Add file → Upload files**. Unggah isi folder ini: index.html, css, js, assets, dan berkas lain. Pastikan index.html langsung berada di root repository, bukan dalam folder tambahan.
3. Commit perubahan ke branch `main`.
4. Di **Settings → Pages**, pilih **Deploy from a branch**, branch **main**, folder **/(root)**, lalu Save.
5. Tunggu proses deployment selesai. Alamat biasanya `https://NAMA-AKUN.github.io/howell-catch-win/`; gunakan URL yang ditampilkan GitHub Pages.
6. Buka URL pada ponsel Android dan iPhone, uji drag, audio, jeda, dan satu ronde penuh sebelum dipakai di booth.

Semua jalur CSS, JavaScript, dan gambar relatif sehingga dapat digunakan pada subdirektori proyek GitHub Pages. Tidak perlu build. File `server.mjs` hanya untuk pratinjau lokal, bukan backend hadiah.

## QR code

Setelah URL HTTPS terbit, buka halaman di Chrome dan gunakan menu berbagi **Create QR code/Buat kode QR** jika tersedia, atau generator QR tepercaya dengan URL publik tersebut. Unduh PNG/SVG, cetak dengan kontras tinggi dan ruang putih, lalu pindai hasil cetaknya menggunakan Android dan iPhone. Jangan gunakan localhost untuk QR booth. Belum ada QR final karena game belum dipublikasikan.

## Hadiah dan keamanan produksi

Hadiah adalah simulasi. Tidak ada stok nyata, kode klaim, atau penukaran yang aktif. Papan skor dan rekor di LocalStorage bisa dimanipulasi dan tidak boleh menjadi dasar pemberian hadiah nyata.

`js/backend.js` menyediakan kontrak klien opsional. Lihat `BACKEND.md` untuk desain validasi sesi, stok, claim, otorisasi petugas, dan transaksi. Modul ini sengaja tidak dihubungkan ke demo; server harus dibangun serta diuji sebelum aktivasi produksi. Tidak ada API secret pada frontend.

## Pengujian

Jalankan `npm test`. Rincian pengujian aktual dan keterbatasannya tersedia di `TESTING.md`.

## Struktur

`js/config.js`: konfigurasi dan manifest. `rules.js`: aturan murni. `game.js`: loop, input, spawn, collision, rendering, efek. `assets.js`: preload dan fit proporsional. `audio.js`: suara. `main.js`: layar dan interaksi. `storage.js`: penyimpanan lokal. `backend.js`: kontrak integrasi opsional. `tests/`: pengujian Node bawaan.

## Pembaruan bom PAJAK
Bom menggunakan assets/products/bomb-pajak.png, salinan identik dari aset pengguna. Tulisan dan font PAJAK tetap bagian gambar asli. Animasi memakai rotasi lembut, perubahan skala proporsional, dan cahaya berdenyut; berhenti saat jeda dan mengikuti reduced-motion. Ukuran bom 82 piksel logis dapat diubah di CONFIG.bombSize. File HTML langsung sudah menyertakan gambar ini. Total aset sekarang 12 gambar.

