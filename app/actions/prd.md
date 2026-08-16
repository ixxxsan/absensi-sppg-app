# Product Requirements Document (PRD): Fitur Lupa Password

**Informasi Proyek**

* **Proyek:** PWA Absensi Relawan (SPPG TANGERANG TELUKNAGA 03)
* **Modul:** Autentikasi Relawan
* **Platform:** PWA (Mobile & Desktop Web)
* **Tech Stack:** Next.js 16 (App Router), better-auth, Drizzle ORM, PostgreSQL, Resend, Tailwind CSS v4, react-hook-form + zod
* **Status:** Draft / Perencanaan

---

## 1. Latar Belakang & Tujuan

**Masalah:** Saat ini relawan tidak memiliki akses mandiri untuk memulihkan akun jika lupa kata sandi. Hal ini berpotensi menghambat proses absensi di lapangan dan menambah beban administratif bagi koordinator/Admin.
**Tujuan:** Menyediakan alur *reset password* mandiri yang aman, mulus (*seamless*), dan terintegrasi dengan infrastruktur *email* (Resend) serta sistem autentikasi saat ini (better-auth) tanpa merusak pengalaman pengguna *mobile-first*.

## 2. Pembaruan UI/UX (Tailwind v4 & Framer Motion)

Desain harus mempertahankan estetika *dark mode* minimalis dan resmi (sesuai referensi UI).

* **Halaman Login (`/login`):**
* Penambahan teks/tautan **"Lupa Password?"**.
* **Posisi:** Di bawah input password, rata kanan (sejajar dengan *checkbox* "Ingat Saya" di sebelah kiri).
* **Styling:** `text-sm text-gray-300 hover:text-white underline text-right transition-colors`.


* **Halaman Permintaan Reset (`/forgot-password`):**
* Menggunakan *layout* dan komponen *form* yang sama dengan halaman login.
* **Input:** 1 *field* tunggal untuk "Masukkan Email atau ID Relawan".
* **Tombol:** "Kirim Link Reset" (Tampilan memanjang *full-width* seperti tombol "Masuk").


* **Halaman Buat Password Baru (`/reset-password`):**
* **Input 1:** "Password Baru" (dengan *toggle* icon mata).
* **Input 2:** "Konfirmasi Password Baru" (dengan *toggle* icon mata).
* **Tombol:** "Simpan Password Baru".


* **Animasi:** Transisi antar halaman menggunakan `framer-motion` agar terasa seperti aplikasi *native*.

## 3. Alur Pengguna (User Journey)

1. **Akses:** Relawan menekan tautan "Lupa Password?" pada halaman Login.
2. **Permintaan:** Relawan diarahkan ke `/forgot-password`, lalu memasukkan Email atau ID Relawan (misal: SPPG-001) dan menekan tombol kirim.
3. **Sistem Notifikasi:** Layar menampilkan pesan konfirmasi: *"Jika Email/ID terdaftar, tautan reset telah dikirim ke email Anda."* (Pesan ambigu untuk mencegah *User Enumeration*).
4. **Aksi Email:** Relawan membuka email dan menekan tombol CTA "Reset Kata Sandi" di dalam email.
5. **Pembuatan Sandi:** Relawan diarahkan kembali ke PWA rute `/reset-password?token=...`.
6. **Penyelesaian:** Relawan memasukkan kata sandi baru, sistem memvalidasi, dan mengarahkan relawan ke halaman `/login` dengan notifikasi "Kata sandi berhasil diubah".

## 4. Kebutuhan Teknis (Technical Requirements)

### A. Frontend (Next.js 16 & React 19)

* **Validasi (Zod + React Hook Form):**
* `/forgot-password`: Input tidak boleh kosong, validasi format *string* fleksibel (menerima format email atau string ID).
* `/reset-password`: Minimum 8 karakter, wajib mencocokkan input *Password Baru* dan *Konfirmasi Password* menggunakan `zod.refine`.


* **Pemrosesan:** Gunakan **Server Actions** Next.js untuk memproses *form submission* guna menjaga keamanan kredensial.

### B. Backend & Database (better-auth & Drizzle ORM)

* **Lookup Database:** Drizzle ORM mencari *user* di tabel `users` berdasarkan input (menggunakan klausa `OR` untuk `email` atau `idRelawan`).
* **Manajemen Token:** Integrasikan modul *password reset* bawaan dari `better-auth` untuk men-*generate* token *reset* aman, menyimpannya di tabel verifikasi/sesi sementara, dan menetapkan batas waktu kedaluwarsa (15-30 menit).
* **Update Kredensial:** Setelah token divalidasi pada *endpoint* reset, mutasi *password hash* di database.
* **Revoke Sesi:** Panggil fungsi `better-auth` untuk menghapus/menutup semua *session* aktif milik pengguna tersebut di perangkat lain (otomatis *logout* dari HP lama).

### C. Pengiriman Email (Resend)

* Gunakan koneksi/API `Resend` yang sudah dikonfigurasi pada modul Admin.
* Buat *template HTML/React Email* khusus bertema "Badan Gizi Nasional" yang memuat nama relawan (jika ada) dan tombol CTA berisikan tautan token: `https://[domain-app]/reset-password?token=[generated_token]`.

## 5. Keamanan & Penanganan Kasus Khusus (Edge Cases)

1. **Anti User Enumeration:** Jika relawan memasukkan ID yang tidak terdaftar (atau akun tanpa email), *Server Action* harus menghentikan proses diam-diam, namun UI **tetap harus menampilkan pesan sukses yang sama**. Jangan beri tahu *user* bahwa akun tidak ada.
2. **Token Expiration:** Jika relawan mengakses `/reset-password?token=...` yang sudah lewat dari batas waktu, kembalikan ke `/forgot-password` dengan pesan *error*: *"Tautan telah kedaluwarsa, silakan minta tautan baru."*
3. **Rate Limiting:** Terapkan pembatasan per IP/User (misal: maks 3 kali permintaan reset per jam) untuk mencegah *spamming* dan menguras kuota API Resend.
4. **Pencegahan 재사용 (Reuse):** Token hanya berlaku *one-time use*. Setelah berhasil dipakai untuk *reset*, token harus segera dihapus/di-invalidasi dari database.

## 6. Kriteria Penerimaan (Acceptance Criteria)

* [ ] Tautan "Lupa Password?" ter-render dengan sempurna di PWA (tampilan seluler) dan sejajar dengan checkbox "Ingat Saya".
* [ ] Halaman `/forgot-password` merespons input dan mengirim request ke *Server Action*.
* [ ] Email terkirim via Resend dan masuk ke *inbox* pengguna tanpa masuk *folder spam*.
* [ ] Halaman `/reset-password` berhasil membaca dan memvalidasi `token` dari URL parameter.
* [ ] Zod memblokir upaya *submit* jika password di bawah 8 karakter atau konfirmasi password tidak cocok.
* [ ] Pengguna berhasil melakukan *login* dengan kata sandi yang baru saja dibuat.
* [ ] Semua sesi (*sessions*) login pengguna di perangkat/browser lain otomatis terputus (*logged out*) pasca perubahan kata sandi.