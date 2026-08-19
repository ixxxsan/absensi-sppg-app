'use server';

import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { cuti, user } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nowWIB, isAdminRole } from '@/lib/utils';

export async function submitCuti(jenis: string, mulai: string, selesai: string, alasan: string, urlBukti?: string) {
  const session = await getServerSession();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  await db.insert(cuti).values({
    userId: session.user.id,
    jenisCuti: jenis?.trim().substring(0, 100) || '',
    tanggalMulai: mulai,
    tanggalSelesai: selesai,
    alasan: alasan?.trim().substring(0, 500) || '',
    urlBukti: urlBukti || null,
    status: 'Menunggu',
    tanggalPengajuan: nowWIB().format('YYYY-MM-DD'),
  });
  return { success: true };
}

export async function getCutiRelawan() {
  const session = await getServerSession();
  return session?.user ? db.select().from(cuti).where(eq(cuti.userId, session.user.id)).orderBy(desc(cuti.tanggalPengajuan)) : [];
}

export async function getAllCutiAdmin() {
  const session = await getServerSession();
  if (!isAdminRole(session?.user?.role)) return [];

  return db.select({
    id: cuti.id, userId: cuti.userId, jenisCuti: cuti.jenisCuti, tanggalMulai: cuti.tanggalMulai,
    tanggalSelesai: cuti.tanggalSelesai, alasan: cuti.alasan, status: cuti.status,
    tanggalPengajuan: cuti.tanggalPengajuan, urlBukti: cuti.urlBukti,
    namaLengkap: user.name, idRelawan: user.idRelawan
  }).from(cuti).leftJoin(user, eq(cuti.userId, user.id)).orderBy(desc(cuti.tanggalPengajuan));
}

export async function updateCutiStatus(id: string, status: 'Disetujui' | 'Ditolak' | 'Menunggu') {
  const session = await getServerSession();
  if (!isAdminRole(session?.user?.role)) return { success: false, error: 'Unauthorized' };

  await db.update(cuti).set({ status }).where(eq(cuti.id, id));
  return { success: true };
}
