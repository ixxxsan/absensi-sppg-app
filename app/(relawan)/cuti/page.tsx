'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, CalendarIcon, FileText, Send, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { submitCuti, getCutiRelawan } from '@/app/actions/cuti';

export default function PengajuanCutiPage() {
  const router = useRouter();
  
  const [jenisCuti, setJenisCuti] = useState('Sakit');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [alasan, setAlasan] = useState('');
  
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadRiwayat = async () => {
    try {
      const records = await getCutiRelawan();
      setRiwayat(records || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRiwayat();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalMulai || !tanggalSelesai || !alasan) {
      setToastMessage('Harap lengkapi semua field!');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCuti(jenisCuti, tanggalMulai, tanggalSelesai, alasan);
      setToastMessage('Pengajuan berhasil dikirim!');
      setJenisCuti('Sakit');
      setTanggalMulai('');
      setTanggalSelesai('');
      setAlasan('');
      await loadRiwayat();
    } catch (err: any) {
      setToastMessage(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg z-50 animate-fade-in-up whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="px-5 pt-safe pt-6 pb-4 bg-white shadow-sm border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
        <button 
          onClick={() => router.push('/profil')}
          className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-slate-800 text-lg font-bold">Cuti & Izin</h1>
        <div className="w-10"></div>
      </header>

      <div className="p-5 space-y-8 flex-1 overflow-y-auto">
        
        {/* Form Pengajuan */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <CalendarIcon className="w-32 h-32" />
          </div>
          
          <h2 className="text-lg font-bold text-slate-800 mb-5 relative z-10">Pengajuan Baru</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Jenis Cuti/Izin</label>
              <select 
                value={jenisCuti}
                onChange={(e) => setJenisCuti(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-[#071e49] focus:ring-1 focus:ring-[#071e49] appearance-none"
              >
                <option value="Sakit">Sakit</option>
                <option value="Cuti Tahunan">Cuti Tahunan</option>
                <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                <option value="Izin Penting">Izin Penting</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Mulai</label>
                <input 
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-[#071e49] focus:ring-1 focus:ring-[#071e49]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Selesai</label>
                <input 
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-[#071e49] focus:ring-1 focus:ring-[#071e49]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Alasan</label>
              <textarea 
                rows={3}
                placeholder="Tuliskan alasan pengajuan cuti..."
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-[#071e49] focus:ring-1 focus:ring-[#071e49] resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#071e49] text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#071e49]/20 disabled:opacity-70"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </form>
        </section>

        {/* Riwayat Pengajuan */}
        <section>
          <h2 className="text-slate-800 font-bold mb-4 ml-1">Riwayat Pengajuan</h2>
          <div className="space-y-3">
            {riwayat.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-slate-100 border-dashed">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">Belum ada riwayat</p>
              </div>
            ) : (
              riwayat.map(req => (
                <div key={req.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{req.jenisCuti}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{req.tanggalMulai} s/d {req.tanggalSelesai}</p>
                    <p className="text-slate-400 text-xs mt-1.5 line-clamp-1">{req.alasan}</p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {req.status === 'Menunggu' && (
                      <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-[10px] font-bold border border-amber-200">
                        <Clock className="w-3 h-3" />
                      </span>
                    )}
                    {req.status === 'Disetujui' && (
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    )}
                    {req.status === 'Ditolak' && (
                      <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-[10px] font-bold border border-rose-200">
                        <XCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
