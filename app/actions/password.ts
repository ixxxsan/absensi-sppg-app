'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { headers } from 'next/headers';

// ─── In-Memory Rate Limiter ───
// Best solution for single-instance Next.js (no external deps needed).
// Uses probabilistic cleanup to prevent memory leaks.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  maxAttempts: number = 3,
  windowMs: number = 3600000 // 1 hour
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();

  // Probabilistic cleanup (~1% chance per call)
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitMap) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

// ─── Server Action: Request Password Reset ───
export async function requestPasswordReset(identifier: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Rate limiting berdasarkan IP
    const headerStore = await headers();
    const ip =
      headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headerStore.get('x-real-ip') ||
      'unknown';

    const rateKey = `reset:${ip}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateKey, 3, 3600000);

    if (!allowed) {
      const minutesLeft = Math.ceil(retryAfterMs / 60000);
      return {
        success: false,
        error: `Terlalu banyak percobaan. Silakan coba lagi dalam ${minutesLeft} menit.`,
      };
    }

    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: 'Email atau ID Relawan wajib diisi.' };
    }

    // 2. Lookup user berdasarkan email ATAU idRelawan
    const [foundUser] = await db
      .select({ id: user.id, email: user.email, idRelawan: user.idRelawan })
      .from(user)
      .where(or(eq(user.email, trimmed), eq(user.idRelawan, trimmed.toUpperCase())))
      .limit(1);

    // 3. Anti-enumeration: jika tidak ditemukan atau tanpa email, diam saja
    if (!foundUser || !foundUser.email) {
      // Return success tetap agar tidak bocorkan info akun
      return { success: true };
    }

    // 4. Panggil better-auth forgetPassword API
    const frontendUrl = process.env.FRONTEND_URL || 'https://absensi-sppg-teluknaga03.id';

    await auth.api.requestPasswordReset({
      body: {
        email: foundUser.email,
        redirectTo: `${frontendUrl}/reset-password`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[PASSWORD RESET] Error:', error);
    // Tetap return success untuk anti-enumeration
    return { success: true };
  }
}

// ─── Server Action: Reset Password ───
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!token) {
      return { success: false, error: 'Token reset tidak valid.' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'Password minimal 8 karakter.' };
    }

    if (!/[A-Z]/.test(newPassword)) {
      return {
        success: false,
        error: 'Password harus mengandung minimal 1 huruf kapital.',
      };
    }

    if (!/[0-9]/.test(newPassword)) {
      return {
        success: false,
        error: 'Password harus mengandung minimal 1 angka.',
      };
    }

    // Panggil better-auth resetPassword API
    await auth.api.resetPassword({
      body: {
        token,
        newPassword,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('[RESET PASSWORD] Error:', error);

    const message =
      error instanceof Error ? error.message.toLowerCase() : '';

    if (message.includes('expired') || message.includes('invalid')) {
      return {
        success: false,
        error: 'Tautan telah kedaluwarsa atau tidak valid. Silakan minta tautan baru.',
      };
    }

    return {
      success: false,
      error: 'Terjadi kesalahan saat mereset password. Silakan coba lagi.',
    };
  }
}
