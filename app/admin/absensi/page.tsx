'use client';

import { useState } from 'react';
import { Search, Eye, CheckCircle, XCircle } from 'lucide-react';

const MOCK_DATA = [
  { id: 1, idRelawan: 'SPPG-001', nama: 'Budi Santoso', tanggal: '2025-08-14', waktu: '08:15 WIB', tipe: 'masuk' as const, status: 'valid' as const, lat: -6.208, lon: 106.845, foto: '' },
  { id: 2, idRelawan: 'SPPG-002', nama: 'Siti Rahayu', tanggal: '2025-08-14', waktu: '08:22 WIB', tipe: 'masuk' as const, status: 'valid' as const, lat: -6.209, lon: 106.846, foto: '' },
  { id: 3, idRelawan: 'SPPG-004', nama: 'Dewi Lestari', tanggal: '2025-08-14', waktu: '08:45 WIB', tipe: 'masuk' as const, status: 'invalid' as const, lat: -6.300, lon: 106.900, foto: '' },
];

type ValidationStatus = 'valid' | 'invalid';

const statusBadge: Record<ValidationStatus, string> = {
  valid: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  invalid: 'text-red-700 bg-red-50 border border-red-200',
};

export default function AbsensiValidasiPage() {
  const [data, setData] = useState(MOCK_DATA);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | ValidationStatus>('');
  const [previewId, setPreviewId] = useState<number | null>(null);

  const filtered = data.filter((row) => {
    const matchSearch = row.nama.toLowerCase().includes(search.toLowerCase()) ||
                        row.idRelawan.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? row.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const updateStatus = (id: number, status: ValidationStatus) => {
    setData((d) => d.map((r) => r.id === id ? { ...r, status } : r));
    setPreviewId(null);
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
          {(['', 'valid', 'invalid'] as const).map((s) => (
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
              {s === '' ? 'Semua' : s === 'valid' ? 'Valid' : 'Ditolak'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Valid', count: data.filter(r => r.status === 'valid').length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Ditolak', count: data.filter(r => r.status === 'invalid').length, color: 'text-red-600 bg-red-50' },
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
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3.5 font-mono text-xs font-semibold text-emerald-600">{row.idRelawan}</td>
                <td className="px-4 py-3.5 text-slate-700 font-medium">{row.nama}</td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">{row.tanggal}</td>
                <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{row.waktu}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${row.tipe === 'masuk' ? 'text-blue-700 bg-blue-50' : 'text-amber-700 bg-amber-50'}`}>
                    {row.tipe === 'masuk' ? 'Masuk' : 'Pulang'}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                  {row.lat.toFixed(3)}, {row.lon.toFixed(3)}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge[row.status]}`}>
                    {row.status === 'valid' ? 'Valid' : 'Ditolak'}
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
                      disabled={row.status === 'valid'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50
                                 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Setujui absensi"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      id={`reject-${row.id}`}
                      onClick={() => updateStatus(row.id, 'invalid')}
                      disabled={row.status === 'invalid'}
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

      {/* Photo Preview Modal */}
      {previewRow && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-800 font-bold">Detail Absensi</h3>
              <button
                id="close-preview-btn"
                onClick={() => setPreviewId(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Tutup"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-100 rounded-xl h-48 flex items-center justify-center mb-4">
              <p className="text-slate-400 text-sm">Foto bukti ({previewRow.idRelawan})</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama</span>
                <span className="font-semibold text-slate-700">{previewRow.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu</span>
                <span className="font-mono text-slate-700">{previewRow.waktu}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GPS</span>
                <span className="font-mono text-slate-700">{previewRow.lat.toFixed(4)}, {previewRow.lon.toFixed(4)}</span>
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
