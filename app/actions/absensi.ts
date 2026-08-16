'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { absensi, user } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { nowWIB } from '@/lib/utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getAbsensiHariIni() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { hasMasuk: false, isLengkap: false };
  }

  const today = nowWIB().format('YYYY-MM-DD');

  // get all absensi for this user today
  const records = await db.select()
    .from(absensi)
    .where(
      and(
        eq(absensi.userId, session.user.id),
        eq(absensi.tanggalAbsen, today)
      )
    );

  const masuk = records.find(r => r.tipe === 'masuk');
  const pulang = records.find(r => r.tipe === 'pulang');

  // get latest user info
  const latestUser = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

  return {
    hasMasuk: !!masuk,
    isLengkap: !!masuk && !!pulang,
    masuk,
    pulang,
    user: latestUser[0] || null
  };
}

export async function submitAbsensi(
  base64Image: string,
  latitude: number,
  longitude: number,
  tipe: 'masuk' | 'pulang'
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // 1. Upload Base64 Image to Supabase Storage
  // Limit base64 payload to ~5MB (approx 7,000,000 characters)
  if (base64Image.length > 7000000) {
    throw new Error('Ukuran foto terlalu besar. Maksimal 5MB.');
  }

  // Extract base64 payload (remove data:image/jpeg;base64,)
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  
  const fileName = `${session.user.id}-${nowWIB().format('YYYYMMDD-HHmmss')}-${tipe}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('absensi_fotos')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error('Gagal mengunggah foto');
  }

  const { data: publicUrlData } = supabase.storage
    .from('absensi_fotos')
    .getPublicUrl(fileName);

  const fotoUrl = publicUrlData.publicUrl;

  const now = nowWIB();

  // 2. Insert into Database
  // Note: We auto-approve based on the frontend logic.
  // The frontend won't call this if the user is out of range (we'll enforce it there).
  await db.insert(absensi).values({
    userId: session.user.id,
    tanggalAbsen: now.format('YYYY-MM-DD'),
    waktuAbsen: now.format('HH:mm:ss'),
    tipe,
    fotoUrl,
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    statusValidasi: 'valid', // Auto-approved as requested
  });

  return { success: true, fotoUrl };
}

export async function getAllAbsensi() {
  const session = await auth.api.getSession({ headers: await headers() });
  // Verify admin
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // Get all absensi joined with user to get names
  const records = await db
    .select({
      id: absensi.id,
      userId: absensi.userId,
      tanggalAbsen: absensi.tanggalAbsen,
      waktuAbsen: absensi.waktuAbsen,
      tipe: absensi.tipe,
      fotoUrl: absensi.fotoUrl,
      latitude: absensi.latitude,
      longitude: absensi.longitude,
      statusValidasi: absensi.statusValidasi,
      createdAt: absensi.createdAt,
      namaLengkap: user.name,
      idRelawan: user.idRelawan,
      divisi: user.divisi,
    })
    .from(absensi)
    .leftJoin(user, eq(absensi.userId, user.id))
    .orderBy(desc(absensi.createdAt));

  return records;
}

export async function updateAbsensiStatus(id: string, status: 'valid' | 'invalid' | 'menunggu') {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  await db.update(absensi)
    .set({ statusValidasi: status })
    .where(eq(absensi.id, id));
    
  return { success: true };
}
