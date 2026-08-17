'use server';

import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { absensi, user } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nowWIB, haversineDistance } from '@/lib/utils';
import { GEOFENCE } from '@/lib/config';

export async function getAbsensiHariIni() {
  const session = await getServerSession();
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
  fotoUrl: string,
  latitude: number,
  longitude: number,
  tipe: 'masuk' | 'pulang',
  clientTimestamp: number
) {
  const session = await getServerSession();
  if (!session) {
    return { success: false, error: 'Sesi tidak valid saat absensi (getSession returned null).' };
  }
  if (!session.user) {
    return { success: false, error: 'Akses ditolak: User tidak ditemukan dalam sesi.' };
  }

  const now = nowWIB();
  const todayStr = now.format('YYYY-MM-DD');
  const serverTimestamp = Date.now();
  let statusValidasi = 'valid'; // Auto-approved as requested
  let catatanSistem: string | null = null;

  // Prevent duplicate absensi for same type on same day
  const existing = await db.select({ id: absensi.id })
    .from(absensi)
    .where(and(
      eq(absensi.userId, session.user.id),
      eq(absensi.tanggalAbsen, todayStr),
      eq(absensi.tipe, tipe)
    ))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: `Anda sudah absen ${tipe} hari ini.` };
  }

  // Anti-Spoofing Time Validation
  const timeDelta = Math.abs(serverTimestamp - clientTimestamp);
  if (timeDelta > 300000) { // > 5 menit
    statusValidasi = 'flagged';
    catatanSistem = `Indikasi Time Spoofing: Selisih ${Math.round(timeDelta / 60000)} menit`;
  }

  // Validate distance server-side to prevent bypass
  if (tipe === 'masuk') {
    const dist = haversineDistance(latitude, longitude, GEOFENCE.lat, GEOFENCE.lon);
    if (dist > GEOFENCE.radiusMeters) {
      return { success: false, error: `Anda berada di luar radius tugas (lebih dari ${GEOFENCE.radiusMeters}m). Absensi masuk ditolak.` };
    }
  }

  // 2. Insert into Database
  // Note: We auto-approve based on the frontend logic.
  const inserted = await db.insert(absensi).values({
    userId: session.user.id,
    tanggalAbsen: now.format('YYYY-MM-DD'),
    waktuAbsen: now.format('HH:mm:ss'),
    tipe,
    fotoUrl,
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    statusValidasi,
    catatanSistem,
  }).returning();

  return { success: true, record: inserted[0] };
}

export async function getAllAbsensi() {
  const session = await getServerSession();
  // Verify admin
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    return [];
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
  const session = await getServerSession();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    return { success: false, error: 'Unauthorized' };
  }

  await db.update(absensi)
    .set({ statusValidasi: status })
    .where(eq(absensi.id, id));
    
  return { success: true };
}
