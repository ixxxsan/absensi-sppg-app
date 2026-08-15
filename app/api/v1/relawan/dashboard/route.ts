import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('id');

export async function GET(request: Request) {
  // TODO: Fetch from actual database based on User ID from Token
  
  const currentTimeWIB = dayjs().tz('Asia/Jakarta');
  
  return NextResponse.json({
    success: true,
    data: {
      currentTime: currentTimeWIB.format('HH:mm'),
      currentDate: currentTimeWIB.format('YYYY-MM-DD'),
      relawan: {
        namaLengkap: 'Budi Santoso',
        idRelawan: 'SPPG-001',
        divisi: 'ASISTEN LAPANGAN'
      },
      absenHariIni: {
        status: 'masuk', // 'belum' | 'masuk' | 'lengkap'
        waktuMasuk: '07:30',
        waktuPulang: null,
      }
    }
  });
}
