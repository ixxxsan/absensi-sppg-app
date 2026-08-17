'use server';

import { auth } from '@/lib/auth';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

// ponytail: simplified template to the bare minimum that works and reads well.
async function sendPasswordEmail(email: string, pass: string, name: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'SPPG <no-reply@absensi-sppg-teluknaga03.id>',
      to: email,
      subject: 'Akun SPPG Teluknaga 03 Anda Dibuat',
      html: `<p>Halo ${name},</p><p>Email: <b>${email}</b><br/>Password: <b>${pass}</b></p><p><a href="https://absensi-sppg-teluknaga03.id/login">Masuk</a></p>`,
    });
  } catch (e) {
    console.error('Email error:', e);
  }
}

const isAdmin = (role?: string) => role === 'admin' || role === 'super_admin';

export async function getRelawans() {
  const session = await getServerSession();
  return isAdmin(session?.user?.role) ? db.select().from(user).where(eq(user.role, 'relawan')).orderBy(asc(user.createdAt)) : [];
}

export async function createRelawan(fd: FormData) {
  const session = await getServerSession();
  if (!isAdmin(session?.user?.role)) return { success: false, error: 'Unauthorized' };

  const [email, namaLengkap, status] = ['email', 'namaLengkap', 'status'].map(k => (fd.get(k) as string || '').trim());
  const pass = randomBytes(4).toString('hex');

  try {
    const res = await auth.api.signUpEmail({ body: { email, name: namaLengkap, password: pass } });
    if (!res?.user) throw new Error('API signUp gagal');

    await db.update(user).set({
      role: 'relawan', nik: fd.get('nik') as string, divisi: fd.get('divisi') as string, 
      status, idRelawan: fd.get('idRelawan') as string, noTelepon: fd.get('noTelepon') as string,
      statusAktif: status === 'Aktif'
    }).where(eq(user.id, res.user.id));

    await sendPasswordEmail(email, pass, namaLengkap);
    revalidatePath('/admin/relawan');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateRelawan(id: string, fd: FormData) {
  const session = await getServerSession();
  if (!isAdmin(session?.user?.role)) return { success: false, error: 'Unauthorized' };

  const status = (fd.get('status') as string || '').trim();
  await db.update(user).set({
    name: fd.get('namaLengkap') as string, nik: fd.get('nik') as string,
    email: fd.get('email') as string, noTelepon: fd.get('noTelepon') as string,
    divisi: fd.get('divisi') as string, status, statusAktif: status === 'Aktif'
  }).where(eq(user.id, id));

  revalidatePath('/admin/relawan');
  return { success: true };
}

export async function deleteRelawan(id: string) {
  const session = await getServerSession();
  if (!isAdmin(session?.user?.role)) return { success: false, error: 'Unauthorized' };

  const { absensi, cuti, session: s, account } = await import('@/lib/db/schema');
  await db.transaction(async (tx) => {
    await Promise.all([tx.delete(cuti).where(eq(cuti.userId, id)), tx.delete(absensi).where(eq(absensi.userId, id)), tx.delete(s).where(eq(s.userId, id)), tx.delete(account).where(eq(account.userId, id))]);
    await tx.delete(user).where(eq(user.id, id));
  });
  revalidatePath('/admin/relawan');
  return { success: true };
}

export interface BulkImportRow {
  namaLengkap: string;
  nik: string;
  email: string;
  noTelepon: string;
  divisi: string;
  status: string;
}

export async function bulkImportRelawan(rows: BulkImportRow[]) {
  const session = await getServerSession();
  if (!isAdmin(session?.user?.role)) return { success: false, error: 'Unauthorized' };

  const nums = (await db.select({ idRelawan: user.idRelawan }).from(user).where(eq(user.role, 'relawan')))
    .map(u => parseInt(u.idRelawan?.replace(/\D/g, '') || '0')).sort((a, b) => a - b);
  
  let next = 1;
  while (nums.includes(next)) next++;

  const results = await Promise.all(rows.map(async (r, i) => {
    const pass = randomBytes(4).toString('hex');
    try {
      const res = await auth.api.signUpEmail({ body: { email: r.email, name: r.namaLengkap, password: pass } });
      if (!res?.user) throw new Error('Fail');
      await db.update(user).set({
        role: 'relawan', nik: r.nik, divisi: r.divisi, status: r.status || 'Aktif',
        idRelawan: `SPPG-${String(next + i).padStart(3, '0')}`, noTelepon: r.noTelepon, statusAktif: r.status !== 'Cuti'
      }).where(eq(user.id, res.user.id));
      await sendPasswordEmail(r.email, pass, r.namaLengkap);
      return { success: true, email: r.email };
    } catch (e: any) {
      return { success: false, email: r.email, error: e.message };
    }
  }));

  revalidatePath('/admin/relawan');
  return { success: true, results };
}
