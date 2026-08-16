'use server';

import { auth } from '@/lib/auth';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { Resend } from 'resend';

async function sendPasswordEmail(email: string, password: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY tidak ditemukan, pengiriman email di-skip.");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'SPPG Teluknaga 03 <no-reply@absensi-sppg-teluknaga03.id>',
      to: email,
      subject: 'Akun Relawan SPPG Teluknaga 03 Anda Telah Dibuat',
      html: `
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
      <!-- Credential Box -->
      <div style="background:linear-gradient(135deg,#f8fafc,#eef2f7);padding:20px;border-radius:12px;margin:24px 0;border:1px solid #e2e8f0;">
        <div style="margin-bottom: 16px;">
          <span style="display:block;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px;">Email</span>
          <span style="display:block;color:#071e49;font-size:15px;font-weight:700;word-break:break-all;">${email}</span>
        </div>
        <div>
          <span style="display:block;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px;">Password</span>
          <code style="display:inline-block;background:#071e49;color:#ffffff;padding:8px 16px;border-radius:6px;font-size:15px;font-weight:700;letter-spacing:1px;word-break:break-all;">${password}</code>
        </div>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://absensi-sppg-teluknaga03.id/login" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#0c2860,#1a3a70);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.3px;">Masuk ke Aplikasi</a>
      </div>
      <p style="color:#888;font-size:13px;line-height:1.5;">Catatan: Demi keamanan, segera <strong>ubah password</strong> Anda setelah berhasil masuk melalui menu <em>Profil → Pengaturan</em>.</p>
      <p style="color:#888;font-size:13px;line-height:1.5;">Jika Anda memiliki pertanyaan, silakan hubungi tim administrasi SPPG Teluknaga 03.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#aaa;font-size:12px;text-align:center;">© 2026 SPPG Tangerang Teluknaga 03<br/>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
    </div>
  </div>
</body>
</html>`,
    });
    console.log(`[RESEND] Email berhasil dikirim ke: ${email}`);
  } catch (error) {
    console.error(`[RESEND ERROR] Gagal mengirim email ke: ${email}`, error);
  }
}

export async function getRelawans() {
  try {
    const session = await getServerSession();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return [];
    }

    const relawans = await db.select().from(user).where(eq(user.role, 'relawan')).orderBy(asc(user.createdAt));
    return relawans;
  } catch (error) {
    console.error('Error fetching relawans:', error);
    return [];
  }
}

