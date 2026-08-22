'use client';

import { useState, useTransition, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, ChevronDown, CheckCircle, Clock, AlertCircle, Loader2, Users, Upload, KeyRound, Download } from 'lucide-react';
import { createRelawan, updateRelawan, deleteRelawan, bulkImportRelawan, resetPasswordRelawan, bulkResetPasswords, BulkImportRow } from '@/app/actions/relawan';
import { useRouter } from 'next/navigation';
import { goeyToast } from 'goey-toast';

export type Divisi = 'ASISTEN LAPANGAN' | 'ADMIN' | 'STOCKIST' | 'SECURITY' | 'DRIVER' | 'CLEANING SERVICE' | 'PERSIAPAN' | 'HEAD CHEF' | 'PENGOLAHAN' | 'PEMORSIAN' | 'PENCUCI TRAY';
export type StatusRelawan = 'Aktif' | 'Magang' | 'Cuti';

export interface ImportFailedDetail {
  email: string;
  error?: string;
}

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
  'CLEANING SERVICE', 'PERSIAPAN', 'HEAD CHEF', 'PENGOLAHAN', 'PEMORSIAN', 'PENCUCI TRAY'
];

export default function ClientRelawan({ initialData }: { initialData: RelawanItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDivisi, setFilterDivisi] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<RelawanItem | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importReport, setImportReport] = useState<{ success: number, failed: number, details: ImportFailedDetail[] } | null>(null);
  const [createdPasswordInfo, setCreatedPasswordInfo] = useState<{name: string, email: string, password: string, emailSuccess: boolean, emailError?: string} | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterDivisi = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterDivisi(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelected = new Set(selectedIds);
      paginatedData.forEach(r => newSelected.add(r.id));
      setSelectedIds(Array.from(newSelected));
    } else {
      const currentPaginatedIds = paginatedData.map(r => r.id);
      setSelectedIds(selectedIds.filter(id => !currentPaginatedIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filtered = initialData.filter((r) => {
    const matchesSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
                          r.idRelawan?.toLowerCase().includes(search.toLowerCase()) ||
                          r.email?.toLowerCase().includes(search.toLowerCase()) ||
                          (r.nik && r.nik.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus ? r.status === filterStatus : true;
    const matchesDivisi = filterDivisi ? r.divisi === filterDivisi : true;
    return matchesSearch && matchesStatus && matchesDivisi;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleEdit = (r: RelawanItem) => {
    setEditTarget(r);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus relawan ini dari sistem?')) {
      setLoadingAction(true);
      try {
        const res = await deleteRelawan(id);
        if (res?.error) {
          goeyToast.error(res.error || 'Gagal menghapus relawan');
          return;
        }
        goeyToast.success('Relawan berhasil dihapus');
        startTransition(() => {
          router.refresh();
        });
      } catch {
        goeyToast.error('Terjadi kesalahan saat menghapus');
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleResetPassword = async (r: RelawanItem) => {
    if (confirm(`Reset password untuk ${r.name}? Password baru akan digenerate dan dikirim via email.`)) {
      setLoadingAction(true);
      try {
        const res = await resetPasswordRelawan(r.id);
        if (res?.success) {
          setCreatedPasswordInfo({
            name: r.name,
            email: r.email,
            password: res.password as string,
            emailSuccess: res.emailSuccess || false,
            emailError: res.emailError as string | undefined
          });
        } else {
          goeyToast.error(res?.error || 'Gagal reset password');
        }
      } catch {
        goeyToast.error('Terjadi kesalahan saat reset password');
      } finally {
        setLoadingAction(false);
      }
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
    
    try {
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
        if (!editTarget && res.password) {
          setCreatedPasswordInfo({
            name: fd.get('namaLengkap') as string,
            email: fd.get('email') as string,
            password: res.password,
            emailSuccess: res.emailSuccess || false,
            emailError: res.emailError
          });
        } else {
          goeyToast.success('Data berhasil disimpan');
        }
      } else {
        goeyToast.error(res?.error || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error(error);
      goeyToast.error('Gagal menyimpan data relawan');
    }
    setLoadingAction(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportReport(null);

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: Record<string, string | number>[] = XLSX.utils.sheet_to_json(firstSheet);

      if (!rawRows || rawRows.length === 0) {
        goeyToast.error('File Excel kosong atau format tidak sesuai.');
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Map rows
      const mappedRows: BulkImportRow[] = rawRows.map(row => ({
        namaLengkap: String(row['Nama Lengkap'] || row['Nama'] || ''),
        nik: String(row['NIK'] || ''),
        email: String(row['Email'] || ''),
        noTelepon: String(row['No. Telepon'] || row['No Telepon'] || row['No HP'] || ''),
        divisi: String(row['Divisi'] || 'ASISTEN LAPANGAN'),
        status: String(row['Status'] || 'Aktif')
      })).filter(r => r.namaLengkap && r.nik && r.email); // Basic validation

      if (mappedRows.length === 0) {
        goeyToast.error('Tidak ada baris yang valid. Pastikan ada kolom Nama Lengkap, NIK, dan Email.');
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Batch processing (e.g. 50 items per batch)
      const batchSize = 50;
      let totalSuccess = 0;
      let totalFailed = 0;
      const failedDetails: ImportFailedDetail[] = [];

      for (let i = 0; i < mappedRows.length; i += batchSize) {
        const batch = mappedRows.slice(i, i + batchSize);
        const res = await bulkImportRelawan(batch);
        
        if (res.success && res.results) {
          res.results.forEach((r: { success: boolean, email: string, error?: string, password?: string, emailSuccess?: boolean, emailError?: string }) => {
            if (r.success) {
              totalSuccess++;
              if (!r.emailSuccess) {
                failedDetails.push({ email: r.email, error: `Email gagal. Password: ${r.password}. Err: ${r.emailError || 'Unknown'}` });
              }
            } else {
              totalFailed++;
              failedDetails.push({ email: r.email, error: r.error });
            }
          });
        } else {
          totalFailed += batch.length;
          failedDetails.push({ email: 'Batch Failed', error: res.error as string | undefined });
        }

        const currentProgress = Math.min(100, Math.round(((i + batchSize) / mappedRows.length) * 100));
        setImportProgress(currentProgress);
      }

      setImportReport({
        success: totalSuccess,
        failed: totalFailed,
        details: failedDetails
      });

      goeyToast.success(`Import selesai: ${totalSuccess} berhasil, ${totalFailed} gagal.`);

      startTransition(() => {
        router.refresh();
      });

    } catch (error) {
      console.error('Excel Import Error:', error);
      goeyToast.error('Terjadi kesalahan saat memproses file Excel.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBulkReset = async () => {
    if (selectedIds.length === 0) {
      goeyToast.error('Pilih setidaknya satu relawan (centang checkbox)');
      return;
    }

    if (!confirm(`PERHATIAN: Tindakan ini akan MERESET (mengubah) password untuk ${selectedIds.length} relawan yang dipilih, dan mendownloadnya dalam bentuk file Excel. Apakah Anda yakin ingin melanjutkan?`)) return;
    
    setLoadingAction(true);
    try {
      const res = await bulkResetPasswords(selectedIds);
      if (res.success && res.data) {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(res.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Kredensial Relawan');
        XLSX.writeFile(workbook, `Kredensial_Relawan_${new Date().toISOString().slice(0,10)}.xlsx`);
        goeyToast.success(`Password ${selectedIds.length} relawan berhasil di-reset dan didownload!`);
        setSelectedIds([]);
      } else {
        goeyToast.error(res?.error || 'Gagal mereset password massal');
      }
    } catch {
      goeyToast.error('Terjadi kesalahan sistem saat mereset password');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-2xl font-bold">Manajemen Relawan</h1>
          <p className="text-slate-500 text-sm mt-0.5">{initialData.length} relawan terdaftar</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600
                       font-semibold text-sm hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            disabled={loadingAction || isPending || isImporting}
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <button
            onClick={handleBulkReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700
                       font-semibold text-sm hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-50"
            disabled={loadingAction || isPending || isImporting || selectedIds.length === 0}
            title="Reset password relawan yang dicentang & download Excel"
          >
            <Download className="w-4 h-4" />
            Export Password {selectedIds.length > 0 && `(${selectedIds.length})`}
          </button>
          <button
            id="btn-tambah-relawan"
            onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white
                       font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-sm
                       shadow-emerald-500/30 disabled:opacity-50"
            disabled={loadingAction || isPending || isImporting}
          >
            {loadingAction || isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Tambah Relawan
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-relawan"
            type="text"
            placeholder="Cari nama, ID, atau email..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white
                       text-slate-700 text-sm placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              id="filter-divisi"
              value={filterDivisi}
              onChange={handleFilterDivisi}
              className="appearance-none pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white
                         text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500
                         cursor-pointer w-[160px]"
            >
              <option value="">Semua Divisi</option>
              {DIVISI_OPTIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              id="filter-status"
              value={filterStatus}
              onChange={handleFilterStatus}
              className="appearance-none pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white
                         text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500
                         cursor-pointer w-[140px]"
            >
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Magang">Magang</option>
              <option value="Cuti">Cuti</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">
                  <input 
                    type="checkbox" 
                    checked={paginatedData.length > 0 && paginatedData.every(r => selectedIds.includes(r.id))}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                {['ID Relawan', 'NIK', 'Nama Lengkap', 'Email', 'No. HP', 'Divisi', 'Status', 'Aksi'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(r.id)}
                      onChange={() => handleSelectOne(r.id)}
                      className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-emerald-600">
                    {r.idRelawan}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                    {r.nik || '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600
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
                        onClick={() => handleResetPassword(r)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50
                                   transition-colors"
                        aria-label="Reset Password"
                        disabled={loadingAction}
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
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
            {initialData.length === 0 ? (
              <>
                <Users className="w-10 h-10 mb-3 text-slate-300" />
                <p className="text-sm">Belum ada data relawan</p>
              </>
            ) : (
              <>
                <Search className="w-10 h-10 mb-3 text-slate-300" />
                <p className="text-sm">Tidak ditemukan relawan dengan kata kunci tersebut</p>
              </>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-semibold text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> hingga <span className="font-semibold text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> dari <span className="font-semibold text-slate-700">{filtered.length}</span> data
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold
                           hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold
                           hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                Selanjutnya
              </button>
            </div>
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

      {/* Modal — Progress Import */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Mengimpor Data...</h3>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
              <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
            </div>
            <p className="text-sm text-slate-500">{importProgress}% Selesai</p>
          </div>
        </div>
      )}

      {/* Modal — Laporan Import */}
      {importReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <h2 className="text-slate-800 text-lg font-bold mb-5">Laporan Import Excel</h2>
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1 bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                <p className="text-emerald-600 text-2xl font-bold">{importReport.success}</p>
                <p className="text-emerald-800 text-xs font-semibold uppercase">Berhasil</p>
              </div>
              <div className="flex-1 bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                <p className="text-red-600 text-2xl font-bold">{importReport.failed}</p>
                <p className="text-red-800 text-xs font-semibold uppercase">Gagal</p>
              </div>
            </div>

            {importReport.failed > 0 && importReport.details.length > 0 && (
              <div className="mb-6 max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50">
                <p className="text-xs font-semibold text-slate-600 mb-2">Detail Kegagalan:</p>
                <ul className="space-y-2 text-xs text-slate-500">
                  {importReport.details.map((d, i) => (
                    <li key={i} className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-700">{d.email}</span>
                      <span className="text-red-500">{d.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setImportReport(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-colors"
            >
              Tutup Laporan
            </button>
          </div>
        </div>
      )}

      {/* Modal — Informasi Password */}
      {createdPasswordInfo && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${createdPasswordInfo.emailSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-slate-800 text-lg font-bold mb-2">Password Berhasil Digenerate</h2>
            
            {createdPasswordInfo.emailSuccess ? (
              <p className="text-sm text-slate-600 mb-4">Email berisi password telah berhasil dikirim ke <strong>{createdPasswordInfo.email}</strong>.</p>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800 font-semibold mb-1">⚠️ Gagal mengirim email</p>
                <p className="text-xs text-amber-700">Email ke <strong>{createdPasswordInfo.email}</strong> gagal terkirim ({createdPasswordInfo.emailError}). Harap berikan password berikut secara manual kepada relawan.</p>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Password untuk {createdPasswordInfo.name}</p>
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono font-bold text-slate-800">{createdPasswordInfo.password}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdPasswordInfo.password);
                    goeyToast.success('Password disalin ke clipboard');
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Salin
                </button>
              </div>
            </div>

            <button
              onClick={() => setCreatedPasswordInfo(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
