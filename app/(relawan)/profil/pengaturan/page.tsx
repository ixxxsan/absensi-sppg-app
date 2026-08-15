'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Phone, Mail, MapPin, Bell } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';

export default function PengaturanAkunPage() {
  const router = useRouter();
  const { user, login } = useAuthStore();

  const [namaLengkap, setNamaLengkap] = useState(user?.namaLengkap || '');
  const [email, setEmail] = useState(user?.email || '');
  const [noTelepon, setNoTelepon] = useState('081234567890'); // Dummy data since noTelepon isn't in AuthUser by default
  const [alamat, setAlamat] = useState('');
  
  const [notifAbsensi, setNotifAbsensi] = useState(true);
  const [notifPengumuman, setNotifPengumuman] = useState(true);

  const [toastMessage, setToastMessage] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      // Update store user
      login({ ...user, namaLengkap, email });
      setToastMessage('Pengaturan berhasil disimpan.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col pt-safe pb-24 relative"
         style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}>
      
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg z-50 animate-fade-in-up">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl font-bold">Pengaturan Akun</h1>
      </header>

      <div className="flex-1 px-5 mt-4 overflow-y-auto space-y-6">
        
        {/* Data Diri Form */}
        <section>
          <h2 className="text-slate-300 text-sm font-bold mb-3 uppercase tracking-wider">Data Diri</h2>
          <form onSubmit={handleSave} className="card p-5 space-y-4">
            
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/50 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#b5e0ea]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/50 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#b5e0ea]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase">No. Telepon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="tel" 
                  value={noTelepon}
                  onChange={(e) => setNoTelepon(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/50 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#b5e0ea]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase">Alamat Domisili</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <textarea 
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800/80 border border-slate-700/50 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#b5e0ea] resize-none"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg mt-2"
              style={{
                background: 'rgba(181,224,234,0.15)',
                border: '1px solid rgba(181,224,234,0.3)',
              }}
            >
              SIMPAN PERUBAHAN
            </button>
          </form>
        </section>

        {/* Preferensi Notifikasi */}
        <section>
          <h2 className="text-slate-300 text-sm font-bold mb-3 uppercase tracking-wider">Preferensi Notifikasi</h2>
          <div className="card p-2">
            
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800">
                  <Bell className="w-4 h-4 text-[#b5e0ea]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Pengingat Absensi</p>
                  <p className="text-slate-400 text-[10px]">Notifikasi saat tiba waktu absen</p>
                </div>
              </div>
              <button 
                onClick={() => setNotifAbsensi(!notifAbsensi)}
                className={`w-11 h-6 rounded-full transition-colors relative ${notifAbsensi ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notifAbsensi ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800">
                  <Bell className="w-4 h-4 text-[#b5e0ea]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Pengumuman SPPG</p>
                  <p className="text-slate-400 text-[10px]">Info terbaru dari pengurus</p>
                </div>
              </div>
              <button 
                onClick={() => setNotifPengumuman(!notifPengumuman)}
                className={`w-11 h-6 rounded-full transition-colors relative ${notifPengumuman ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notifPengumuman ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
