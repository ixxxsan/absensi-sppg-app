'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resetPassword } from '@/app/actions/password';

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Z]/, 'Harus mengandung minimal 1 huruf kapital')
      .regex(/[0-9]/, 'Harus mengandung kombinasi angka'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect jika tidak ada token
  useEffect(() => {
    if (!token) {
      router.replace(
        '/forgot-password?error=Tautan+tidak+valid.+Silakan+minta+tautan+baru.'
      );
    }
  }, [token, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    setErrorMessage('');

    const result = await resetPassword(token, data.newPassword);

    if (result.success) {
      setIsSuccess(true);
      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        router.replace('/login?reset=success');
      }, 2000);
    } else {
      // Handle expired/invalid token
      if (
        result.error?.includes('kedaluwarsa') ||
        result.error?.includes('tidak valid')
      ) {
        setErrorMessage(result.error);
        setTimeout(() => {
          router.replace(
            '/forgot-password?error=Tautan+telah+kedaluwarsa,+silakan+minta+tautan+baru.'
          );
        }, 3000);
      } else {
        setErrorMessage(result.error || 'Terjadi kesalahan.');
      }
    }

    setIsLoading(false);
  };

  if (!token) return null;

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between px-5 py-12"
      style={{
        background:
          'radial-gradient(ellipse at top, #0c2860 0%, #071e49 55%, #04122d 100%)',
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8">
        {/* Logo + Heading */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="relative animate-float">
            <div className="relative w-28 h-28 flex items-center justify-center mx-auto">
              <img
                src="/icons/icon-192.png"
                alt="Logo SPPG"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-white text-2xl font-bold tracking-tight">
              Buat Password Baru
            </h1>
            <p
              className="text-sm font-semibold mt-0.5 tracking-wider"
              style={{ color: '#b5e0ea' }}
            >
              SPPG TANGERANG TELUKNAGA 03
            </p>
          </div>
        </motion.div>

        {/* Form / Success State */}
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              className="w-full space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <p
                className="text-sm text-center leading-relaxed"
                style={{ color: 'rgba(181,224,234,0.7)' }}
              >
                Masukkan kata sandi baru Anda. Minimal 8 karakter dengan 1
                huruf kapital dan kombinasi angka.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-password"
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'rgba(181,224,234,0.7)' }}
                  >
                    Password Baru
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'rgba(181,224,234,0.5)' }}
                    />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Masukkan password baru"
                      {...register('newPassword')}
                      className={`input-field input-icon-left input-icon-right ${errors.newPassword ? 'input-field-error' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'rgba(181,224,234,0.5)' }}
                      aria-label={
                        showPassword
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p
                      className="text-xs flex items-center gap-1"
                      style={{ color: '#f87171' }}
                    >
                      <AlertCircle className="w-3 h-3" />{' '}
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirm-password"
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'rgba(181,224,234,0.7)' }}
                  >
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'rgba(181,224,234,0.5)' }}
                    />
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Ulangi password baru"
                      {...register('confirmPassword')}
                      className={`input-field input-icon-left input-icon-right ${errors.confirmPassword ? 'input-field-error' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'rgba(181,224,234,0.5)' }}
                      aria-label={
                        showConfirm
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p
                      className="text-xs flex items-center gap-1"
                      style={{ color: '#f87171' }}
                    >
                      <AlertCircle className="w-3 h-3" />{' '}
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Error */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 p-3 rounded-xl"
                    style={{
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.3)',
                    }}
                  >
                    <AlertCircle
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: '#f87171' }}
                    />
                    <p className="text-sm" style={{ color: '#f87171' }}>
                      {errorMessage}
                    </p>
                  </motion.div>
                )}

                {/* Submit */}
                <button
                  id="btn-reset"
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary mt-2 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300/40 border-t-slate-700 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Simpan Password Baru
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <a
                href="/login"
                className="flex items-center justify-center gap-2 text-sm transition-colors mt-4"
                style={{ color: 'rgba(181,224,234,0.6)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </a>
            </motion.div>
          ) : (
            /* ── Success State ── */
            <motion.div
              key="success"
              className="w-full text-center space-y-5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="flex justify-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    border: '2px solid rgba(16,185,129,0.4)',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.2,
                      duration: 0.5,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                  >
                    <ShieldCheck
                      className="w-10 h-10"
                      style={{ color: '#10B981' }}
                    />
                  </motion.div>
                </div>
              </div>

              <div>
                <h2 className="text-white text-lg font-bold">
                  Password Berhasil Diubah!
                </h2>
                <p
                  className="text-sm mt-2 leading-relaxed"
                  style={{ color: 'rgba(181,224,234,0.7)' }}
                >
                  Kata sandi Anda telah diperbarui. Anda akan diarahkan ke
                  halaman login...
                </p>
              </div>

              <div className="flex justify-center pt-2">
                <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <p
        className="text-xs text-center"
        style={{ color: 'rgba(181,224,234,0.3)' }}
      >
        SPPG TANGERANG TELUKNAGA 03 &copy; 2026 &middot; v1.0.0
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
