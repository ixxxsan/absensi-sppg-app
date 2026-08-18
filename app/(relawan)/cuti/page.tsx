'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronDown, CalendarIcon, FileText, Send, Clock, CheckCircle2, XCircle, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { submitCuti, getCutiRelawan } from '@/app/actions/cuti';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/utils';
import { goeyToast } from 'goey-toast';
import { motion, Variants } from 'framer-motion';

export default function PengajuanCutiPage() {
  const router = useRouter();
  
  const [jenisCuti, setJenisCuti] = useState('Sakit');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [alasan, setAlasan] = useState('');
  const [fileBukti, setFileBukti] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  type CutiRecord = Awaited<ReturnType<typeof getCutiRelawan>>[number];
  const [riwayat, setRiwayat] = useState<CutiRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const loadRiwayat = async () => {
    try {
      const records = await getCutiRelawan();
      setRiwayat(records || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const records = await getCutiRelawan();
        setRiwayat(records || []);
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalMulai || !tanggalSelesai || !alasan) {
      goeyToast.error('Harap lengkapi semua field!');
      return;
    }

    if (jenisCuti === 'Sakit' && !fileBukti) {
      goeyToast.error('Harap unggah surat keterangan dokter untuk cuti Sakit!');
      return;
    }

    setIsSubmitting(true);
    try {
      let urlBukti = '';

      if (fileBukti) {
        goeyToast.info('Mengunggah dokumen...');
        
        let fileToUpload: Blob = fileBukti;
        let fileName = `${Date.now()}_${fileBukti.name}`;
        
        // Kompres jika berupa gambar, skip kompresi jika PDF
        if (fileBukti.type.startsWith('image/')) {
           fileToUpload = await compressImage(fileBukti, 0.7);
           fileName = `${Date.now()}_bukti.webp`;
        }

        const { data, error } = await supabase.storage
          .from('bukti-cuti')
          .upload(fileName, fileToUpload, {
            contentType: fileBukti.type.startsWith('image/') ? 'image/webp' : fileBukti.type,
            upsert: false
          });

        if (error) {
          throw new Error('Gagal mengunggah bukti: ' + error.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('bukti-cuti')
          .getPublicUrl(data.path);
          
        urlBukti = publicUrlData.publicUrl;
      }

      goeyToast.info('Mengirim pengajuan...');
      const result = await submitCuti(jenisCuti, tanggalMulai, tanggalSelesai, alasan, urlBukti);
      if (result && !result.success) {
        throw new Error(result.error || 'Gagal mengirim pengajuan cuti.');
      }
      goeyToast.success('Pengajuan berhasil dikirim!');
      setJenisCuti('Sakit');
      setTanggalMulai('');
      setTanggalSelesai('');
      setAlasan('');
      setFileBukti(null);
      await loadRiwayat();
    } catch (err: unknown) {
      goeyToast.error(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      className="min-h-[100dvh] flex flex-col text-white"
      style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}
    >

      {/* Header */}
      <header className="px-5 pt-safe pt-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <button 
          onClick={() => router.push('/profil')}
          className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-lg font-bold">Cuti & Izin</h1>
        <div className="w-10"></div>
      </header>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="p-5 space-y-8 flex-1 overflow-y-auto pb-24"
      >
        
        {/* Form Pengajuan */}
        <motion.section 
          variants={itemVars}
          className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 relative overflow-hidden"
        >
          <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] pointer-events-none">
            <CalendarIcon className="w-40 h-40" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-6 relative z-10 flex items-center gap-2">
            Pengajuan Baru
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider ml-1">Jenis Cuti/Izin</label>
              <div className="relative">
                <select 
                  value={jenisCuti}
                  onChange={(e) => setJenisCuti(e.target.value)}
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 appearance-none transition-colors"
                >
                  <option value="Sakit" className="text-slate-900">Sakit</option>
                  <option value="Cuti Tahunan" className="text-slate-900">Cuti Tahunan</option>
                  <option value="Cuti Melahirkan" className="text-slate-900">Cuti Melahirkan</option>
                  <option value="Izin Penting" className="text-slate-900">Izin Penting</option>
                  <option value="Lainnya" className="text-slate-900">Lainnya</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider ml-1">Mulai</label>
                <input 
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider ml-1">Selesai</label>
                <input 
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider ml-1">Alasan</label>
              <textarea 
                rows={3}
                placeholder="Tuliskan alasan pengajuan..."
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 resize-none transition-colors placeholder:text-slate-600"
              />
            </div>

            {jenisCuti === 'Sakit' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider ml-1">Unggah Surat Dokter (Wajib)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full px-4 py-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                    fileBukti ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/20 bg-black/20 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type === 'application/pdf' && file.size > 2 * 1024 * 1024) {
                          goeyToast.error('Ukuran PDF maksimal 2 MB!');
                          e.target.value = '';
                          return;
                        }
                        setFileBukti(file);
                      }
                    }}
                  />
                  {fileBukti ? (
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                      <p className="text-sm font-bold text-white line-clamp-1 break-all px-4">{fileBukti.name}</p>
                      <p className="text-xs text-slate-400 mt-1.5">{(fileBukti.size / 1024).toFixed(1)} KB • Klik untuk mengganti</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <UploadCloud className="w-10 h-10 text-slate-500 mb-3" />
                      <p className="text-sm font-bold text-slate-300">Tekan untuk unggah berkas</p>
                      <p className="text-xs text-slate-500 mt-1.5">JPG, PNG, WEBP, atau PDF (Max 2MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <motion.button 
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-500/20 disabled:opacity-70 transition-colors"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </motion.button>
          </form>
        </motion.section>

        {/* Riwayat Pengajuan */}
        <motion.section variants={itemVars}>
          <h2 className="text-white text-lg font-bold mb-5 ml-1">Riwayat Pengajuan</h2>
          <div className="space-y-4">
            {riwayat.length === 0 ? (
              <div className="text-center py-10 bg-white/5 rounded-[2rem] border border-white/5 border-dashed">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Belum ada riwayat cuti</p>
              </div>
            ) : (
              riwayat.map(req => (
                <div key={req.id} className="bg-white/5 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/10 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{req.jenisCuti}</h3>
                    <p className="text-slate-400 text-xs mt-1">{req.tanggalMulai} s/d {req.tanggalSelesai}</p>
                    <p className="text-slate-500 text-xs mt-2 line-clamp-1 italic">"{req.alasan}"</p>
                  </div>
                  <div className="shrink-0">
                    {req.status === 'Menunggu' && (
                      <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        Menunggu
                      </span>
                    )}
                    {req.status === 'Disetujui' && (
                      <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Disetujui
                      </span>
                    )}
                    {req.status === 'Ditolak' && (
                      <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold border border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" />
                        Ditolak
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.section>

      </motion.div>
    </div>
  );
}
