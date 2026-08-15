# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Nama Produk:** Aplikasi Absensi Relawan SPPG
**Platform:** Progressive Web App (PWA) / Web-Based
**Status:** Final Draft
**Target Rilis:** MVP (Minimum Viable Product)

---

## 1. Ringkasan Eksekutif (Executive Summary)

Aplikasi Absensi Relawan SPPG adalah sistem pencatatan kehadiran berbasis *Progressive Web App* (PWA) yang dirancang khusus untuk mobilitas relawan di lapangan. Sistem ini memecahkan masalah manipulasi absensi dan inefisiensi rekapitulasi manual dengan mewajibkan pengambilan foto secara *live* melalui kamera perangkat, pencatatan titik GPS *real-time*, serta pembubuhan *watermark* otomatis (Lokasi dan Waktu WIB). Dilengkapi dengan Dashboard Admin untuk memonitor kehadiran dan mengekspor data absensi ke format Excel yang kompatibel dengan rumus VLOOKUP HR/Koordinator.

## 2. Tujuan Produk (Product Goals)

1. **Akurasi & Anti-Fraud:** Memastikan relawan berada di lokasi yang tepat dan pada waktu yang sebenarnya saat melakukan absensi.
2. **Aksesibilitas Tinggi:** Menghilangkan keharusan relawan mengunduh aplikasi dari App Store/Play Store (cukup via URL Browser).
3. **Otomatisasi Laporan:** Memangkas waktu rekapitulasi data absensi bulanan/dwi-mingguan menjadi hitungan detik melalui generator otomatis.

## 3. Target Pengguna (User Personas)

* **Relawan (End-User):** Pekerja lapangan dengan berbagai spesifikasi *smartphone*. Membutuhkan proses absensi yang cepat, ringan, dan UI yang *frictionless* (mudah ditekan dengan satu jempol).
* **Admin / Koordinator:** Pengguna di perangkat Desktop/Laptop yang bertugas memantau operasional, mengelola akun relawan, dan menarik laporan berkala.

---

## 4. Kebutuhan Fungsional (Functional Requirements)

### 4.1. Modul Relawan (Mobile PWA)

| Fitur | Deskripsi | Kriteria Penerimaan |
| --- | --- | --- |
| **Otentikasi** | Login akun mandiri. | Dapat login via ID/Email & Password. Ada fitur "Ingat Saya". |
| **Live Camera** | Pengambilan foto kehadiran. | Wajib *live* (kamera depan/belakang). Memblokir opsi unggah dari Galeri HP. |
| **Live GPS** | Pencatatan koordinat lokasi. | Mengunci Titik Latitude & Longitude. Tombol absen nonaktif jika GPS ditolak. |
| **Auto-Watermark** | Bukti validasi di foto. | Mencetak otomatis koordinat, tanggal, & jam (Zona WIB mutlak) langsung di atas foto (diproses di HP relawan untuk hemat kuota). |
| **PWA Prompt** | *Add to Home Screen*. | Memunculkan *pop-up* agar aplikasi bisa disimpan menjadi ikon di *homescreen* HP. |

### 4.2. Modul Admin (Desktop Dashboard)

| Fitur | Deskripsi | Kriteria Penerimaan |
| --- | --- | --- |
| **Overview** | Ringkasan harian. | Menampilkan metrik total relawan, kehadiran hari ini, dan peta titik absensi. |
| **CRUD Relawan** | Manajemen *master data*. | Admin dapat menambah/edit/hapus akun, serta menetapkan `id_relawan` unik. |
| **Validasi Absen** | Pemeriksaan bukti absen. | Admin dapat melihat riwayat, mengecek *watermark* foto, & mengubah status (Valid/Invalid). |
| **Export Excel** | Generator laporan (VLOOKUP). | Memilih rentang tanggal dan mengunduh format `.xlsx` (ID Relawan, Nama, Tgl, Jam, Lokasi). |

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Kinerja (Performance):** Proses kompresi foto dan *watermarking* dilakukan di *client-side* (Browser HP) via HTML5 Canvas agar proses unggah (*upload*) di bawah 5 detik.
2. **Keamanan (Security):**
* Enkripsi *password* menggunakan Bcrypt.
* API dilindungi otorisasi Token (JWT/Sanctum).
* Mencatat *IP Address* & *User-Agent* (Tipe HP) saat absen sebagai lapisan audit kecurangan.


3. **Standarisasi Waktu:** API harus mengembalikan waktu server dengan zona **Asia/Jakarta (WIB - UTC+7)**. Aplikasi tidak boleh menggunakan waktu jam internal HP relawan.

---

