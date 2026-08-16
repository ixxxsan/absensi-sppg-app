'use client';

import { useState, useTransition } from 'react';
import { Search, Plus, Edit2, Trash2, ChevronDown, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { createRelawan, updateRelawan, deleteRelawan } from '@/app/actions/relawan';
import { useRouter } from 'next/navigation';

export type Divisi = 'ASISTEN LAPANGAN' | 'ADMIN' | 'STOCKIST' | 'SECURITY' | 'DRIVER' | 'CLEANING SERVICE' | 'PERSIAPAN' | 'PENGOLAHAN' | 'PEMORSIAN' | 'PENCUCI TRAY';
export type StatusRelawan = 'Aktif' | 'Magang' | 'Cuti';

export interface RelawanItem {
  id: string;
  name: string;
  email: string;
  idRelawan?: string | null;
  nik?: string | null;
  noTelepon?: string | null;
  divisi?: string | null;
  status?: string | null;
}

const DIVISI_OPTIONS: Divisi[] = [
  'ASISTEN LAPANGAN', 'ADMIN', 'STOCKIST', 'SECURITY', 'DRIVER', 
  'CLEANING SERVICE', 'PERSIAPAN', 'PENGOLAHAN', 'PEMORSIAN', 'PENCUCI TRAY'
];

export default function ClientRelawan({ initialData }: { initialData: RelawanItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<RelawanItem | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const filtered = initialData.filter((r) => {
    const matchesSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
                          r.idRelawan?.toLowerCase().includes(search.toLowerCase()) ||
                          r.email?.toLowerCase().includes(search.toLowerCase()) ||
                          (r.nik && r.nik.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus ? r.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (r: RelawanItem) => {
    setEditTarget(r);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus relawan ini dari sistem?')) {
      setLoadingAction(true);
      const res = await deleteRelawan(id);
      if (res.success) {
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(res.error || 'Gagal menghapus');
      }
      setLoadingAction(false);
    }
  };

  const generateNewIdRelawan = () => {
    // Cari angka terkecil yang belum dipakai
    const usedNumbers = initialData
      .map(r => parseInt(r.idRelawan?.replace('SPPG-', '') || '0', 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    
    let nextNum = 1;
    for (const num of usedNumbers) {
      if (num === nextNum) {
        nextNum++;
      } else if (num > nextNum) {
        break;
      }
    }
    return `SPPG-${nextNum.toString().padStart(3, '0')}`;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingAction(true);
    const fd = new FormData(e.currentTarget);
    
    let res;
    if (editTarget) {
      res = await updateRelawan(editTarget.id, fd);
    } else {
      res = await createRelawan(fd);
    }

    if (res?.success) {
      setShowModal(false);
      startTransition(() => {
        router.refresh();
      });
    } else {
      alert(res?.error || 'Gagal menyimpan data');
    }
    setLoadingAction(false);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-2xl font-bold">Manajemen Relawan</h1>
          <p className="text-slate-500 text-sm mt-0.5">{initialData.length} relawan terdaftar</p>
        </div>
        <button
          id="btn-tambah-relawan"
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white
                     font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-sm
                     shadow-emerald-500/30 disabled:opacity-50"
          disabled={loadingAction || isPending}
        >
          {loadingAction || isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Tambah Relawan
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-relawan"
            type="text"
            placeholder="Cari nama, ID, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white
                       text-slate-700 text-sm placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white
                       text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500
                       cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Magang">Magang</option>
            <option value="Cuti">Cuti</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['ID Relawan', 'NIK', 'Nama Lengkap', 'Email', 'No. HP', 'Divisi', 'Status', 'Aksi'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-emerald-600">
                    {r.idRelawan}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                    {r.nik || '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600
                                      flex items-center justify-center text-white text-xs font-bold">
                        {r.name?.charAt(0)}
                      </div>
                      <span className="text-slate-700 font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-sm">{r.email}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-sm font-mono">{r.noTelepon || '-'}</td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs font-semibold">
                    {r.divisi || '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${r.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        r.status === 'Magang' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                        'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}
                    >
                      {r.status === 'Aktif' && <CheckCircle className="w-3 h-3" />}
                      {r.status === 'Magang' && <Clock className="w-3 h-3" />}
                      {r.status === 'Cuti' && <AlertCircle className="w-3 h-3" />}
                      {r.status || 'Aktif'}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        id={`edit-relawan-${r.id}`}
                        onClick={() => handleEdit(r)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50
                                   transition-colors"
                        aria-label="Edit relawan"
                        disabled={loadingAction}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={`delete-relawan-${r.id}`}
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50
                                   transition-colors"
                        aria-label="Hapus relawan"
                        disabled={loadingAction}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center">
            <Search className="w-10 h-10 mb-3 text-slate-300" />
            <p className="text-sm">Tidak ditemukan relawan dengan kata kunci tersebut</p>
          </div>
        )}
      </div>

      {/* Modal — Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <h2 className="text-slate-800 text-lg font-bold mb-5">
              {editTarget ? 'Edit Relawan' : 'Tambah Relawan Baru'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wide">ID Relawan</label>
                <input
                  name="idRelawan"
                  type="text"
                  readOnly
                  defaultValue={editTarget?.idRelawan || generateNewIdRelawan()}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Nama Lengkap</label>
                <input
                  name="namaLengkap"
                  type="text"
                  required
                  placeholder="Nama lengkap"
                  defaultValue={editTarget?.name}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wide">NIK (Nomor Induk Kependudukan)</label>
                <input
                  name="nik"
                  type="text"
                  required
                  placeholder="16 digit NIK"
                  defaultValue={editTarget?.nik || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="email@sppg.id"
                    defaultValue={editTarget?.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-600 text-xs font-semibold uppercase tracking-wide">No. Telepon</label>
                  <input
                    name="noTelepon"
                    type="text"
                    required
                    placeholder="0812..."
                    defaultValue={editTarget?.noTelepon || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 relative">
                  <label className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Divisi</label>
                  <select
                    name="divisi"
                    required
                    defaultValue={editTarget?.divisi || 'ASISTEN LAPANGAN'}
                    className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {DIVISI_OPTIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-[34px] w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Status</label>
                  <select
                    name="status"
                    required
                    defaultValue={editTarget?.status || 'Aktif'}
                    className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Magang">Magang</option>
                    <option value="Cuti">Cuti</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-[34px] w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={loadingAction}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm
                             font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm
                             font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {loadingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editTarget ? 'Simpan Perubahan' : 'Tambah Relawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
