'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Key, FileText, HelpCircle, ChevronRight, X, Camera } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export default function ProfilPage() {
  const router = useRouter();
  
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user as NonNullable<typeof session>['user'] & { idRelawan?: string, divisi?: string, status?: string } | undefined;

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordToast, setPasswordToast] = useState('');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace('/login');
        },
      },
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          await authClient.updateUser({
            image: base64String
          });
        } catch (error) {
          console.error("Failed to update profile photo", error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi kompleksitas password
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(newPassword)) {
      setPasswordToast('Gagal: Password minimal 8 karakter, wajib mengandung minimal 1 huruf kapital dan angka.');
      setTimeout(() => setPasswordToast(''), 4000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordToast('Gagal: Konfirmasi password baru tidak cocok.');
      setTimeout(() => setPasswordToast(''), 3000);
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authClient.changePassword({
        newPassword: newPassword,
        currentPassword: currentPassword,
        revokeOtherSessions: true,
      });
      
      if (res.error) {
        throw new Error(res.error.message || 'Gagal mengubah password');
      }

      setShowPasswordModal(false);
      setPasswordToast('Password berhasil diubah.');
      // clear inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordToast(''), 3000);
    } catch (error: unknown) {
      setPasswordToast(error instanceof Error ? error.message : 'Gagal mengubah password.');
      setTimeout(() => setPasswordToast(''), 3000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] ?? 'Relawan';

  return (
    <div className="min-h-dvh flex flex-col pt-safe pb-24 relative"
         style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}>
      
      {/* ── Toasts ── */}
      {passwordToast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg z-50 animate-fade-in-up ${passwordToast.includes('Gagal') ? 'bg-red-500' : 'bg-emerald-500'}`}>
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
            background: user?.image ? `url(${user.image}) center/cover` : 'linear-gradient(135deg, #b5e0ea, #7ec8d8)',
            boxShadow: '0 8px 32px rgba(181,224,234,0.2)',
            border: '4px solid rgba(7,30,73,0.8)'
          }}
        >
          {!user?.image && (
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
        
        <h2 className="text-white text-2xl font-bold">{user?.name ?? (isPending ? 'Loading...' : 'Relawan SPPG')}</h2>
        <div className="flex flex-col items-center gap-1 mt-1">
          <p className="text-sm font-semibold" style={{ color: '#b5e0ea' }}>
            {user?.idRelawan ?? 'SPPG-000'}
            {user?.divisi && ` • ${user.divisi}`}
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
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required 
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase">Password Baru</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" 
                />
                <p className="text-slate-400 text-[10px] mt-1.5">Min. 8 karakter, kombinasi angka dan minimal 1 huruf kapital.</p>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase">Konfirmasi Password Baru</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isChangingPassword}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl mt-2 transition-colors flex justify-center items-center"
              >
                {isChangingPassword ? 'MENYIMPAN...' : 'Simpan Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
