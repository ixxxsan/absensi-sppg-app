'use server';

import { db } from '@/lib/db';
import { menuHarian } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Jakarta');
dayjs.locale('id');

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

export async function getWeeklyReportMenuData(dates: string[]): Promise<DayReportData[]> {
  if (!dates || dates.length === 0) return [];

  // Filter valid YYYY-MM-DD
  const validDates = dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (validDates.length === 0) return [];

  const menus = await db
    .select()
    .from(menuHarian)
    .where(inArray(menuHarian.tanggal, validDates));

  const menuMap = new Map(menus.map(m => [m.tanggal, m]));

  return dates.map((d, index) => {
    const dayObj = dayjs(d).locale('id');
    const existing = menuMap.get(d);

    return {
      pemberianKe: index + 1,
      dateStr: d,
      hariTanggalLengkap: dayObj.format('dddd, DD MMMM YYYY'),
      hariTanggalSingkat: dayObj.format('dddd, DD/MM/YYYY'),
      namaMenu: existing?.namaMenu || '',
      fotoPorsiBesarUrl: existing?.fotoPorsiBesarUrl || '',
      fotoPorsiKecilUrl: existing?.fotoPorsiKecilUrl || '',
      fotoBumilUrl: existing?.fotoBumilUrl || '',
      isFilled: !!existing,
    };
  });
}
