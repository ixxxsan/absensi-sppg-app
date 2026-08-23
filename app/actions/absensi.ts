'use server';

import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { absensi, user } from '@/lib/db/schema';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import { nowWIB, haversineDistance, isAdminRole } from '@/lib/utils';
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

export async function submitAbsensi(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const fotoBlob = formData.get('foto') as Blob | null;
  const latStr = formData.get('lat') as string;
  const lonStr = formData.get('lon') as string;
  const tipe = formData.get('tipe') as 'masuk' | 'pulang';
  const clientTsStr = formData.get('clientTs') as string;

  if (!fotoBlob || !latStr || !lonStr || !tipe || !clientTsStr) {
    return { success: false, error: 'Data absensi tidak lengkap.' };
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  const clientTs = parseInt(clientTsStr, 10);

  // C3 Fix: Runtime validation — server actions receive serialized data
  if (tipe !== 'masuk' && tipe !== 'pulang') {
    return { success: false, error: 'Tipe absen tidak valid.' };
  }

  // Server-side validation against race conditions and double submission
  let currentState = await getAbsensiHariIni();

  // Auto-checkout for old active sessions (>20 hours) when attempting new check-in
  if (tipe === 'masuk' && currentState.hasMasuk && currentState.masuk) {
    const msElapsed = Date.now() - new Date(currentState.masuk.createdAt).getTime();
    const hoursElapsed = msElapsed / (1000 * 60 * 60);
    
    if (hoursElapsed >= 20) {
      const autoPulangTime = new Date(new Date(currentState.masuk.createdAt).getTime() + 8 * 60 * 60 * 1000); // 8 hours later
      
      await db.insert(absensi).values({
        userId: session.user.id,
        tanggalAbsen: currentState.masuk.tanggalAbsen,
        waktuAbsen: `${autoPulangTime.getHours().toString().padStart(2, '0')}:${autoPulangTime.getMinutes().toString().padStart(2, '0')}:${autoPulangTime.getSeconds().toString().padStart(2, '0')}`,
        tipe: 'pulang',
        fotoUrl: currentState.masuk.fotoUrl,
        latitude: currentState.masuk.latitude,
        longitude: currentState.masuk.longitude,
        statusValidasi: 'valid',
        catatanSistem: 'Auto-checkout setelah melewati 20 jam'
      });
      
      // Refresh state after auto-checkout
      currentState = await getAbsensiHariIni();
    }
  }

  if (tipe === 'masuk' && currentState.hasMasuk) {
    return { success: false, error: 'Anda masih dalam sesi aktif. Harap absen pulang terlebih dahulu.' };
  }
  
  if (tipe === 'pulang') {
    if (!currentState.hasMasuk) {
      return { success: false, error: 'Anda belum absen masuk.' };
    }
    
    if (currentState.masuk) {
      const msElapsed = Date.now() - new Date(currentState.masuk.createdAt).getTime();
      const hoursElapsed = msElapsed / (1000 * 60 * 60);
      
      if (hoursElapsed < 8) {
        return { success: false, error: 'Anda belum memenuhi minimal waktu kerja 8 jam. Silakan kembali lagi nanti.' };
      }
    }
  }

  // C5 DOC: Geofence check hanya untuk absen MASUK — ini INTENTIONAL.
  // Relawan boleh absen pulang dari mana saja karena setelah 8+ jam bertugas,
  // mereka mungkin sudah berpindah lokasi (misalnya distribusi makanan).
  if (tipe === 'masuk' && haversineDistance(lat, lon, GEOFENCE.lat, GEOFENCE.lon) > GEOFENCE.radiusMeters) {
    return { success: false, error: 'Di luar radius.' };
  }

  try {
    // 1. Upload file ke Supabase secara aman di server
    const { supabaseAdmin } = await import('@/lib/supabase-admin');
    
    const arrayBuffer = await fotoBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
  
    const userId = session.user.id;
    const randomSuffix = crypto.randomUUID().slice(0, 8);
    const fileName = `${userId}-${nowWIB().format('YYYYMMDD-HHmmss')}-${randomSuffix}-${tipe}.webp`;
  
    const { error: uploadError } = await supabaseAdmin.storage
      .from('absensi_fotos')
      .upload(fileName, buffer, {
        contentType: 'image/webp',
        upsert: false
      });
  
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return { success: false, error: 'Gagal mengunggah foto ke penyimpanan.' };
    }
  
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('absensi_fotos')
      .getPublicUrl(fileName);
  
    const fotoUrl = publicUrlData.publicUrl;

    // 2. Simpan record absensi ke database
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
  } catch (err: any) {
    console.error('Error saat submit absensi:', err);
    return { success: false, error: err?.message || 'Gagal menyimpan data absensi. Silakan coba lagi.' };
  }
}

