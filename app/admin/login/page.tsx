'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { authClient } from '@/lib/auth-client';

const adminLoginSchema = z.object({
  email: z.string().min(1, 'Username / Email tidak boleh kosong'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { register, getValues, trigger, formState: { errors } } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true);
    setLoginError('');
    try {
      const emailInput = data.email.trim().toLowerCase();
      
      const { data: signInData, error } = await authClient.signIn.email({
        email: emailInput,
        password: data.password,
      });

      if (error || !signInData?.user) {
        setLoginError('Email/Username atau password salah.');
        setIsLoading(false);
        return;
      }

      // Pastikan user ini memiliki role admin atau super_admin di database
      if (signInData.user.role === 'admin' || signInData.user.role === 'super_admin') {
        login({
          id: 99,
          namaLengkap: signInData.user.name,
          email: signInData.user.email,
          role: signInData.user.role as any,
          token: 'admin-token-xyz', // Dummy for zustand compatibility
        });
        router.replace('/admin/dashboard');
      } else {
        setLoginError('Akses ditolak: Akun bukan admin.');
        setIsLoading(false);
      }
    } catch {
      setLoginError('Terjadi kesalahan server. Coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex"
         style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}>
      {/* Left panel - Branding (desktop) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-transparent flex items-center justify-center mx-auto overflow-hidden shadow-2xl">
            <Image src="/icons/icon-192.png" alt="Logo" width={96} height={96} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">Panel Admin</h1>
            <p className="text-slate-400 mt-2">Manajemen Absensi Relawan SPPG TELUKNAGA 03</p>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 lg:max-w-md">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex lg:hidden flex-col items-center gap-4 mb-10">
            <div className="w-20 h-20 rounded-2xl bg-transparent flex items-center justify-center overflow-hidden shadow-xl">
              <Image src="/icons/icon-192.png" alt="Logo" width={80} height={80} className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-white text-xl font-bold">Admin Panel</h1>
              <p className="text-emerald-400 text-sm">SPPG TELUKNAGA 03 Management System</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 mb-8">
            <Shield className="w-5 h-5 text-emerald-400" />
            <p className="text-slate-300 text-sm font-semibold">Login Admin — Akses Terbatas</p>
          </div>

          <h2 className="text-white text-2xl font-bold mb-6">Masuk ke Dashboard</h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="admin-email"
                  type="text"
                  autoComplete="username"
                  placeholder="Admin"
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
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Password admin"
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
                  id="admin-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password.message}
                </p>
              )}
            </div>

            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{loginError}</p>
              </div>
            )}

            <button
              id="admin-login-btn"
              type="button"
              onClick={async () => {
                const isValid = await trigger();
                if (isValid) {
                  const data = getValues();
                  onSubmit(data);
                }
              }}
              disabled={isLoading}
              className="btn-primary mt-2 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk ke Dashboard →'
              )}
            </button>
          </div>

          <p className="text-slate-600 text-xs text-center mt-8">
            <a href="/login" className="text-slate-500 hover:text-slate-300 transition-colors">
              ← Masuk sebagai Relawan
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
