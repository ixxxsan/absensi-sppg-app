'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle } from 'lucide-react';
import { getAllAbsensi, updateAbsensiStatus } from '@/app/actions/absensi';
import { goeyToast } from 'goey-toast';

type ValidationStatus = 'valid' | 'invalid' | 'menunggu' | 'flagged';

const statusBadge: Record<ValidationStatus, string> = {
  valid: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  invalid: 'text-red-700 bg-red-50 border border-red-200',
  menunggu: 'text-slate-700 bg-slate-100 border border-slate-200',
  flagged: 'text-orange-700 bg-orange-50 border border-orange-200',
};

type AbsensiItem = Awaited<ReturnType<typeof getAllAbsensi>>[number];

export default function AbsensiValidasiPage() {
  const [data, setData] = useState<AbsensiItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | ValidationStatus>('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  useEffect(() => {
    async function fetchData() {
      const records = await getAllAbsensi();
      setData(records || []);
    }
    fetchData();
  }, []);

  const filtered = data.filter((row) => {
    const nama = row.namaLengkap || 'Unknown';
    const idRelawan = row.idRelawan || 'SPPG-000';
    const matchSearch = nama.toLowerCase().includes(search.toLowerCase()) ||
                        idRelawan.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? row.statusValidasi === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const updateStatus = async (id: string, status: ValidationStatus) => {
    try {
      const result = await updateAbsensiStatus(id, status);
      if (result && !result.success) {
        goeyToast.error(result.error || 'Gagal mengubah status');
        return;
      }
      goeyToast.success(`Status berhasil diubah menjadi ${status}`);
      setData((d) => d.map((r) => r.id === id ? { ...r, statusValidasi: status } : r));
    } catch (e) {
      console.error(e);
    }
    setPreviewId(null);
    setIsFullscreen(false);
  };

  const previewRow = data.find((r) => r.id === previewId);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-slate-800 text-2xl font-bold">Validasi Absensi</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Review dan validasi bukti absensi relawan
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="absen-search"
            type="text"
            placeholder="Cari nama atau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white
                       text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          {(['', 'valid', 'invalid', 'flagged'] as const).map((s) => (
            <button
              key={s}
              id={`filter-${s || 'all'}`}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                ${filterStatus === s
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
            >
              {s === '' ? 'Semua' : s === 'valid' ? 'Valid' : s === 'invalid' ? 'Ditolak' : 'Flagged'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Valid', count: data.filter(r => r.statusValidasi === 'valid').length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Ditolak', count: data.filter(r => r.statusValidasi === 'invalid').length, color: 'text-red-600 bg-red-50' },
          { label: 'Flagged', count: data.filter(r => r.statusValidasi === 'flagged').length, color: 'text-orange-600 bg-orange-50' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['ID', 'Nama', 'Tanggal', 'Waktu', 'Tipe', 'Koordinat GPS', 'Status', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedData.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3.5 font-mono text-xs font-semibold text-emerald-600">{row.idRelawan}</td>
                <td className="px-4 py-3.5 text-slate-700 font-medium">{row.namaLengkap || 'Unknown'}</td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">{row.tanggalAbsen}</td>
                <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{row.waktuAbsen}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${row.tipe === 'masuk' ? 'text-blue-700 bg-blue-50' : 'text-amber-700 bg-amber-50'}`}>
                    {row.tipe === 'masuk' ? 'Masuk' : 'Pulang'}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                  {Number(row.latitude).toFixed(3)}, {Number(row.longitude).toFixed(3)}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge[row.statusValidasi as ValidationStatus] || statusBadge.menunggu}`}>
                    {row.statusValidasi === 'valid' ? 'Valid' : row.statusValidasi === 'invalid' ? 'Ditolak' : row.statusValidasi === 'flagged' ? 'Indikasi Spoof' : 'Menunggu'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`preview-${row.id}`}
                      onClick={() => setPreviewId(row.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      aria-label="Lihat foto"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      id={`approve-${row.id}`}
                      onClick={() => updateStatus(row.id, 'valid')}
                      disabled={row.statusValidasi === 'valid'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50
                                 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Setujui absensi"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      id={`reject-${row.id}`}
                      onClick={() => updateStatus(row.id, 'invalid')}
                      disabled={row.statusValidasi === 'invalid'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50
                                 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Tolak absensi"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Menampilkan <span className="font-semibold text-slate-700">{filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span> hingga <span className="font-semibold text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> dari <span className="font-semibold text-slate-700">{filtered.length}</span> data
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Sebelumnya
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm border border-emerald-100">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewRow && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => { setPreviewId(null); setIsFullscreen(false); }}
        >
          {isFullscreen ? (
            <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                aria-label="Tutup Layar Penuh"
              >
                <XCircle className="w-8 h-8" />
              </button>
              <img src={previewRow.fotoUrl} alt="Bukti Full" className="max-w-full max-h-full object-contain" />
            </div>
          ) : null}
          <div
            className={`bg-white rounded-2xl p-6 w-full shadow-2xl animate-scale-in ${isFullscreen ? 'hidden' : 'max-w-2xl'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-800 font-bold">Detail Absensi</h3>
              <button
                id="close-preview-btn"
                onClick={() => { setPreviewId(null); setIsFullscreen(false); }}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Tutup"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden relative">
              {previewRow.fotoUrl ? (
                <div className="relative group cursor-pointer w-full" onClick={() => setIsFullscreen(true)}>
                  <img src={previewRow.fotoUrl} alt="Bukti" className="w-full max-h-[70vh] object-contain" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-semibold bg-black/50 px-4 py-2 rounded-lg">Klik untuk perbesar</span>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center w-full">
                  <p className="text-slate-400 text-sm">Foto bukti ({previewRow.idRelawan})</p>
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama</span>
                <span className="font-semibold text-slate-700">{previewRow.namaLengkap}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu</span>
                <span className="font-mono text-slate-700">{previewRow.waktuAbsen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GPS</span>
                <span className="font-mono text-slate-700">{Number(previewRow.latitude).toFixed(4)}, {Number(previewRow.longitude).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Divisi</span>
                <span className="font-semibold text-slate-700">{previewRow.divisi || 'Relawan'}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                id="modal-reject-btn"
                onClick={() => updateStatus(previewRow.id, 'invalid')}
                className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm
                           border border-red-200 hover:bg-red-100 transition-colors"
              >
                Tolak
              </button>
              <button
                id="modal-approve-btn"
                onClick={() => updateStatus(previewRow.id, 'valid')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm
                           hover:bg-emerald-600 transition-colors"
              >
                Validasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
