'use server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function resolveLoginIdentifier(identifier: string): Promise<string | null> {
  const trimmed = (identifier || '').trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed.includes('@')) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  const paddedId = digits ? `SPPG-${digits.padStart(3, '0')}` : trimmed.toUpperCase();

  const [found] = await db
    .select({ email: user.email })
    .from(user)
    .where(
      or(
        eq(user.idRelawan, trimmed.toUpperCase()),
        eq(user.idRelawan, paddedId)
      )
    )
    .limit(1);

  return found?.email || null;
}

export async function getLatestUser() {
  const session = await getServerSession();
  return session?.user ? (await db.select().from(user).where(eq(user.id, session.user.id)).limit(1))[0] || null : null;
}

export async function uploadProfilePhoto(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const file = formData.get('photo') as Blob | null;
  if (!file) return { success: false, error: 'File foto tidak ditemukan' };

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'Ukuran foto maksimal 5MB' };
  }

  try {
    const { supabaseAdmin } = await import('@/lib/supabase-admin');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `avatars/${session.user.id}-${Date.now()}.webp`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('absensi_fotos')
      .upload(fileName, buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload avatar error:', uploadError);
      return { success: false, error: 'Gagal mengunggah foto profil ke penyimpanan' };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('absensi_fotos')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    await db.update(user).set({ image: publicUrl }).where(eq(user.id, session.user.id));

    revalidatePath('/profil');
    revalidatePath('/beranda');

    return { success: true, imageUrl: publicUrl };
  } catch (error) {
    console.error('uploadProfilePhoto error:', error);
    return { success: false, error: 'Terjadi kesalahan sistem saat memproses foto' };
  }
}
