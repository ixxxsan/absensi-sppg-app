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

export const PERSIAPAN_DESCRIPTIONS = [
  'Hari ini Persiapan Dimulai di hari sebelumnya pukul 20:06 WIB. Dimulai dengan memotong labu siam, dilanjutkan dengan pengolahan bahan makanan.',
  'Hari ini Persiapan Dimulai di hari sebelumnya pukul 20:23 WIB. Dimulai dengan memotong kol, dilanjut dengan pengolahan bahan makanan',
  'Hari ini Persiapan Dimulai di hari sebelumnya pukul 20:25 WIB. Dimulai dengan memarut labu siam, dilanjut dengan pengolahan bahan makanan.',
  'Hari ini Persiapan Dimulai di hari sebelumnya pukul 20:30 WIB. Dimulai dengan memotong halus kol, kemudian dilanjut dengan mengolah bahan makanan.',
  'Hari ini Persiapan Dimulai di hari sebelumnya pukul 20:44 WIB. Dimulai dengan memotong wortel, kemudian dilanjut dengan mengolah bahan makanan',
];

export const PENGOLAHAN_DESCRIPTIONS = [
  'Pengolahan dimulai pada pukul 02:20 WIB. Dimulai dengan memasak ayam hingga selesai.',
  'Pengolahan dimulai pada pukul 02:32 WIB. Dimulai dengan menggoreng tahu pong hingga selesai.',
  'Pengolahan dimulai pada pukul 02:10 WIB. Dimulai dengan memasak daging yang telah dibumbui sebelumnyna hingga selesai.',
  'Pengolahan dimulai pada pukul 02:22 WIB. Dengan menggoreng Chicken nugget hingga selesai.',
  'Pengolahan dimulai pada pukul 02:16 WIB. Dimulai dengan menggoreng chicken cheese ball dibarengi dengan memasak daging slice dan saus teriyaki hingga selesai.',
];

export const PEMORSIAN_DESCRIPTIONS = [
  'Pemorsian dimulai pukul 04:22 WIB. Dan dilanjut dengan packing paling lambat hingga pukul 08:00 WIB.',
  'Pemorsian dimulai pukul 04:06 WIB. Dan dilanjut dengan packing paling lambat hingga 08:00 WIB.',
  'Pemorsian dimulai pukul 03:54 WIB. Dan dilanjut dengan packing paling lambat hingga pukul 08:00 WIB.',
  'Pemorsian dimulai pukul 03:59 WIB. Dan dilanjut dengan packing paling lambat hingga pukul 08:00 WIB.',
  'Pemorsian dimulai pukul 04:06 WIB. Dan dilanjut dengan packing paling lambat hingga pukul 08:00 WIB',
];

export const PENCUCIAN_STEPS = [
  {
    image: '/images/laporan/image19.jpeg',
    title: 'Penyisihan Sisa Makanan Dari Ompreng',
    desc: 'Setelah Driver mengambil semua ompreng dari Penerima Manfaat, Langkah pertama yaitu memisahkan sisa makanan sesuai dengan jenis makanannya, terbagi menjadi Nasi/Karbohidrat, Lauk Hewani, Lauk Nabati, Sayur, dan Buah.',
  },
  {
    image: '/images/laporan/image20.jpeg',
    title: 'Penimbangan Sisa Makanan',
    desc: 'Setelah selesai dipisahkan sesuai jenis-jenis nya, makanan sisa akan ditimbang untuk kemuian didata.',
  },
  {
    image: '/images/laporan/image21.jpeg',
    title: 'Pencucian Pertama',
    desc: 'Setelah Ompreng sudah bersih dari makanan sisa, selanjutnya ompreng akan masuk ke pencucian pertama untuk menghilangkan sisa makanan yang mungkin masih tersisa.',
  },
  {
    image: '/images/laporan/image22.jpeg',
    title: 'Pencucian Kedua',
    desc: 'Setelah selesai dari pencucian pertama, ompreng akan kembali masuk pada pencucian kedua untuk menghilangkan minyak atau kerak yang mungkin menempel dari sisa makanan.',
  },
  {
    image: '/images/laporan/image23.jpeg',
    title: 'Pencucian Ketiga dengan Sabun',
    desc: 'Setelah melalui 2 kali proses pencucian, Langkah selanjutnya yaitu pencucian ketiga dengan sabun untuk menghilangkan noda, bau, maupun sisa makanan.',
  },
  {
    image: '/images/laporan/image24.jpeg',
    title: 'Pembilasan',
    desc: 'Setelah melalui proses 3x pencucian, ompreng kemudian dibilas dengan air agar memastikan ompreng bersih dan tidak ada sisa sabun.',
  },
  {
    image: '/images/laporan/image25.jpeg',
    title: 'Pengelapan',
    desc: 'Setelah dibilas dengan bersih, ompreng kemudian dilap dengan lap microfiber secara menyeluruh',
  },
  {
    image: '/images/laporan/image26.jpeg',
    title: 'Sterilisasi',
    desc: 'Setelah ompreng dilap hingga kering, selanjutnya ompreng akan dimasukkan kedalam oven untuk mensterilkan ompreng.',
  },
];

export const DISTRIBUSI_PHOTOS = [
  'image18.jpeg',
  'image33.jpeg',
  'image34.jpeg',
  'image35.jpeg',
  'image36.jpeg',
  'image37.jpeg',
  'image38.jpeg',
  'image39.jpeg',
];

export const SURAT_JALAN_PHOTOS = [
  'image40.jpeg', 'image41.jpeg', 'image42.jpeg', 'image43.jpeg', 'image44.jpeg',
  'image45.jpeg', 'image46.jpeg', 'image47.jpeg', 'image48.jpeg', 'image49.jpeg',
  'image50.jpeg', 'image51.jpeg', 'image52.jpeg', 'image53.jpeg', 'image54.jpeg',
  'image55.jpeg', 'image56.jpeg', 'image57.jpeg', 'image58.jpeg', 'image59.jpeg',
  'image60.jpeg', 'image61.jpeg', 'image62.jpeg', 'image63.jpeg', 'image64.jpeg',
  'image65.jpeg', 'image66.jpeg', 'image67.jpeg', 'image68.jpeg', 'image69.jpeg',
  'image70.jpeg', 'image71.jpeg', 'image72.jpeg', 'image73.jpeg', 'image74.jpeg',
  'image75.jpeg', 'image76.jpeg', 'image77.jpeg', 'image78.jpeg', 'image79.jpeg',
  'image80.jpeg', 'image81.jpeg',
];
