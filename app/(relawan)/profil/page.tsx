'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Key, FileText, HelpCircle, ChevronRight, X, Camera } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';

export default function ProfilPage() {
  const router = useRouter();
  const { user, logout, login } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordToast, setPasswordToast] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Update user photo in AuthStore
        login({ ...user, fotoProfil: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAjukanCuti = () => {
    router.push('/profil/cuti');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate password change success
    setShowPasswordModal(false);
    setPasswordToast('Password berhasil diubah.');
    setTimeout(() => setPasswordToast(''), 3000);
  };

  const firstName = user?.namaLengkap?.split(' ')[0] ?? 'Relawan';

  return (
    <div className="min-h-dvh flex flex-col pt-safe pb-24 relative"
         style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}>
      
      {/* ── Toasts ── */}
      {passwordToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg z-50 animate-fade-in-up">
          {passwordToast}
        </div>
      )}

      {/* ── Header ── */}
      <header className="px-5 pt-8 pb-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-white text-xl font-bold mb-6">Profil Saya</h1>
        
        {/* Avatar */}
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl mb-4 relative cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: user?.fotoProfil ? `url(${user.fotoProfil}) center/cover` : 'linear-gradient(135deg, #b5e0ea, #7ec8d8)',
            boxShadow: '0 8px 32px rgba(181,224,234,0.2)',
            border: '4px solid rgba(7,30,73,0.8)'
          }}
        >
          {!user?.fotoProfil && (
            <span className="font-bold text-4xl" style={{ color: '#071e49' }}>
              {firstName.charAt(0).toUpperCase()}
            </span>
          )}
          
          <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <Camera className="w-6 h-6 text-white mb-1" />
             <span className="text-white text-[10px] font-semibold">Ubah</span>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handlePhotoUpload} 
          />
        </div>
        
        <h2 className="text-white text-2xl font-bold">{user?.namaLengkap ?? 'Relawan SPPG'}</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <p className="text-sm font-semibold" style={{ color: '#b5e0ea' }}>
            {user?.idRelawan ?? 'SPPG-000'}
          </p>
          {user?.status === 'Cuti' && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              Cuti
            </span>
          )}
        </div>
      </header>

      {/* ── Menu List ── */}
      <section className="px-5 mt-4 space-y-3 flex-1">
        
        {/* Pengaturan Akun */}
        <button 
          onClick={() => router.push('/profil/pengaturan')}
          className="w-full card flex items-center justify-between transition-colors hover:bg-white/5 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(181,224,234,0.1)' }}>
              <Settings className="w-5 h-5" style={{ color: '#b5e0ea' }} />
            </div>
            <span className="text-white font-medium">Pengaturan Akun</span>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'rgba(181,224,234,0.3)' }} />
        </button>

        {/* Ganti Password */}
        <button 
          onClick={() => setShowPasswordModal(true)}
          className="w-full card flex items-center justify-between transition-colors hover:bg-white/5 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(181,224,234,0.1)' }}>
              <Key className="w-5 h-5" style={{ color: '#b5e0ea' }} />
            </div>
            <span className="text-white font-medium">Ganti Password</span>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'rgba(181,224,234,0.3)' }} />
        </button>

        {/* Pengajuan Cuti/Izin */}
        <button 
          onClick={handleAjukanCuti}
          className="w-full card flex items-center justify-between transition-colors hover:bg-white/5 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(181,224,234,0.1)' }}>
              <FileText className="w-5 h-5" style={{ color: '#b5e0ea' }} />
            </div>
            <span className="text-white font-medium">Ajukan Cuti / Izin</span>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'rgba(181,224,234,0.3)' }} />
        </button>

        {/* Bantuan / FAQ */}
        <button 
          onClick={() => router.push('/profil/bantuan')}
          className="w-full card flex items-center justify-between transition-colors hover:bg-white/5 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(181,224,234,0.1)' }}>
              <HelpCircle className="w-5 h-5" style={{ color: '#b5e0ea' }} />
            </div>
            <span className="text-white font-medium">Bantuan / FAQ</span>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'rgba(181,224,234,0.3)' }} />
        </button>
      </section>

      {/* ── Logout Button ── */}
      <section className="px-5 pt-8 pb-4">
        <button onClick={handleLogout}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  color: '#f87171'
                }}>
          <LogOut className="w-5 h-5" />
          KELUAR AKUN
        </button>
      </section>

      {/* ── Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-lg">Ganti Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase">Password Lama</label>
                <input type="password" required className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase">Password Baru</label>
                <input type="password" required className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase">Konfirmasi Password Baru</label>
                <input type="password" required className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl mt-2 transition-colors">
                Simpan Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
