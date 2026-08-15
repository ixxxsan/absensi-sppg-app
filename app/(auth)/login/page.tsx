'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore, useRelawanStore } from '@/lib/stores';

const loginSchema = z.object({
  email: z.string().min(1, 'Email atau ID Relawan wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { register, handleSubmit, getValues, trigger, formState: { errors } } = useForm<LoginForm>({
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
      await new Promise((r) => setTimeout(r, 800));
      const emailInput = data.email.trim().toLowerCase();
      
      // Look up relawan in the store
      const relawanList = useRelawanStore.getState().relawanList;
      const foundRelawan = relawanList.find(r => r.email.toLowerCase() === emailInput || r.idRelawan.toLowerCase() === emailInput);

      if (foundRelawan && data.password === 'password123') {
        login({ 
          id: foundRelawan.id, 
          idRelawan: foundRelawan.idRelawan, 
          namaLengkap: foundRelawan.namaLengkap, 
          email: foundRelawan.email, 
          role: 'relawan', 
          token: 'mock-token-xyz',
          divisi: foundRelawan.divisi
        });
        router.replace('/beranda');
      } else if (emailInput === 'relawan@sppg.id' && data.password === 'password123') {
        // Fallback for default demo account if deleted from store
        login({ id: 0, idRelawan: 'SPPG-000', namaLengkap: 'Relawan Demo', email: emailInput, role: 'relawan', token: 'mock-token-xyz' });
        router.replace('/beranda');
      } else {
        setLoginError('Email/ID atau password salah. Silakan coba lagi.');
        setIsLoading(false);
      }
    } catch {
      setLoginError('Terjadi kesalahan. Periksa koneksi internet Anda.');
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
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-3xl blur-xl opacity-40"
                 style={{ background: '#b5e0ea', transform: 'scale(1.1)' }} />
            <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-2xl bg-transparent"
                 style={{ border: 'none' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192.png"
                alt="Logo SPPG"
                className="w-full h-full object-contain"
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

          {/* Remember me */}
          <label htmlFor="remember-me" className="flex items-center gap-3 cursor-pointer group">
            <input
              id="remember-me"
              type="checkbox"
              {...register('rememberMe')}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#b5e0ea' }}
            />
            <span className="text-sm" style={{ color: 'rgba(181,224,234,0.65)' }}>
              Ingat Saya (30 hari)
            </span>
          </label>

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
