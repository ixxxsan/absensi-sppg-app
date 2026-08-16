'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cuti, user } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { nowWIB } from '@/lib/utils';

export async function submitCuti(
  jenisCuti: string,
  tanggalMulai: string,
  tanggalSelesai: string,
  alasan: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const now = nowWIB();

  await db.insert(cuti).values({
    userId: session.user.id,
    jenisCuti,
    tanggalMulai,
    tanggalSelesai,
    alasan,
    status: 'Menunggu',
    tanggalPengajuan: now.format('YYYY-MM-DD HH:mm:ss'),
  });

  return { success: true };
}

export async function getCutiRelawan() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const records = await db
    .select()
    .from(cuti)
    .where(eq(cuti.userId, session.user.id))
    .orderBy(desc(cuti.createdAt));

  return records;
}

export async function getAllCutiAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
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
      createdAt: cuti.createdAt,
      namaLengkap: user.name,
      idRelawan: user.idRelawan,
    })
    .from(cuti)
    .leftJoin(user, eq(cuti.userId, user.id))
    .orderBy(desc(cuti.createdAt));

  return records;
}

export async function updateCutiStatus(id: string, status: 'Disetujui' | 'Ditolak' | 'Menunggu') {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  await db.update(cuti)
    .set({ status })
    .where(eq(cuti.id, id));

  return { success: true };
}
