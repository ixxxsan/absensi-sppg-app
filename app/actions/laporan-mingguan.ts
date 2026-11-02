'use server';

import { db } from '@/lib/db';
import { menuHarian } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import type { DayReportData } from '@/lib/constants/laporan-mingguan';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Jakarta');
dayjs.locale('id');

export type { DayReportData };

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
