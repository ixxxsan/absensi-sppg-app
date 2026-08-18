'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Key, HelpCircle, ChevronRight, X, Camera } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { goeyToast } from 'goey-toast';
import { motion, Variants } from 'framer-motion';

export default function ProfilPage() {
  const router = useRouter();
  
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user as NonNullable<typeof session>['user'] & { idRelawan?: string, divisi?: string, status?: string } | undefined;

  const [showPasswordModal, setShowPasswordModal] = useState(false);
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
      goeyToast.error('Gagal: Password minimal 8 karakter, wajib mengandung minimal 1 huruf kapital dan angka.');
      return;
    }

    if (newPassword !== confirmPassword) {
      goeyToast.error('Gagal: Konfirmasi password baru tidak cocok.');
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
      goeyToast.success('Password berhasil diubah.');
      // clear inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      goeyToast.error(error instanceof Error ? error.message : 'Gagal mengubah password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] ?? 'Relawan';

  // Animation variants
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div 
      className="min-h-[100dvh] flex flex-col pt-safe pb-24 relative text-white"
      style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}
    >

      {/* ── Header ── */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="px-5 pt-8 pb-6 flex flex-col items-center justify-center text-center"
      >
        <h1 className="text-white text-xl font-bold mb-6">Profil Saya</h1>
        
        {/* Avatar */}
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl mb-4 relative cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: user?.image ? `url(${user.image}) center/cover` : 'linear-gradient(135deg, #b5e0ea, #7ec8d8)',
            boxShadow: '0 10px 40px -10px rgba(181,224,234,0.3)',
            border: '4px solid rgba(255,255,255,0.1)'
          }}
        >
          {!user?.image && (
            <span className="font-bold text-4xl" style={{ color: '#071e49' }}>
              {firstName.charAt(0).toUpperCase()}
            </span>
          )}
          
          <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
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
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 mt-1">
              Sedang Cuti
            </span>
          )}
        </div>
      </motion.header>

      {/* ── Menu List ── */}
      <motion.section 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="px-5 mt-4 space-y-3 flex-1"
      >
        
        {/* Pengaturan Akun */}
        <motion.button 
          variants={itemVars}
          whileTap={{ scale: 0.96 }}
          onClick={() => router.push('/profil/pengaturan')}
          className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 flex items-center justify-between transition-colors hover:bg-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-blue-500/20 border border-blue-500/20">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white font-medium">Pengaturan Akun</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </motion.button>

        {/* Ganti Password */}
        <motion.button 
          variants={itemVars}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowPasswordModal(true)}
          className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 flex items-center justify-between transition-colors hover:bg-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-indigo-500/20 border border-indigo-500/20">
              <Key className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-white font-medium">Ganti Password</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </motion.button>

        {/* Bantuan / FAQ */}
        <motion.button 
          variants={itemVars}
          whileTap={{ scale: 0.96 }}
          onClick={() => router.push('/profil/bantuan')}
          className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 flex items-center justify-between transition-colors hover:bg-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-500/20 border border-emerald-500/20">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white font-medium">Bantuan / FAQ</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </motion.button>
      </motion.section>

      {/* ── Logout Button ── */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 24 }}
        className="px-5 pt-8 pb-4"
      >
        <motion.button 
          whileTap={{ scale: 0.96 }}
          onClick={handleLogout}
          className="w-full py-4 rounded-[1.5rem] font-bold flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          KELUAR AKUN
        </motion.button>
      </motion.section>

      {/* ── Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowPasswordModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] w-full max-w-sm overflow-hidden border border-white/10 shadow-2xl relative z-10"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <h3 className="text-white font-bold text-lg">Ganti Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Password Lama</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required 
                  className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Password Baru</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" 
                />
                <p className="text-slate-400 text-[10px] mt-2 leading-relaxed">Min. 8 karakter, kombinasi angka dan minimal 1 huruf kapital.</p>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Konfirmasi Password Baru</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" 
                />
              </div>
              <motion.button 
                whileTap={{ scale: 0.96 }}
                type="submit" 
                disabled={isChangingPassword}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl mt-4 transition-colors flex justify-center items-center shadow-lg shadow-indigo-500/20"
              >
                {isChangingPassword ? 'MENYIMPAN...' : 'Simpan Password'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
