'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

// ponytail: rely on better-auth or host (Vercel) for generic rate limiting.
// In-memory Maps leak or reset arbitrarily on serverless.

export async function requestPasswordReset(identifier: string) {
  try {
    const trimmed = (identifier || '').trim().toLowerCase();
    if (!trimmed) return { success: false, error: 'Wajib diisi.' };

    const [found] = await db
      .select({ email: user.email })
      .from(user)
      .where(or(eq(user.email, trimmed), eq(user.idRelawan, trimmed.toUpperCase())))
      .limit(1);

    if (found?.email) {
      await auth.api.requestPasswordReset({
        body: { email: found.email, redirectTo: `${process.env.FRONTEND_URL || 'https://absensi-sppg-teluknaga03.id'}/reset-password` },
      });
    }
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    if (!token || newPassword.length < 8) return { success: false, error: 'Invalid token atau password.' };
    await auth.api.resetPassword({ body: { token, newPassword } });
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error?.message || 'Gagal mereset password.' };
  }
}
