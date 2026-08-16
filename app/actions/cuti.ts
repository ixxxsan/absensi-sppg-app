'use server';

import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { cuti, user } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nowWIB } from '@/lib/utils';

export async function submitCuti(
  jenisCuti: string,
  tanggalMulai: string,
  tanggalSelesai: string,
  alasan: string
) {
  const session = await getServerSession();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const now = nowWIB();

  const safeJenisCuti = (jenisCuti || '').trim().substring(0, 100);
  const safeAlasan = (alasan || '').trim().substring(0, 500);

  await db.insert(cuti).values({
    userId: session.user.id,
    jenisCuti: safeJenisCuti,
    tanggalMulai,
    tanggalSelesai,
    alasan: safeAlasan,
    status: 'Menunggu',
    tanggalPengajuan: now.format('YYYY-MM-DD HH:mm:ss'),
  });

  return { success: true };
}

export async function getCutiRelawan() {
  const session = await getServerSession();
  if (!session?.user) {
    return [];
  }

  const records = await db
    .select()
    .from(cuti)
    .where(eq(cuti.userId, session.user.id))
    .orderBy(desc(cuti.tanggalPengajuan));

  return records;
}

export async function getAllCutiAdmin() {
  const session = await getServerSession();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    return [];
  }

  const records = await db
    .select({
      id: cuti.id,
      userId: cuti.userId,
      jenisCuti: cuti.jenisCuti,
      tanggalMulai: cuti.tanggalMulai,
      tanggalSelesai: cuti.tanggalSelesai,
      alasan: cuti.alasan,
      status: cuti.status,
      tanggalPengajuan: cuti.tanggalPengajuan,
      namaLengkap: user.name,
      idRelawan: user.idRelawan,
    })
    .from(cuti)
    .leftJoin(user, eq(cuti.userId, user.id))
    .orderBy(desc(cuti.tanggalPengajuan));

  return records;
}

export async function updateCutiStatus(id: string, status: 'Disetujui' | 'Ditolak' | 'Menunggu') {
  const session = await getServerSession();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    return { success: false, error: 'Unauthorized' };
  }

  await db.update(cuti)
    .set({ status })
    .where(eq(cuti.id, id));

  return { success: true };
}
