'use server';

import { auth } from '@/lib/auth';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

// ponytail: template updated with uniform design matching reset password
async function sendPasswordEmail(email: string, pass: string, name: string) {
  if (!process.env.RESEND_API_KEY) return;
  
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#071e49 0%,#0c2860 100%);padding:32px 24px;text-align:center;">
      <img src="https://absensi-sppg-teluknaga03.id/logo-bgn.png" alt="Logo SPPG" style="width:64px;height:auto;margin-bottom:12px;" />
      <h1 style="color:#ffffff;font-size:20px;margin:0;">Selamat Datang!</h1>
      <p style="color:#b5e0ea;font-size:14px;margin:8px 0 0;">SPPG Tangerang Teluknaga 03</p>
    </div>
    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="color:#333;font-size:15px;line-height:1.6;">Halo <strong>${name}</strong>,</p>
      <p style="color:#555;font-size:14px;line-height:1.6;">Akun relawan Anda telah berhasil dibuat oleh tim administrasi. Gunakan kredensial berikut untuk masuk ke aplikasi absensi:</p>
      
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">EMAIL</p>
        <p style="margin:0 0 20px;font-size:15px;font-weight:600;"><a href="mailto:${email}" style="color:#0c2860;text-decoration:none;">${email}</a></p>
        
        <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">PASSWORD</p>
        <div style="display:inline-block;background:#0c2860;color:#ffffff;padding:10px 16px;border-radius:6px;font-size:16px;font-weight:700;letter-spacing:1px;">${pass}</div>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="https://absensi-sppg-teluknaga03.id/login" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#0c2860,#1a3a70);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.3px;">Masuk ke Aplikasi</a>
      </div>
      
      <p style="color:#888;font-size:13px;line-height:1.5;">Catatan: Demi keamanan, segera <strong>ubah password</strong> Anda setelah berhasil masuk melalui menu Profil &gt; Pengaturan.</p>
      <p style="color:#888;font-size:13px;line-height:1.5;">Jika Anda memiliki pertanyaan, silakan hubungi tim administrasi SPPG Teluknaga 03.</p>
      
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#aaa;font-size:12px;text-align:center;">© 2026 SPPG Tangerang Teluknaga 03<br/>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'SPPG Teluknaga 03 <no-reply@absensi-sppg-teluknaga03.id>',
      to: email,
      subject: 'Akun Relawan SPPG Teluknaga 03 Anda Telah Dibuat',
      html: htmlTemplate,
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
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
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
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, email: r.email, error: err.message };
    }
  }));

  revalidatePath('/admin/relawan');
  return { success: true, results };
}
