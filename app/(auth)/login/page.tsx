'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { goeyToast } from 'goey-toast';

const loginSchema = z.object({
  email: z.string().min(1, 'Email atau ID Relawan wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Tampilkan toast jika baru saja reset password
  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      goeyToast.success('Kata sandi berhasil diubah. Silakan masuk dengan password baru.');
      // Bersihkan query parameter
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const { register, getValues, trigger, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    }
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setLoginError('');
    try {
      const emailInput = data.email.trim().toLowerCase();
      
      const res = await authClient.signIn.email({
        email: emailInput,
        password: data.password,
        rememberMe: data.rememberMe
      });

      if (res.error) {
        setLoginError(res.error.message || 'Email/ID atau password salah. Silakan coba lagi.');
        setIsLoading(false);
      } else {
        router.replace('/beranda');
      }
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : 'Terjadi kesalahan. Periksa koneksi internet Anda.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-5 py-12"
         style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 55%, #04122d 100%)' }}>

      {/* ── Logo + Heading ── */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          {/* Logo */}
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
            <h1 className="text-white text-2xl font-bold tracking-tight">Absensi Relawan</h1>
            <p className="text-sm font-semibold mt-0.5 tracking-wider" style={{ color: '#b5e0ea' }}>
              SPPG TANGERANG TELUKNAGA 03
            </p>
          </div>
        </div>

        {/* ── Form ── */}
        <div
              className="w-full space-y-4 animate-fade-in-up"
              style={{ animationDelay: '0.15s' }}>

          {/* Email/ID */}
          <div className="space-y-1.5">
            <label htmlFor="login-email"
                   className="text-xs font-semibold uppercase tracking-wider"
                   style={{ color: 'rgba(181,224,234,0.7)' }}>
              Email atau ID Relawan
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'rgba(181,224,234,0.5)' }} />
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                placeholder="relawan@gmail.com atau SPPG-001"
                {...register('email')}
                onKeyDown={async (e) => { 
                  if (e.key === 'Enter') { 
                    e.preventDefault(); 
                    const isValid = await trigger();
                    if (isValid) onSubmit(getValues()); 
                  } 
                }}
                className={`input-field input-icon-left ${errors.email ? 'input-field-error' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                <AlertCircle className="w-3 h-3" /> {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="login-password"
                   className="text-xs font-semibold uppercase tracking-wider"
                   style={{ color: 'rgba(181,224,234,0.7)' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'rgba(181,224,234,0.5)' }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Masukkan password"
                {...register('password')}
                onKeyDown={async (e) => { 
                  if (e.key === 'Enter') { 
                    e.preventDefault(); 
                    const isValid = await trigger();
                    if (isValid) onSubmit(getValues()); 
                  } 
                }}
                className={`input-field input-icon-left input-icon-right ${errors.password ? 'input-field-error' : ''}`}
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'rgba(181,224,234,0.5)' }}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                <AlertCircle className="w-3 h-3" /> {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember me + Lupa Password */}
          <div className="flex items-center justify-between">
            <label htmlFor="remember-me" className="flex items-center gap-3 cursor-pointer group">
              <input
                id="remember-me"
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#b5e0ea' }}
              />
              <span className="text-sm" style={{ color: 'rgba(181,224,234,0.65)' }}>
                Ingat Saya
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-gray-300 hover:text-white underline transition-colors"
            >
              Lupa Password?
            </Link>
          </div>

          {/* Error */}
          {loginError && (
            <div className="flex items-center gap-2 p-3 rounded-xl"
                 style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f87171' }} />
              <p className="text-sm" style={{ color: '#f87171' }}>{loginError}</p>
            </div>
          )}

          {/* Submit */}
          <button id="btn-login" type="button" onClick={async () => {
            const isValid = await trigger();
            if (isValid) {
              const data = getValues();
              onSubmit(data);
            }
          }} disabled={isLoading} className="btn-primary mt-2 flex items-center justify-center gap-3">
            {isLoading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-slate-300/40 border-t-slate-700 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              'Masuk →'
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-center" style={{ color: 'rgba(181,224,234,0.3)' }}>
        SPPG TANGERANG TELUKNAGA 03 &copy; 2026 &middot; v1.0.0
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
