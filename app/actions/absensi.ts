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

  // Get latest masuk globally
  const [masuk] = await db.select().from(absensi)
    .where(and(eq(absensi.userId, session.user.id), eq(absensi.tipe, 'masuk')))
    .orderBy(desc(absensi.createdAt)).limit(1);

  // Get latest pulang globally
  const [pulang] = await db.select().from(absensi)
    .where(and(eq(absensi.userId, session.user.id), eq(absensi.tipe, 'pulang')))
    .orderBy(desc(absensi.createdAt)).limit(1);

  const [currentUser] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

  // Determine active state: if masuk is newer than pulang, they are currently working
  const isMasukActive = masuk && (!pulang || new Date(masuk.createdAt).getTime() > new Date(pulang.createdAt).getTime());

  return { 
    hasMasuk: !!isMasukActive, 
    isLengkap: false, 
    masuk: masuk || null, 
    pulang: pulang || null, 
    user: currentUser || null 
  };
}

export async function submitAbsensi(fotoUrl: string, lat: number, lon: number, tipe: 'masuk' | 'pulang', clientTs: number) {
  const session = await getServerSession();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  // Server-side validation against race conditions and double submission
  const currentState = await getAbsensiHariIni();
  if (tipe === 'masuk' && currentState.hasMasuk) {
    return { success: false, error: 'Anda masih dalam sesi aktif. Harap absen pulang terlebih dahulu.' };
  }
  if (tipe === 'pulang' && !currentState.hasMasuk) {
    return { success: false, error: 'Anda belum absen masuk.' };
  }

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
  } catch (err) {
    console.error('Error saat submit absensi:', err);
    return { success: false, error: 'Gagal menyimpan data absensi. Silakan coba lagi.' };
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

export async function updateAbsensiStatus(id: string, statusValidasi: 'valid' | 'invalid' | 'menunggu' | 'flagged' | 'ditolak') {
  const session = await getServerSession();
  if (!session?.user?.role?.includes('admin')) return { success: false, error: 'Unauthorized' };

  await db.update(absensi).set({ statusValidasi }).where(eq(absensi.id, id));
  return { success: true };
}
