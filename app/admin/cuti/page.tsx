'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Clock, CalendarIcon, Paperclip, X } from 'lucide-react';
import { getAllCutiAdmin, updateCutiStatus as updateCutiStatusAction } from '@/app/actions/cuti';
import { goeyToast } from 'goey-toast';

type StatusCuti = 'Semua' | 'Menunggu' | 'Disetujui' | 'Ditolak';

type CutiItem = Awaited<ReturnType<typeof getAllCutiAdmin>>[number];

export default function AdminCutiPage() {
  const [cutiRequests, setCutiRequests] = useState<CutiItem[]>([]);
  
  const [filterStatus, setFilterStatus] = useState<StatusCuti>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllCutiAdmin();
        setCutiRequests(data || []);
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, []);

  const filteredRequests = cutiRequests.filter(req => {
    const matchStatus = filterStatus === 'Semua' || req.status === filterStatus;
    const matchSearch = (req.namaLengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (req.idRelawan || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleApprove = async (id: string) => {
    if (confirm('Setujui pengajuan cuti ini?')) {
      try {
        const result = await updateCutiStatusAction(id, 'Disetujui');
        if (result && !result.success) {
          throw new Error(result.error || 'Gagal menyetujui');
        }
        setCutiRequests(d => d.map(r => r.id === id ? { ...r, status: 'Disetujui' } : r));
        goeyToast.success('Pengajuan cuti disetujui.');
      } catch (e) {
        console.error(e);
        goeyToast.error('Gagal menyetujui');
      }
    }
  };

  const handleReject = async (id: string) => {
    if (confirm('Tolak pengajuan cuti ini?')) {
      try {
        const result = await updateCutiStatusAction(id, 'Ditolak');
        if (result && !result.success) {
          throw new Error(result.error || 'Gagal menolak');
        }
        setCutiRequests(d => d.map(r => r.id === id ? { ...r, status: 'Ditolak' } : r));
        goeyToast.success('Pengajuan cuti ditolak.');
      } catch (e) {
        console.error(e);
        goeyToast.error('Gagal menolak');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Persetujuan Cuti</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola pengajuan cuti dan izin relawan.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['Semua', 'Menunggu', 'Disetujui', 'Ditolak'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as StatusCuti | 'Semua')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                filterStatus === status 
                  ? 'bg-[#071e49] text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama atau ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#071e49] focus:ring-1 focus:ring-[#071e49]"
          />
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <CalendarIcon className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada pengajuan cuti yang ditemukan.</p>
          </div>
        ) : (
          filteredRequests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:border-[#b5e0ea] transition-colors">
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {req.status === 'Menunggu' && (
                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md text-[10px] font-bold border border-amber-200 uppercase tracking-wider">
                    <Clock className="w-3 h-3" /> Menunggu
                  </span>
                )}
                {req.status === 'Disetujui' && (
                  <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[10px] font-bold border border-emerald-200 uppercase tracking-wider">
                    <CheckCircle className="w-3 h-3" /> Disetujui
                  </span>
                )}
                {req.status === 'Ditolak' && (
                  <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md text-[10px] font-bold border border-rose-200 uppercase tracking-wider">
                    <XCircle className="w-3 h-3" /> Ditolak
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="mb-4 pr-24">
                <h3 className="font-bold text-slate-800 text-lg">{req.namaLengkap}</h3>
                <p className="text-slate-500 text-xs font-semibold">{req.idRelawan}</p>
              </div>

              {/* Details */}
              <div className="space-y-3 flex-1">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1 font-medium">Jenis Pengajuan</p>
                  <p className="text-sm font-semibold text-slate-700">{req.jenisCuti}</p>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Mulai</p>
                    <p className="text-sm font-semibold text-slate-700">{req.tanggalMulai}</p>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Selesai</p>
                    <p className="text-sm font-semibold text-slate-700">{req.tanggalSelesai}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1 font-medium">Keterangan / Alasan</p>
                  <p className="text-sm text-slate-700 line-clamp-3">{req.alasan}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-medium">Lampiran Bukti</p>
                  {req.urlBukti ? (
                    <button
                      onClick={() => {
                        if (req.urlBukti?.toLowerCase().includes('.pdf')) {
                          window.open(req.urlBukti, '_blank');
                        } else {
                          setSelectedImage(req.urlBukti || null);
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#071e49] bg-[#071e49]/10 px-3 py-1.5 rounded-lg hover:bg-[#071e49]/20 transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5" /> Lihat
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic">Tidak ada</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {req.status === 'Menunggu' && (
                <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => handleReject(req.id)}
                    className="flex-1 py-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold text-sm transition-colors"
                  >
                    Tolak
                  </button>
                  <button 
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 py-2 rounded-xl text-white bg-emerald-500 hover:bg-emerald-600 font-bold text-sm transition-colors shadow-md shadow-emerald-500/20"
                  >
                    Setujui
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-fade-in">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-all"
          >
            <X className="w-8 h-8" />
          </button>
          
          <img 
            src={selectedImage} 
            alt="Bukti Lampiran" 
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
