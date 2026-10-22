# HOWELL CATCH & WIN
## Official Promotional Mobile Web Arcade Game — INDOCOMTECH 2026

**HOWELL CATCH & WIN** adalah game mobile web arcade 2D berkecepatan tinggi yang dikembangkan secara khusus untuk pengunjung booth **HOWELL Indonesia di pameran INDOCOMTECH 2026**.

Pemain mengendalikan **Totebag Resmi HOWELL** di bagian bawah layar untuk menangkap berbagai produk elektronik & kabel resmi HOWELL yang berjatuhan dari atas layar selama **30 detik**, sambil menghindari bom dan barang rusak untuk mengumpulkan skor tertinggi dan memenangkan hadiah pameran.

---

## 🎮 Fitur Utama Game

1. **Aset Produk Asli 100% Authentic HOWELL**:
   - 10 Produk Asli HOWELL dengan poin berbeda:
     - **TWS** (+20 poin)
     - **Earphone** (+15 poin)
     - **AUDIO CABLE** (+10 poin)
     - **POWER CABLE** (+10 poin)
     - **Adapter HW-C04** (+20 poin)
     - **TWS HW02** (+20 poin)
     - **CAT 8 FTP Cable** (+15 poin)
     - **DisplayPort 16K Cable** (+15 poin)
     - **HDMI 16K Cable** (+15 poin)
     - **USB 2.0 AM - AM** (+10 poin)
2. **Catcher Totebag HOWELL Asli**:
   - Menggunakan foto totebag resmi HOWELL dengan proporsi autentik.
   - Deteksi tangkapan tepat di bibir bukaan tas (*opening catch zone* di bawah tali selempang).
   - Animasi item terhisap dan masuk ke dalam kantong tas totebag secara realistis.
3. **Rintangan & Bahaya**:
   - 💣 **Bom Arcade**: Mengurangi 1 hati/nyawa, efek ledakan partikel, guncangan layar (*screen shake*), dan kilatan merah. Game selesai jika 3 nyawa habis.
   - ⚠️ **Barang Rusak (RUSAK)**: Mengurangi 10 poin dan mereset combo beruntun.
4. **Power-Up Items**:
   - **Double Score (2X)**: Menggandakan poin tangkapan selama 5 detik.
   - **Magnet Produk**: Menarik produk HOWELL terdekat langsung ke totebag selama 4 detik (tidak menarik bom/barang rusak).
   - **Slow Motion**: Memperlambat laju jatuhnya barang selama 3 detik.
   - **Extra Life (+1)**: Menambah 1 hati nyawa (maksimal 3).
   - **Bonus Poin (+30)**: Langsung menambahkan +30 poin instan.
5. **Sistem Combo Beruntun**:
   - 3x Tangkapan Berturut-turut: **NICE!** (+5 Poin)
   - 5x Tangkapan Berturut-turut: **GREAT!** (+10 Poin)
   - 10x Tangkapan Berturut-turut: **HOWELL MASTER!** (+25 Poin)
6. **Sistem Audio Web Audio API**:
   - Suara arcade retro 8-bit responsif berlatensi 0ms tanpa perlu unduhan file audio eksternal.
   - SFX: Klik tombol, tangkap produk, power-up, combo, ledakan bom, barang rusak, hitungan 5 detik terakhir, game over, dan lagu perayaan high score.
   - Tombol Mute/Unmute audio.
7. **Papan Peringkat (Leaderboard Demo)**:
   - Menyimpan Top 10 skor tertinggi pengunjung secara lokal via `LocalStorage`.
   - Form input nama panggilan pengunjung setelah permainan selesai.
8. **Sistem Hadiah Pameran (Reward Tiers)**:
   - `0 - 80 Poin`: **Voucher Partisipasi** (Diskon 10% di booth)
   - `81 - 150 Poin`: **Hadiah Kecil** (Gantungan Kunci / Merchandise)
   - `151 - 220 Poin`: **Aksesori HOWELL** (Kabel High-Speed pilihan)
   - `221+ Poin`: **Hadiah Spesial** (TWS / Adapter Fast Charger GaN 65W)
   - Disertai kode voucher simulasi demo untuk ditunjukkan ke staf booth.

---

## 📁 Struktur Direktori Proyek