## 6. Alur Pengguna (User Flows)

**Alur Relawan:**
Buka URL -> Login -> Tampil Beranda (Jam Digital WIB) -> Klik "📸 Absen Sekarang" -> *Allow* Akses Kamera & GPS -> Arahkan Wajah (Tunggu Sinyal GPS Hijau) -> Klik *Shutter* -> Proses Watermark (Latar Belakang) -> Layar Sukses (Centang Hijau) -> Selesai.

**Alur Admin (Tarik Laporan):**
Login via Laptop -> Navigasi ke "Laporan" -> Pilih Tanggal (Misal: 1-15 Agustus) -> Klik "Export Excel" -> Unduh file `.xlsx` -> Selesai.

---

## 7. Rekomendasi Tech Stack & Arsitektur

Dapat disesuaikan dengan kapabilitas tim *developer*:

* **Opsi A (Modern PWA - Sangat Direkomendasikan):** Next.js (React), Next API Routes (Node.js), PostgreSQL + Prisma ORM.
* **Opsi B (Rapid Framework):** Laravel (PHP), Blade + Alpine.js + Tailwind, MySQL.
* **Kebutuhan Inti (Wajib Klien):** HTML5 WebRTC (Kamera), Geolocation API (GPS), HTML5 Canvas, Day.js (Timezone).

---

## 8. Skema Database Inti (Data Model)

**1. Tabel `admins**`

* `id` (PK, Auto Increment)
* `nama_lengkap`, `email` (Unique), `password` (Hashed), `role`

**2. Tabel `relawan` (Master Data)**

* `id` (PK, Auto Increment)
* `id_relawan` (VARCHAR, Unique, Indexed) -> *Kunci untuk rumus VLOOKUP*
* `nama_lengkap`, `email`, `no_telepon`
* `password` (Hashed)
* `status_aktif` (BOOLEAN)

**3. Tabel `absensi` (Log Transaksi)**

* `id` (PK, Auto Increment)
* `relawan_id` (FK -> relawan.id)
* `tanggal_absen` (DATE, Indexed), `waktu_absen` (TIME WIB)
* `foto_url` (VARCHAR - Link Storage)
* `latitude`, `longitude` (DECIMAL)
* `ip_address` (VARCHAR) & `user_agent` (TEXT) -> *Audit Log*
* `status_validasi` (VARCHAR: valid/invalid)

---

## 9. Rancangan API Routing & Data Fetching (RESTful)

**Base URL:** `/api/v1` | **Otorisasi:** `Bearer Token`

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| **POST** | `/auth/login` | Validasi kredensial -> Mengembalikan Token. |
| **GET** | `/auth/me` | Validasi *session/token*. |
| **GET** | `/relawan/dashboard` | Ambil data profil relawan & status absen hari ini. Server me-return jam WIB saat ini. |
| **POST** | `/relawan/absen` | Kirim FormData: File Foto ber-Watermark, Lat, Long, IP (otomatis dibaca server). |
| **GET** | `/admin/stats` | Tampilkan grafik & ringkasan untuk dashboard eksekutif. |
| **GET/POST/PUT** | `/admin/relawan` | CRUD Master Data Relawan (Pagination & Search). |
| **GET/PUT** | `/admin/absensi` | Cek list absen masuk hari ini & tombol ubah status valid/invalid. |
| **GET** | `/admin/export` | Menarik rekapan bulanan berformat `.xlsx`. |

---

## 10. Panduan UI/UX

* **Mobile-First (Relawan):** Gunakan prinsip *One-Thumb Navigation*. Tombol aksi utama (seperti *Shutter* kamera atau tombol "Absen Sekarang") dibuat berukuran RAKSASA dan diletakkan di area tengah-bawah layar.
* **Feedback Status:** Tampilkan *Loading Spinner* di setiap klik, dan centang hijau besar saat sukses agar relawan tidak menekan tombol *submit* berulang kali.
* **Desktop-First (Admin):** Gunakan tabel *data-grid* yang ringkas, dengan fitur *zoom-in* pada foto absensi (*thumbnail*) tanpa harus membuka halaman baru (menggunakan *Modal/Pop-up*).

## 11. Kriteria Rilis Tahap 1 (MVP)

1. PWA berjalan lancar pada *browser* Chrome (Android) dan Safari (iOS).
2. *Watermark* lokasi dan waktu (WIB) berhasil menyatu pada foto tanpa merusak gambar.
3. *File* unduhan Excel dapat ditarik langsung ke *spreadsheet* master HRD dan rumus `=VLOOKUP()` berfungsi normal berdasarkan pencarian `id_relawan`.