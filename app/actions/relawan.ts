'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Mock Email Sender Function
async function sendPasswordEmail(email: string, password: string, name: string) {
  // In a real app, you would use Resend, SendGrid, or Nodemailer here.
  console.log('====================================================');
  console.log(`[EMAIL MOCK] Mengirim email ke: ${email}`);
  console.log(`Subjek: Akun Relawan SPPG Anda Telah Dibuat`);
  console.log(`Halo ${name}, akun Anda berhasil dibuat.`);
  console.log(`Silakan login menggunakan kredensial berikut:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Harap segera mengganti password setelah berhasil login.`);
  console.log('====================================================');
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
      }
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
