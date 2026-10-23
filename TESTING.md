# Hasil QA — 22 Oktober 2026

## Pengujian otomatis aktual

`node --test tests/*.test.js`: **11 lulus, 0 gagal**.

1. Semua 10 produk dapat dipilih dan nilai poin cocok dengan konfigurasi.
2. Satu objek tidak diberi skor dua kali; kombo 10 muncul.
3. Bom mengurangi nyawa, hazard mereset kombo, skor tidak negatif.
4. Kelima bonus bekerja; durasi berakhir dan nyawa dibatasi tiga.
5. Pergantian difficulty, batas timer 30 detik, state awal bersih.
6. Tabrakan sweep pada bukaan tas menolak sisi dan objek di bawahnya.
7. Batas setiap kategori hadiah.
8. Pause/resume berulang tidak menjadwalkan loop ganda.
9. Magnet menggerakkan produk, bukan bom atau paket rusak.
10. Seluruh sebelas file aset tersedia.
11. Loader dengan seluruh gambar gagal tetap selesai dan melaporkan missing assets.

Semua modul JavaScript juga diperiksa dengan `node --check`.

## Pengujian browser aktual

Dilakukan di browser bawaan desktop dengan viewport desktop, 390 × 844, dan 360 × 640. Ini pengujian ukuran tampilan, bukan perangkat Android/iPhone fisik.

- Beranda, gambar produk/totebag, tutorial, dan tombol mulai muncul.
- Permainan berjalan; objek produk, bom, dan bonus terlihat jatuh.
- Catch menaikkan skor; bom menurunkan nyawa. Satu ronde selesai dengan 135 poin.
- Jeda menahan timer pada 1 detik meski pemeriksaan lain berlangsung; lanjutkan menghasilkan layar akhir.
- Restart mengembalikan skor 0, waktu 30, dan 3 nyawa.
- Nama uji dan skor disimpan, lalu tetap terlihat di papan skor setelah reload.
- Pointer drag pada 360 × 640 memindahkan tas ke kanan dan tetap di dalam arena.
- Layout gameplay pada dua ukuran ponsel tidak terpotong. Beranda/tutorial dapat digulir vertikal bila layar pendek; tidak ada overflow horizontal yang teramati.
- Tidak ada warning/error pada log konsol saat pemeriksaan sesi utama.
- Dekorasi hero yang menghalangi tombol mulai pada layar kecil ditemukan, diperbaiki dengan pointer-events:none, dan tombol dites ulang berhasil.

## Batas verifikasi

- Belum diuji pada Android Chrome/iPhone Safari fisik, multitouch, perubahan orientasi perangkat fisik, ataupun Safari audio autoplay.
- Belum diukur FPS 60 pada perangkat kelas bawah, konsumsi baterai, atau performa koneksi booth.
- Audio dibuat dengan Web Audio dan tidak menghasilkan error pada sesi browser, tetapi kualitas/volume suara belum diverifikasi melalui pendengaran perangkat fisik.
- Jalur assets yang hilang diuji pada loader, bukan simulasi kegagalan jaringan browser end-to-end.
- Tidak ada backend hadiah atau ranking global; tidak ada klaim pengujian keamanan penukaran hadiah produksi.
- GitHub Pages belum dipublikasikan. Jalur relatif telah dipersiapkan, tetapi deployment nyata belum diuji.

Lakukan acceptance test di perangkat booth dan ponsel target sebelum acara. Data uji lokal berlabel “Uji Howell” hanya ada di browser pratinjau, tidak dikemas dalam sumber game.
