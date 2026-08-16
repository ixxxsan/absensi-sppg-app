'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';

import { getCutiRelawan, submitCuti } from '@/app/actions/cuti';
import { authClient } from '@/lib/auth-client';

export default function CutiPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user as { idRelawan?: string } | undefined;
  
  type CutiRecord = Awaited<ReturnType<typeof getCutiRelawan>>[number];
  const [cutiRequests, setCutiRequests] = useState<CutiRecord[]>([]);

  useEffect(() => {
    async function fetchCuti() {
      try {
        const data = await getCutiRelawan();
        setCutiRequests(data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCuti();
  }, []);

  const [activeTab, setActiveTab] = useState<'form' | 'riwayat'>('form');
  
  // Form State
  const [jenisCuti, setJenisCuti] = useState<string>('Cuti Tahunan');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [alasan, setAlasan] = useState('');
  
  const [toastMessage, setToastMessage] = useState('');

  const myRequests = cutiRequests;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.idRelawan) return;

    try {
      const result = await submitCuti(jenisCuti, tanggalMulai, tanggalSelesai, alasan);
      if (result && !result.success) {
        throw new Error(result.error || 'Gagal mengirim pengajuan cuti.');
      }
      
      // Refresh list
      const data = await getCutiRelawan();
      setCutiRequests(data || []);

      setToastMessage('Pengajuan cuti berhasil dikirim.');
      setTimeout(() => setToastMessage(''), 3000);
      
      // Reset form and switch to history tab
      setJenisCuti('Cuti Tahunan');
      setTanggalMulai('');
      setTanggalSelesai('');
      setAlasan('');
      setActiveTab('riwayat');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan saat mengajukan cuti.");
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
        <h1 className="text-white text-xl font-bold">Pengajuan Cuti / Izin</h1>
      </header>

      {/* Tabs */}
      <div className="px-5 mt-2">
        <div className="flex p-1 bg-slate-900/50 rounded-xl backdrop-blur-sm border border-white/5">
          <button 
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'form' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Form Pengajuan
          </button>
          <button 
            onClick={() => setActiveTab('riwayat')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'riwayat' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Riwayat
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 mt-6 overflow-y-auto">
        {activeTab === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="card p-5 space-y-5">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Jenis Cuti</label>
                <div className="relative">
                  <select 
                    value={jenisCuti}
                    onChange={(e) => setJenisCuti(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700/50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#b5e0ea] appearance-none"
                  >
                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Keperluan Pribadi">Keperluan Pribadi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Mulai</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date" 
                      required
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700/50 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#b5e0ea]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Selesai</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date" 
                      required
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700/50 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#b5e0ea]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Keterangan / Alasan</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea 
                    required
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    rows={3}
                    placeholder="Tuliskan alasan lengkap..."
                    className="w-full bg-slate-800/80 border border-slate-700/50 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#b5e0ea] resize-none"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 rounded-xl font-bold text-[#071e49] text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #b5e0ea, #7ec8d8)',
                boxShadow: '0 8px 24px rgba(181,224,234,0.3)'
              }}
            >
              AJUKAN SEKARANG
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {myRequests.length === 0 ? (
              <div className="card p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">Belum ada riwayat pengajuan cuti.</p>
              </div>
            ) : (
              myRequests.slice().reverse().map((req) => (
                <div key={req.id} className="card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-bold">{req.jenisCuti}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{req.tanggalMulai} s.d {req.tanggalSelesai}</p>
                    </div>
                    {req.status === 'Menunggu' && (
                      <span className="flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" /> Menunggu
                      </span>
                    )}
                    {req.status === 'Disetujui' && (
                      <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                      </span>
                    )}
                    {req.status === 'Ditolak' && (
                      <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" /> Ditolak
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-slate-300 text-sm">{req.alasan}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
