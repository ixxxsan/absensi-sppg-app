export interface DayReportData {
  pemberianKe: number;
  dateStr: string; // YYYY-MM-DD
  hariTanggalLengkap: string; // e.g. "Senin, 31 Agustus 2026"
  hariTanggalSingkat: string; // e.g. "Senin, 31/08/2026"
  namaMenu: string;
  fotoPorsiBesarUrl: string;
  fotoPorsiKecilUrl: string;
  fotoBumilUrl: string;
  isFilled: boolean;
}

export interface SasaranPenerima {
  no: number;
  kabupaten: string;
  nama: string;
  alamat: string;
  jumlah: number;
  kategori: 'sekolah' | 'posyandu';
}

export const DAFTAR_SASARAN_DEFAULT: SasaranPenerima[] = [
  { no: 1, kabupaten: 'Kabupaten Tangerang', nama: 'PAUD Mathlaul Huda', alamat: 'Kp. Tahfidz, Desa Kebon Cau', jumlah: 104, kategori: 'sekolah' },
  { no: 2, kabupaten: 'Kabupaten Tangerang', nama: 'MI Mathlaul Huda', alamat: 'Kp. Tahfidz, Desa Kebon Cau', jumlah: 667, kategori: 'sekolah' },
  { no: 3, kabupaten: 'Kabupaten Tangerang', nama: 'SD Kebon Cau I', alamat: 'Kp. Kebon Cau, Desa Kebon Cau', jumlah: 624, kategori: 'sekolah' },
  { no: 4, kabupaten: 'Kabupaten Tangerang', nama: 'SD Kebon Cau II', alamat: 'Kp. Alang, Desa Kebon Cau', jumlah: 619, kategori: 'sekolah' },
  { no: 5, kabupaten: 'Kabupaten Tangerang', nama: 'Posyandu Teratai 4', alamat: 'Kp. Rawa Jambe, Desa Teluk Naga', jumlah: 96, kategori: 'posyandu' },
  { no: 6, kabupaten: 'Kabupaten Tangerang', nama: 'Posyandu Teratai 5', alamat: 'Kp. Rawa Gempol, Desa Teluk Naga', jumlah: 110, kategori: 'posyandu' },
  { no: 7, kabupaten: 'Kabupaten Tangerang', nama: 'Posyandu Teratai 6', alamat: 'Kp. Rawa Lini, Desa Teluk Naga', jumlah: 115, kategori: 'posyandu' },
  { no: 8, kabupaten: 'Kabupaten Tangerang', nama: 'Posyandu Teratai 7', alamat: 'Kp. Rawa Lini, Desa Teluk Naga', jumlah: 135, kategori: 'posyandu' },
  { no: 9, kabupaten: 'Kabupaten Tangerang', nama: 'Posyandu Teratai 8', alamat: 'Kp. Rawa Lini, Desa Teluk Naga', jumlah: 122, kategori: 'posyandu' },
];
