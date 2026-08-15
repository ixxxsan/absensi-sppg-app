import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { absensi } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    const tipe = formData.get('tipe') as string; // 'masuk' or 'pulang'
    const foto = formData.get('foto') as File;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    
    if (!foto) {
        return NextResponse.json({ success: false, message: 'Foto wajib disertakan' }, { status: 400 });
    }

    // IP Address can be extracted from headers in Next.js
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const serverTimeWIB = dayjs().tz('Asia/Jakarta');

    // 1. Upload `foto` to Cloud Storage (Supabase Storage)
    const fileExt = foto.name.split('.').pop() || 'jpg';
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
    
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('absensi_fotos')
      .upload(fileName, foto, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) {
      console.error("Storage Error:", storageError);
      return NextResponse.json({ success: false, message: 'Gagal mengunggah foto' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase
        .storage
        .from('absensi_fotos')
        .getPublicUrl(fileName);

    const fotoUrl = publicUrlData.publicUrl;

    // 2. Insert record into `absensi` table
    const result = await db.insert(absensi).values({
      userId: session.user.id,
      tanggalAbsen: serverTimeWIB.format('YYYY-MM-DD'),
      waktuAbsen: serverTimeWIB.format('HH:mm:ss'),
      tipe,
      fotoUrl,
      latitude,
      longitude,
      ipAddress,
      userAgent,
      statusValidasi: 'menunggu'
    }).returning();
    
    return NextResponse.json({
      success: true,
      message: `Absen ${tipe} berhasil dicatat.`,
      data: result[0]
    });

  } catch (error) {
    console.error("Absen API Error:", error);
    return NextResponse.json({ success: false, message: 'Gagal memproses absensi' }, { status: 500 });
  }
}
