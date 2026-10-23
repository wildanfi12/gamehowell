# Kontrak backend produksi (belum diimplementasikan)

Demo berjalan penuh tanpa backend. Jangan mempercayai skor, jam, event, atau entitlement yang dihitung klien. Integrasi berikut adalah rancangan, bukan layanan aktif.

## Alur

1. `POST /sessions`: server menerbitkan ID acak, seed spawn, rulesVersion, issuedAt, expiresAt. Batasi satu sesi aktif per peserta dan rate-limit per peserta/IP dengan toleransi Wi-Fi booth bersama. Session terikat cookie Secure/HttpOnly/SameSite dan identitas peserta yang disepakati.
2. Klien merekam input posisi x beserta urutan/timestamp selama permainan. Untuk hadiah nyata, ubah random spawn klien menjadi PRNG deterministik dengan seed server dan langkah simulasi tetap yang sama dengan server. Implementasi demo saat ini memakai Math.random; belum cocok untuk validasi produksi.
3. `POST /sessions/finish`: kirim sessionId dan inputEvents. Server memvalidasi kedaluwarsa, urutan, rentang koordinat, durasi, laju event dan batas ukuran payload; jalankan ulang simulasi untuk menghitung skor. Jangan menerima skor klien sebagai otoritas. Tolak sesi yang sudah diselesaikan. Pemeriksaan replay membatasi manipulasi skor, tetapi tidak membuktikan pemain manusia; perlu kontrol booth/rate-limit sesuai risiko.
4. Server menentukan kategori hadiah dari skor tervalidasi dan konfigurasi acara, lalu membuat entitlement unik untuk sessionId dalam transaksi.
5. `POST /claims`: request membawa entitlementId dan idempotencyKey. Server memvalidasi kepemilikan, masa berlaku, serta satu klaim per peserta/acara. Reservasi stok secara atomik; tolak bila habis. Hasil berupa kode acak kuat yang diterbitkan server, simpan hash kode dan masa berlaku, jangan kode berbasis skor/waktu browser.
6. `POST /staff/redemptions`: hanya akun petugas terautentikasi dengan role yang tepat; cek CSRF/origin. Dalam satu transaksi, ubah claim status reserved→redeemed dengan conditional update, kurangi reserved stock, tambah redeemed count, tulis audit petugas/waktu, dan simpan hasil idempotency. Redeem ulang gagal atau mengembalikan respons idempoten sebelumnya.

## Tabel minimum

- sessions(id, participant_id, seed, rules_version, status, issued_at, expires_at, validated_score)
- entitlements(id, session_id UNIQUE, participant_id, tier, expires_at)
- prizes(id, tier, total_stock, reserved_stock, redeemed_stock)
- claims(id, entitlement_id UNIQUE, code_hash UNIQUE, prize_id, status, expires_at)
- idempotency_keys(actor_id, key, request_hash, result), UNIQUE(actor_id,key)
- audit_log(actor_id, action, entity_id, timestamp)

Gunakan CHECK stok nonnegatif dan transaksi row-lock/conditional update agar stok tidak oversold. Saat claim kedaluwarsa, lepas reservasi dengan transaksi yang hanya mengubah claim berstatus reserved. Jangan kurangi stok dua kali ketika retry.

## Acceptance gate

Uji klaim bersamaan untuk stok terakhir, redemption paralel untuk kode sama, replay sesi, skor palsu, timestamp invalid, sesi kedaluwarsa, CSRF, akses tanpa role, retry jaringan, rate limits, audit log, dan privasi peserta. Simpan secrets hanya di lingkungan server. Nama leaderboard publik sebaiknya opt-in dan dimoderasi. Endpoint leaderboard lintas perangkat harus mengembalikan hanya skor tervalidasi dan nickname yang diizinkan.