export async function createRelawan(formData: FormData) {
  try {
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Sesi tidak valid atau telah berakhir (Silakan login ulang).' };
    }
    if (!session.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return { success: false, error: 'Akses ditolak: Anda bukan admin.' };
    }

    const namaLengkap = (formData.get('namaLengkap') as string || '').trim();
    const email = (formData.get('email') as string || '').trim();
    const nik = (formData.get('nik') as string || '').trim();
    const noTelepon = (formData.get('noTelepon') as string || '').trim();
    const divisi = (formData.get('divisi') as string || '').trim();
    const status = (formData.get('status') as string || '').trim();
    const idRelawan = (formData.get('idRelawan') as string || '').trim();

    // Generate random password (Sppg + last 4 digits of NIK)
    const defaultPassword = `Sppg${nik.slice(-4)}!`;

    // Create user via better-auth signUpEmail
    const result = await auth.api.signUpEmail({
      body: {
        email,
        name: namaLengkap,
        password: defaultPassword,
      }
    });

    if (result && result.user) {
      // Update additional fields via Drizzle
      await db.update(user).set({
        role: 'relawan',
        nik,
        divisi,
        status,
        idRelawan,
        noTelepon,
        statusAktif: status === 'Aktif'
      }).where(eq(user.id, result.user.id));

      // Simulate sending email
      await sendPasswordEmail(email, defaultPassword, namaLengkap);
      revalidatePath('/admin/relawan');
      return { success: true };
    }
    
    return { success: false, error: 'Gagal membuat relawan (result API kosong).' };
  } catch (error: unknown) {
    console.error('Error creating relawan:', error);
    return { success: false, error: `Gagal menyimpan: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function updateRelawan(id: string, formData: FormData) {
  try {
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Sesi tidak valid saat memperbarui (getSession returned null).' };
    }
    if (!session.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return { success: false, error: 'Akses ditolak: Anda bukan admin.' };
    }

    const namaLengkap = (formData.get('namaLengkap') as string || '').trim();
    const nik = (formData.get('nik') as string || '').trim();
    const email = (formData.get('email') as string || '').trim(); // changing email might require special handling, assuming just update DB here
    const noTelepon = (formData.get('noTelepon') as string || '').trim();
    const divisi = (formData.get('divisi') as string || '').trim();
    const status = (formData.get('status') as string || '').trim();

    await db.update(user).set({
      name: namaLengkap,
      nik,
      email,
      noTelepon,
      divisi,
      status,
      statusAktif: status === 'Aktif'
    }).where(eq(user.id, id));

    revalidatePath('/admin/relawan');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating relawan:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui data.' };
  }
}

export async function deleteRelawan(id: string) {
  try {
    const session = await getServerSession();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete dependent records first to avoid foreign key constraint violations
    const { absensi, cuti, session: sessionTable, account } = await import('@/lib/db/schema');
    
    await db.delete(cuti).where(eq(cuti.userId, id));
    await db.delete(absensi).where(eq(absensi.userId, id));
    await db.delete(sessionTable).where(eq(sessionTable.userId, id));
    await db.delete(account).where(eq(account.userId, id));
    
    // Finally delete the user
    await db.delete(user).where(eq(user.id, id));
    
    revalidatePath('/admin/relawan');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting relawan:', error);
    return { success: false, error: 'Gagal menghapus data.' };
  }
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
  try {
    const session = await getServerSession();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return { success: false, error: 'Unauthorized' };
    }

    // Determine starting ID Relawan
    const existingUsers = await db.select({ idRelawan: user.idRelawan }).from(user).where(eq(user.role, 'relawan'));
    const usedNumbers = existingUsers
      .map(u => parseInt(u.idRelawan?.replace('SPPG-', '') || '0', 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    let nextNum = 1;
    for (const num of usedNumbers) {
      if (num === nextNum) {
        nextNum++;
      } else if (num > nextNum) {
        break;
      }
    }

    // We process sequentially or with careful ID assignment. Since batch size is 50, let's process sequentially for DB safety
    // or assign IDs upfront and use Promise.allSettled. Let's assign IDs upfront.
    const rowsWithIds = rows.map((row, index) => {
      // If there are gaps, this naive increment might fill a gap and then collide later, but it's fine for bulk import 
      // where we just increment nextNum sequentially and don't re-check gaps for the current batch.
      const idRelawan = `SPPG-${(nextNum + index).toString().padStart(3, '0')}`;
      return { ...row, idRelawan };
    });

    const promises = rowsWithIds.map(async (row) => {
      const defaultPassword = `Sppg${row.nik.slice(-4)}!`;

      try {
        const result = await auth.api.signUpEmail({
          body: {
            email: row.email,
            name: row.namaLengkap,
            password: defaultPassword,
          }
        });

        if (result && result.user) {
          await db.update(user).set({
            role: 'relawan',
            nik: row.nik,
            divisi: row.divisi,
            status: row.status || 'Aktif',
            idRelawan: row.idRelawan,
            noTelepon: row.noTelepon,
            statusAktif: row.status !== 'Cuti'
          }).where(eq(user.id, result.user.id));

          await sendPasswordEmail(row.email, defaultPassword, row.namaLengkap);
          return { success: true, email: row.email };
        } else {
          return { success: false, email: row.email, error: 'API signUp gagal.' };
        }
      } catch (err: unknown) {
        return { success: false, email: row.email, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    });

    const settled = await Promise.allSettled(promises);
    
    revalidatePath('/admin/relawan');

    const finalResults = settled.map(s => s.status === 'fulfilled' ? s.value : { success: false, email: 'unknown', error: 'Promise rejected' });
    return { success: true, results: finalResults };
  } catch (error: unknown) {
    console.error('Bulk import error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat impor massal.' };
  }
}

