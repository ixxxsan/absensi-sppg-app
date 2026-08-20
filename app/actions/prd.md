Berikut adalah draf PRD (*Product Requirements Document*) yang sudah disusun secara profesional, komprehensif, dan siap untuk Anda *copy-paste* ke dalam dokumentasi internal Anda (seperti Notion, Jira, atau Confluence).

---

# PRD Addendum: Modul Landing Page Menu & Gizi Harian Dinamis (SPPG)

**Status:** Draft / In Review
**Target Pengguna:** Relawan SPPG & Administrator SDM
**Platform:** Mobile Web (via pemindaian QR Code) & Web Dashboard (Admin)

---

## 1. Ringkasan Eksekutif (Executive Summary)

Modul **Landing Page Menu & Gizi Harian** merupakan ekstensi dari Aplikasi Absensi Relawan SPPG. Fitur ini dirancang untuk memberikan informasi transparansi nilai gizi dan standar keamanan pangan (aturan konsumsi maksimal 2 jam) kepada relawan di lapangan. Sistem ini menggunakan arsitektur **Single Static QR Code** yang mengarah ke *routing* dinamis, sehingga pihak manajemen tidak perlu mencetak dan menempel stiker QR Code baru setiap harinya.

## 2. Tujuan & Sasaran (Goals & Objectives)

* **Efisiensi Logistik:** Menghilangkan kebutuhan pencetakan QR Code harian. Satu QR Code fisik berlaku selamanya.
* **Kepatuhan Keamanan Pangan (Food Safety):** Memastikan seluruh relawan membaca peringatan batas aman konsumsi (maksimal 2 jam) untuk mencegah risiko kesehatan.
* **Personalisasi Edukasi Gizi:** Menampilkan rincian gizi secara akurat berdasarkan 3 variasi porsi (Porsi Kecil, Porsi Besar, dan Porsi Bumil/Busui).

## 3. Alur Kerja & Kebutuhan Pengguna (User Stories & Workflows)

### 3.1. Alur Pengguna: Relawan (End-User)

* **Memindai QR:** Relawan menggunakan kamera *smartphone* untuk memindai QR Code di area pembagian makanan.
* **Akses Otomatis:** Relawan diarahkan ke URL statis (misal: `[https://app-sppg.com/menu/hari-ini](https://app-sppg.com/menu/hari-ini)`).
* **Membaca Aturan:** Layar pertama kali menyorot banner peringatan wajib konsumsi di tempat.
* **Interaksi Porsi:** Relawan melihat foto makanan hari ini, kemudian dapat menekan *Tab* (Kecil/Besar/Bumil) untuk melihat transisi angka kandungan gizi yang disesuaikan dengan jatah makanannya.

### 3.2. Alur Pengguna: Administrator (Dashboard)

* **Input Data Harian/Mingguan:** Admin mengakses CMS dan menjadwalkan menu untuk tanggal-tanggal ke depan.
* **Pengisian Form:** Admin mengunggah 1 foto utama (atau 3 foto berbeda untuk tiap porsi), nama menu, dan mengisi form *input* angka (Energi, Protein, Lemak, Karbohidrat, Serat) untuk masing-masing varian porsi.
* **Automasi Pergantian Hari:** Tepat pada pukul 00:00 WIB, halaman QR secara otomatis memperbarui tampilannya sesuai data tanggal hari itu.

## 4. Spesifikasi Antarmuka (UI/UX Specifications)

Desain mengusung tema **Dark Mode / Deep Navy** yang modern dan responsif (*Mobile-First*).

* **Header (Fixed Top):** Efek *backdrop-blur*, menampilkan Logo SPPG dan teks "SPPG TELUKNAGA 03".
* **Warning Banner (Prioritas Visual):**
* Warna latar amber/kuning transparan dengan efek *glow*.
* Teks peringatan: "WAJIB DIKONSUMSI DI TEMPAT!", "Dilarang dibawa pulang", dan "MAKSIMAL 2 JAM SETELAH DISAJIKAN" (ditebalkan).


* **Hero Section:**
* Foto sajian (*full-width*, *rounded corners*). Memiliki efek transisi *fade-in-out* 0.5 detik jika gambar antar porsi berbeda.
* Judul menu dan tanggal otomatis terisi (Format: Hari, DD Bulan YYYY).


* **Interactive Tabs:**
* 3 Segmentasi: Porsi Kecil (ikon mangkuk), Porsi Besar (ikon piring besar), Bumil/Busui (ikon ibu hamil).
* Memiliki animasi *background slider* (warna *sky-blue*) yang bergeser mengikuti tab yang aktif.


* **Nutrition Metrics List:**
* Menampilkan 5 Baris: Energi (kkal), Protein (g), Lemak (g), Karbohidrat (g), dan Serat (g).
* Menggunakan efek *Counter Animation*: Saat relawan memindah *tab*, angka gizi bergulir cepat (animasi berjalan 400ms) dari angka sebelumnya ke angka porsi yang baru.



## 5. Arsitektur Data & Skema Database

Sistem menggunakan **PostgreSQL (via Supabase) & Drizzle ORM**. Penambahan tabel baru diperlukan untuk memfasilitasi modul ini.

**Tabel: `menu_harian**`

| Kolom | Tipe Data | Keterangan | Aturan Validasi |
| --- | --- | --- | --- |
| `id` | `uuid` | Primary Key | `defaultRandom()` |
| `tanggal_sajian` | `date` | Tanggal menu disajikan | `UNIQUE` (1 hari = 1 baris) |
| `nama_menu` | `varchar` | Judul makanan | Maksimal 100 karakter |
| `foto_url_kecil` | `text` | Tautan gambar S3/Supabase | Wajib diisi |
| `foto_url_besar` | `text` | Tautan gambar S3/Supabase | Opsional (fallback ke porsi kecil) |
| `foto_url_bumil` | `text` | Tautan gambar S3/Supabase | Opsional (fallback ke porsi kecil) |
| `gizi_kecil` | `jsonb` | Detail nutrisi | `{energi: number, protein: number, ...}` |
| `gizi_besar` | `jsonb` | Detail nutrisi | `{energi: number, protein: number, ...}` |
| `gizi_bumil` | `jsonb` | Detail nutrisi | `{energi: number, protein: number, ...}` |
| `created_at` | `timestamp` | Waktu data dibuat | *Auto-generated* |

## 6. Kebutuhan Teknis & Implementasi (Tech Stack Notes)

* **State Management & Animasi:** Menggunakan `useState` React bawaan. Animasi angka menggunakan `requestAnimationFrame` untuk memastikan pergerakan frame yang *smooth* tanpa membebani memori HP.
* **Waktu Sistem (Timezone):** Validasi URL dinamis `/menu/hari-ini` WAJIB menggunakan `Day.js` yang disetel pada zona waktu **Asia/Jakarta (WIB)** di sisi Server (Next.js *Server Components*), untuk menghindari manipulasi *timezone* pada perangkat klien (relawan).
* **Penanganan *Error / Edge Cases*:**
* **Data Kosong:** Jika admin lupa menginput data untuk hari ini, sistem harus menampilkan halaman *fallback* yang ramah (misal: "Data menu hari ini sedang disiapkan oleh tim dapur", disertai banner peringatan 2 jam yang tetap muncul).
* **Offline Mode:** Berhubung aplikasi utama berupa PWA, pastikan halaman QR ini dikecualikan dari *cache strict offline* agar relawan selalu mendapatkan data terbaru setiap kali terkoneksi internet.