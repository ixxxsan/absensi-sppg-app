'use server';

import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { absensi, user } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nowWIB, haversineDistance } from '@/lib/utils';
import { GEOFENCE } from '@/lib/config';

export async function getAbsensiHariIni() {
  const session = await getServerSession();
  if (!session?.user) return { hasMasuk: false, isLengkap: false };

  const records = await db.select().from(absensi).where(
    and(eq(absensi.userId, session.user.id), eq(absensi.tanggalAbsen, nowWIB().format('YYYY-MM-DD')))
  );
  
  const masuk = records.find(r => r.tipe === 'masuk');
  const pulang = records.find(r => r.tipe === 'pulang');
  const [currentUser] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

  return { hasMasuk: !!masuk, isLengkap: !!masuk && !!pulang, masuk, pulang, user: currentUser || null };
}

export async function submitAbsensi(fotoUrl: string, lat: number, lon: number, tipe: 'masuk' | 'pulang', clientTs: number) {
  const session = await getServerSession();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  if (tipe === 'masuk' && haversineDistance(lat, lon, GEOFENCE.lat, GEOFENCE.lon) > GEOFENCE.radiusMeters) {
    return { success: false, error: 'Di luar radius.' };
  }

  try {
    const isSpoof = Math.abs(Date.now() - clientTs) > 300000;
    const [record] = await db.insert(absensi).values({
      userId: session.user.id,
      tanggalAbsen: nowWIB().format('YYYY-MM-DD'),
      waktuAbsen: nowWIB().format('HH:mm:ss'),
      tipe, fotoUrl, latitude: String(lat), longitude: String(lon),
      statusValidasi: isSpoof ? 'flagged' : 'valid',
      catatanSistem: isSpoof ? 'Time Spoofing Indication' : null
    }).returning();
    return { success: true, record };
  } catch {
    return { success: false, error: `Sudah absen ${tipe} hari ini.` };
  }
}

export async function getAllAbsensi() {
  const session = await getServerSession();
  if (!session?.user?.role?.includes('admin')) return [];

  return db.select({
    id: absensi.id, userId: absensi.userId, tanggalAbsen: absensi.tanggalAbsen, waktuAbsen: absensi.waktuAbsen,
    tipe: absensi.tipe, fotoUrl: absensi.fotoUrl, latitude: absensi.latitude, longitude: absensi.longitude,
    statusValidasi: absensi.statusValidasi, catatanSistem: absensi.catatanSistem, createdAt: absensi.createdAt,
    namaLengkap: user.name, idRelawan: user.idRelawan, divisi: user.divisi, status: user.status
  }).from(absensi).leftJoin(user, eq(absensi.userId, user.id)).orderBy(desc(absensi.createdAt));
}

export async function updateAbsensiStatus(id: string, statusValidasi: 'valid' | 'invalid' | 'menunggu') {
  const session = await getServerSession();
  if (!session?.user?.role?.includes('admin')) return { success: false, error: 'Unauthorized' };

  await db.update(absensi).set({ statusValidasi }).where(eq(absensi.id, id));
  return { success: true };
}
