'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { headers } from 'next/headers';

// ponytail: rely on better-auth or host (Vercel) for generic rate limiting.
// In-memory Maps leak or reset arbitrarily on serverless.

export async function requestPasswordReset(identifier: string) {
  try {
    const trimmed = (identifier || '').trim().toLowerCase();
    if (!trimmed) return { success: false, error: 'Wajib diisi.' };

    const headerList = await headers();
    const host = headerList.get('x-forwarded-host') || headerList.get('host');
    const proto = headerList.get('x-forwarded-proto') || (host && !host.includes('localhost') && !host.includes('127.0.0.1') ? 'https' : 'http');

    let appUrl = process.env.FRONTEND_URL || process.env.BETTER_AUTH_URL || 'https://absensi-sppg-teluknaga03.id';
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      appUrl = `${proto}://${host}`;
    }
    appUrl = appUrl.replace(/\/+$/, '');

    const [found] = await db
      .select({ email: user.email })
      .from(user)
      .where(or(eq(user.email, trimmed), eq(user.idRelawan, trimmed.toUpperCase())))
      .limit(1);

    if (found?.email) {
      await auth.api.requestPasswordReset({
        body: { email: found.email, redirectTo: `${appUrl}/reset-password` },
        headers: headerList,
      });
    }
    return { success: true };
  } catch (err) {
    console.error('requestPasswordReset error:', err);
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
