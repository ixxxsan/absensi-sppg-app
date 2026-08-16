'use server';

import { auth } from '@/lib/auth';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { headers, cookies } from 'next/headers';
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
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; text-align: center;">
          <img src="https://absensi-sppg-teluknaga03.id/logo-bgn.png" alt="Logo SPPG Teluknaga 03" style="width: 80px; height: auto; margin-bottom: 15px;" />
          <h2 style="color: #1a56db; margin-top: 0;">Selamat Datang di SPPG Teluknaga 03!</h2>
        </div>
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <p>Halo <strong>${name}</strong>,</p>
          <p>Akun relawan Anda telah berhasil dibuat. Anda sekarang dapat masuk ke aplikasi absensi SPPG Teluknaga 03 menggunakan detail berikut:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p>Silakan klik tautan di bawah ini untuk mengakses aplikasi:</p>
          <a href="https://absensi-sppg-teluknaga03.id/login" style="display: inline-block; padding: 10px 20px; background-color: #1a56db; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Masuk ke Aplikasi</a>
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">Demi keamanan, kami menyarankan agar Anda segera mengganti password Anda setelah pertama kali berhasil masuk (fitur ganti password sedang dikembangkan).</p>
          <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">Jika Anda memiliki pertanyaan, silakan hubungi tim administrasi SPPG Teluknaga 03.</p>
        </div>
      `,
    });
    console.log(`[RESEND] Email berhasil dikirim ke: ${email}`);
  } catch (error) {
    console.error(`[RESEND ERROR] Gagal mengirim email ke: ${email}`, error);
  }
}

export async function getRelawans() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user || session.user.role !== 'admin') {
      return [];
    }

    const relawans = await db.select().from(user).where(eq(user.role, 'relawan')).orderBy(desc(user.createdAt));
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
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll().map(c => c.name).join(', ');
      return { success: false, error: `Sesi tidak valid (Cookies: ${allCookies}).` };
    }
    if (!session.user || session.user.role !== 'admin') {
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
  } catch (error: any) {
    console.error('Error creating relawan:', error);
    return { success: false, error: `Gagal menyimpan: ${error?.message || 'Unknown error'}` };
  }
}

export async function updateRelawan(id: string, formData: FormData) {
  try {
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Sesi tidak valid saat memperbarui (getSession returned null).' };
    }
    if (!session.user || session.user.role !== 'admin') {
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'admin') {
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
