'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPasswordEmail(email: string, password: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY tidak ditemukan, pengiriman email di-skip.");
    return;
  }

  try {
    await resend.emails.send({
      from: 'SPPG <no-reply@absensi-sppg-teluknaga03.id>',
      to: email,
      subject: 'Akun Relawan SPPG Anda Telah Dibuat',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1a56db;">Selamat Datang di SPPG!</h2>
          <p>Halo <strong>${name}</strong>,</p>
          <p>Akun relawan Anda telah berhasil dibuat. Anda sekarang dapat masuk ke aplikasi absensi SPPG menggunakan detail berikut:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p>Silakan klik tautan di bawah ini untuk mengakses aplikasi:</p>
          <a href="https://absensi-sppg-teluknaga03.id/login" style="display: inline-block; padding: 10px 20px; background-color: #1a56db; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Masuk ke Aplikasi</a>
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">Demi keamanan, kami menyarankan agar Anda segera mengganti password Anda setelah pertama kali berhasil masuk (fitur ganti password sedang dikembangkan).</p>
          <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">Jika Anda memiliki pertanyaan, silakan hubungi tim administrasi SPPG.</p>
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
    const relawans = await db.select().from(user).where(eq(user.role, 'relawan')).orderBy(desc(user.createdAt));
    return relawans;
  } catch (error) {
    console.error('Error fetching relawans:', error);
    return [];
  }
}

export async function createRelawan(formData: FormData) {
  try {
    const reqHeaders = await headers();
    const namaLengkap = formData.get('namaLengkap') as string;
    const email = formData.get('email') as string;
    const nik = formData.get('nik') as string;
    const noTelepon = formData.get('noTelepon') as string;
    const divisi = formData.get('divisi') as string;
    const status = formData.get('status') as string;
    const idRelawan = formData.get('idRelawan') as string;

    // Generate random password (Sppg + last 4 digits of NIK)
    const defaultPassword = `Sppg${nik.slice(-4)}!`;

    // Admin creates user via better-auth API (to hash password correctly without logging them in)
    const result = await auth.api.createUser({
      headers: reqHeaders,
      body: {
        email,
        name: namaLengkap,
        password: defaultPassword,
        role: 'relawan' as any,
        nik,
        divisi,
        status,
        idRelawan,
        noTelepon,
        statusAktif: status === 'Aktif'
      } as any
    });

    if (result) {
      // Simulate sending email
      await sendPasswordEmail(email, defaultPassword, namaLengkap);
      revalidatePath('/admin/relawan');
      return { success: true };
    }
    
    return { success: false, error: 'Gagal membuat relawan.' };
  } catch (error: any) {
    console.error('Error creating relawan:', error);
    return { success: false, error: error?.message || 'Terjadi kesalahan saat menyimpan data.' };
  }
}

export async function updateRelawan(id: string, formData: FormData) {
  try {
    const namaLengkap = formData.get('namaLengkap') as string;
    const nik = formData.get('nik') as string;
    const email = formData.get('email') as string; // changing email might require special handling, assuming just update DB here
    const noTelepon = formData.get('noTelepon') as string;
    const divisi = formData.get('divisi') as string;
    const status = formData.get('status') as string;

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
  } catch (error: any) {
    console.error('Error updating relawan:', error);
    return { success: false, error: error?.message || 'Terjadi kesalahan saat memperbarui data.' };
  }
}

export async function deleteRelawan(id: string) {
  try {
    // Note: If you want to use better-auth, auth.api.adminDeleteUser({ body: { userId: id } })
    // But direct DB delete is simpler
    await db.delete(user).where(eq(user.id, id));
    revalidatePath('/admin/relawan');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting relawan:', error);
    return { success: false, error: 'Gagal menghapus data.' };
  }
}
