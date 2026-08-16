'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, AlertCircle, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestPasswordReset } from '@/app/actions/password';

const forgotSchema = z.object({
  identifier: z.string().min(1, 'Email atau ID Relawan wajib diisi'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { identifier: '' },
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    setErrorMessage('');

    const result = await requestPasswordReset(data.identifier);

    if (result.error) {
      setErrorMessage(result.error);
      setIsLoading(false);
    } else {
      setIsSubmitted(true);
      setIsLoading(false);
    }
  };

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
              Lupa Password
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
          {!isSubmitted ? (
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
                Masukkan email atau ID Relawan Anda. Kami akan mengirimkan
                tautan untuk mereset kata sandi.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Identifier Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="forgot-identifier"
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'rgba(181,224,234,0.7)' }}
                  >
                    Email atau ID Relawan
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'rgba(181,224,234,0.5)' }}
                    />
                    <input
                      id="forgot-identifier"
                      type="text"
                      autoComplete="username"
                      placeholder="relawan@gmail.com atau SPPG-001"
                      {...register('identifier')}
                      className={`input-field input-icon-left ${errors.identifier ? 'input-field-error' : ''}`}
                    />
                  </div>
                  {errors.identifier && (
                    <p
                      className="text-xs flex items-center gap-1"
                      style={{ color: '#f87171' }}
                    >
                      <AlertCircle className="w-3 h-3" />{' '}
                      {errors.identifier.message}
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
                  id="btn-forgot"
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary mt-2 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300/40 border-t-slate-700 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Link Reset
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm transition-colors mt-4"
                style={{ color: 'rgba(181,224,234,0.6)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </Link>
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
                  <CheckCircle2
                    className="w-10 h-10"
                    style={{ color: '#10B981' }}
                  />
                </div>
              </div>

              <div>
                <h2 className="text-white text-lg font-bold">
                  Tautan Terkirim!
                </h2>
                <p
                  className="text-sm mt-2 leading-relaxed"
                  style={{ color: 'rgba(181,224,234,0.7)' }}
                >
                  Jika Email/ID terdaftar, tautan reset telah dikirim ke email
                  Anda. Silakan periksa inbox dan folder spam.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link href="/login">
                  <button className="btn-primary flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Login
                  </button>
                </Link>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setErrorMessage('');
                  }}
                  className="btn-secondary flex items-center justify-center gap-2 w-full"
                >
                  <Send className="w-4 h-4" />
                  Kirim Ulang
                </button>
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