export async function getAllAbsensi(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  statusFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const session = await getServerSession();
  if (!isAdminRole(session?.user?.role)) return [];

  const baseQuery = db.select({
    id: absensi.id, userId: absensi.userId, tanggalAbsen: absensi.tanggalAbsen, waktuAbsen: absensi.waktuAbsen,
    tipe: absensi.tipe, fotoUrl: absensi.fotoUrl, latitude: absensi.latitude, longitude: absensi.longitude,
    statusValidasi: absensi.statusValidasi, catatanSistem: absensi.catatanSistem, createdAt: absensi.createdAt,
    namaLengkap: user.name, idRelawan: user.idRelawan, divisi: user.divisi, status: user.status
  }).from(absensi).leftJoin(user, eq(absensi.userId, user.id));

  // Build conditions
  const conditions = [];
  
  if (options?.search) {
    conditions.push(ilike(user.name, `%${options.search}%`));
  }
  
  if (options?.statusFilter && options.statusFilter !== 'semua') {
    conditions.push(eq(absensi.statusValidasi, options.statusFilter));
  }
  
  if (options?.dateFrom) {
    conditions.push(sql`${absensi.tanggalAbsen} >= ${options.dateFrom}`);
  }

  if (options?.dateTo) {
    conditions.push(sql`${absensi.tanggalAbsen} <= ${options.dateTo}`);
  }

  // Apply conditions
  const queryWithWhere = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

  // Apply order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalQuery: any = queryWithWhere.orderBy(desc(absensi.createdAt));

  // Apply pagination
  if (options?.limit) {
    finalQuery = finalQuery.limit(options.limit);
  }
  
  if (options?.offset) {
    finalQuery = finalQuery.offset(options.offset);
  }

  return finalQuery;
}

export async function getAbsensiCount(options?: {
  search?: string;
  statusFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const session = await getServerSession();
  if (!isAdminRole(session?.user?.role)) return 0;

  const conditions = [];
  
  if (options?.search) {
    conditions.push(ilike(user.name, `%${options.search}%`));
  }
  
  if (options?.statusFilter && options.statusFilter !== 'semua') {
    conditions.push(eq(absensi.statusValidasi, options.statusFilter));
  }
  
  if (options?.dateFrom) {
    conditions.push(sql`${absensi.tanggalAbsen} >= ${options.dateFrom}`);
  }

  if (options?.dateTo) {
    conditions.push(sql`${absensi.tanggalAbsen} <= ${options.dateTo}`);
  }

  const result = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(absensi)
    .leftJoin(user, eq(absensi.userId, user.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0]?.count || 0;
}

export async function updateAbsensiStatus(id: string, statusValidasi: 'valid' | 'invalid' | 'menunggu' | 'flagged' | 'ditolak') {
  const session = await getServerSession();
  if (!isAdminRole(session?.user?.role)) return { success: false, error: 'Unauthorized' };

  await db.update(absensi).set({ statusValidasi }).where(eq(absensi.id, id));
  return { success: true };
}

/**
 * H2+H3 Fix: Server-side filtered riwayat absensi untuk relawan.
 * Menggantikan pendekatan lama (fetch 50 record lalu filter client-side)
 * dengan query database yang di-filter berdasarkan bulan dan tahun.
 */
export async function getRiwayatRelawan(month: number, year: number) {
  const session = await getServerSession();
  if (!session?.user) return [];

  // Build date range for the given month (0-indexed month)
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const records = await db.select().from(absensi)
    .where(and(
      eq(absensi.userId, session.user.id),
      sql`${absensi.tanggalAbsen} >= ${startDate}`,
      sql`${absensi.tanggalAbsen} <= ${endDate}`
    ))
    .orderBy(desc(absensi.createdAt));

  return records;
}