```text
howell-catch-win/
├── index.html                  # Halaman utama game
├── css/
│   ├── style.css               # Desain global, tema teknologi, tombol, modal
│   ├── game.css                # HUD gameplay, animasi, layar hasil & tutorial
│   └── responsive.css          # Desain adaptif portrait 9:16 & safe-area iOS/Android
├── js/
│   ├── config.js               # Konfigurasi terpusat (skor, aset, kesulitan, audio)
│   ├── storage.js              # Penyimpanan skor & pengaturan ke LocalStorage
│   ├── assetManager.js         # Preloader aset dengan fallback dinamis
│   ├── audio.js                # Web Audio API Synthesizer (SFX & BGM)
│   ├── player.js               # Kontrol totebag, animasi telan item & fisika tilt
│   ├── items.js                # Sistem item jatuh, spawner & magnet
│   ├── powerups.js             # Durasi & multiplier power-up
│   ├── scoring.js              # Logika skor, combo, teks melayang & partikel
│   ├── collision.js            # Algoritma tabrakan zona bukaan totebag
│   ├── rewards.js              # Penentuan tier hadiah & arsitektur klaim
│   ├── leaderboard.js          # Pengelolaan daftar peringkat pemain
│   ├── ui.js                   # Manajemen perpindahan layar & update HUD
│   ├── game.js                 # Game loop requestAnimationFrame 60 FPS
│   └── main.js                 # Entry point inisialisasi & developer debug
├── assets/
│   ├── branding/
│   │   ├── howell-logo.png
│   │   └── howell-logo-white.png
│   ├── player/
│   │   ├── howell-totebag.png
│   │   └── hd/
│   ├── products/
│   │   ├── tws.png
│   │   ├── earphone.png
│   │   ├── audio-cable.png
│   │   ├── power-cable.png
│   │   ├── adapter-hwc04.png
│   │   ├── tws-hw02.png
│   │   ├── cat8-ftp.png
│   │   ├── displayport-16k.png
│   │   ├── hdmi-16k.png
│   │   ├── usb2-am-am.png
│   │   └── hd/
│   └── icons/
│       ├── bomb.svg
│       ├── damaged.svg
│       ├── powerup-2x.svg
│       ├── powerup-magnet.svg
│       ├── powerup-slow.svg
│       ├── powerup-heart.svg
│       └── powerup-bonus30.svg
├── README.md
└── .gitignore
```

---

## 🚀 Panduan Menjalankan Secara Lokal

Game ini menggunakan standard ES Modules (`import/export`), sehingga perlu dijalankan menggunakan web server lokal ringan:

### Cara 1: Menggunakan Node.js `npx serve` (Paling Cepat)
Buka Terminal/PowerShell di folder game dan ketik:
```bash
npx serve . -p 8080
```
Lalu buka browser di: `http://localhost:8080`

### Cara 2: Menggunakan VS Code Live Server
1. Buka folder `howell-catch-win` di Visual Studio Code.
2. Pasang ekstensi **Live Server**.
3. Klik kanan pada file `index.html` dan pilih **Open with Live Server**.

### Cara 3: Menggunakan Python (Jika terpasang)
```bash
python -m http.server 8080
```

---

## 🌐 Akses Langsung di Booth & Panduan Deployment

Game ini dapat dimainkan langsung secara praktis **tanpa perlu QR Code**:

### 1. Mainkan Langsung di Tablet / Kiosk Booth (Layar Display)
- Buka browser di tablet, smartphone display, atau layar sentuh laptop di booth.
- Jalankan `start-game.bat` (atau `http://localhost:8080`).
- Tekan **F11** di keyboard (atau menu browser **Add to Home screen / Fullscreen**) agar game tampil penuh layaknya aplikasi native.
- Pengunjung yang mampir ke booth bisa langsung antre dan bermain bergantian di perangkat yang disediakan!

### 2. Akses via Tautan Web Langsung (GitHub Pages)
Jika ingin game bisa dibuka online cukup dengan membagikan atau mengetikkan link langsung:
1. Masukkan proyek ke repositori GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Howell Catch & Win mobile game for Indocomtech 2026"
   git branch -M main
   git remote add origin https://github.com/USERNAME/howell-catch-win.git
   git push -u origin main
   ```
2. Buka GitHub > **Settings** > **Pages**:
   - Di bagian **Source**, pilih branch `main` dan folder `/ (root)`. Klik **Save**.
3. Game langsung dapat diakses siapa saja melalui URL:
   `https://USERNAME.github.io/howell-catch-win/`
   *(Pengunjung atau staf cukup membuka link tersebut langsung di browser HP masing-masing)*.

---

## 🛠️ Mode Debug Pengembang (Developer Debug Mode)

Mode debug memvisualisasikan:
- FPS aktual (Target 60 FPS).
- Jumlah objek jatuh aktif di memori.
- Fase kesulitan (Easy / Medium / Hard) dan kecepatan jatuh (px/detik).
- Interval spawn objek.
- **Garis kotak tabrakan (*hitboxes*)** untuk setiap produk, bom, dan power-up.
- **Zona bukaan mulut totebag (*mouth collision opening*)**.

### Cara Mengaktifkan Mode Debug:
1. **Desktop**: Tekan tombol `D` pada keyboard.
2. **Mobile**: Ketuk logo HOWELL sebanyak 3 kali secara cepat di layar menu.
3. **URL Param**: Buka game dengan parameter `?debug=1` (misal: `index.html?debug=1`).

---

## 🔒 Arsitektur Integrasi Hadiah Produksi

Saat menghubungkan ke server produksi untuk validasi hadiah fisik:
1. Client mengirim payload sesi permainan terenkripsi (skor, timestamp mulai-selesai, token sesi acak).
2. Backend memvalidasi integritas data (memastikan waktu bermain tepat 30 detik dan perolehan skor realistis).
3. Backend menerbitkan kode klaim voucher tunggal (*single-use claim token/code*).
4. Staf booth memvalidasi kode voucher menggunakan portal/aplikasi staf HOWELL untuk menandai hadiah telah diambil dan mencatat pengurangan stok barang secara *real-time*.

---

© 2026 PT Howell Niaga Indonesia. Seluruh hak cipta dilindungi undang-undang.
INDOCOMTECH 2026 Exhibition Promotional Project.
