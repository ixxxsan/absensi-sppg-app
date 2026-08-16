'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Phone, Mail } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { goeyToast } from 'goey-toast';

export default function PengaturanAkunPage() {
  const router = useRouter();

  // Use Better Auth's real-time session
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [noTelepon, setNoTelepon] = useState('');
  const [divisi, setDivisi] = useState('');


  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const u = user as typeof user & { noTelepon?: string; divisi?: string };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNamaLengkap(u.name || '');
      setEmail(u.email || '');
      setNoTelepon(u.noTelepon || '');
      setDivisi(u.divisi || '');
      // We don't have alamat in db yet, keep local state
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await authClient.updateUser({
        name: namaLengkap,
        // email change requires specific email change flow in better-auth, so we might skip it or handle it 
        // We'll update the custom fields via a server action if needed, or if better-auth supports it via updateUser
        // @ts-expect-error: custom user property
        noTelepon: noTelepon,
      });

      goeyToast.success('Pengaturan berhasil disimpan.');
    } catch (error) {
      console.error(error);
      goeyToast.error('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col pt-safe pb-24 relative"
      style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}>

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
                  disabled={isPending}
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
                  disabled
                  className="w-full bg-slate-800/80 border border-slate-700/50 text-slate-400 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#b5e0ea] cursor-not-allowed opacity-70"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Email tidak dapat diubah dari profil.</p>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase">Divisi</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={divisi}
                  disabled
                  className="w-full bg-slate-800/80 border border-slate-700/50 text-slate-400 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#b5e0ea] cursor-not-allowed opacity-70"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Divisi hanya dapat diubah oleh admin.</p>
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
                  disabled={isPending}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || isPending}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg mt-2 flex justify-center disabled:opacity-50"
              style={{
                background: 'rgba(181,224,234,0.15)',
                border: '1px solid rgba(181,224,234,0.3)',
              }}
            >
              {isSaving ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
            </button>
          </form>
        </section>



      </div>
    </div>
  );
}
