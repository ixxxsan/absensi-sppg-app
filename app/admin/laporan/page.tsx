'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Calendar, Info, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { nowWIB } from '@/lib/utils';
import { getAllAbsensi } from '@/app/actions/absensi';

interface LaporanItem {
  idRelawan: string;
  namaLengkap: string;
  divisi: string;
  tanggal: string;
  jamMasuk: string;
  jamPulang: string;
  statusMasuk: string;
  statusPulang: string;
  koordinatMasuk: string;
  koordinatPulang: string;
}

const DIVISI_OPTIONS = [
  'ASISTEN LAPANGAN', 'ADMIN', 'STOCKIST', 'SECURITY', 'DRIVER', 
  'CLEANING SERVICE', 'PERSIAPAN', 'PENGOLAHAN', 'PEMORSIAN', 'PENCUCI TRAY'
];

const getDivisiRank = (divisi: string | null | undefined) => {
  if (!divisi) return 999;
  const index = DIVISI_OPTIONS.indexOf(divisi.toUpperCase());
  return index === -1 ? 999 : index;
};

export default function LaporanPage() {
  const [dateFrom, setDateFrom] = useState(nowWIB().startOf('month').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(nowWIB().format('YYYY-MM-DD'));
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);
  
  const [data, setData] = useState<LaporanItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      const records = await getAllAbsensi();
      
      // Transform records into a flatter format suitable for export, grouping by user/date
      // In this DB schema, we have separate rows for 'masuk' and 'pulang' per user/date.
      // We need to merge them for the report table.
      
      const grouped: Record<string, LaporanItem> = {};
      
      records.forEach((r) => {
        const key = `${r.userId}-${r.tanggalAbsen}`;
        if (!grouped[key]) {
          grouped[key] = {
            idRelawan: r.idRelawan || 'SPPG-000',
            namaLengkap: r.namaLengkap || 'Unknown',
            divisi: r.divisi || '-',
            tanggal: r.tanggalAbsen,
            jamMasuk: '',
            jamPulang: '',
            statusMasuk: '-',
            statusPulang: '-',
            koordinatMasuk: '',
            koordinatPulang: ''
          };
        }
        
        if (r.tipe === 'masuk') {
          grouped[key].jamMasuk = r.waktuAbsen;
          grouped[key].statusMasuk = r.statusValidasi;
          grouped[key].koordinatMasuk = `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}`;
        } else if (r.tipe === 'pulang') {
          grouped[key].jamPulang = r.waktuAbsen;
          grouped[key].statusPulang = r.statusValidasi;
          grouped[key].koordinatPulang = `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}`;
        }
      });
      
      const groupedData = Object.values(grouped);
      groupedData.sort((a, b) => getDivisiRank(a.divisi) - getDivisiRank(b.divisi));
      setData(groupedData);
    }
    fetchData();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 800)); // Simulate UI loading feel

    const filteredForExport = data.filter((r) => r.tanggal >= dateFrom && r.tanggal <= dateTo);
    
    // Calculate Total Hari Kerja per Volunteer
    const aggregateMap = new Map();
    filteredForExport.forEach(r => {
      if (!aggregateMap.has(r.idRelawan)) {
        aggregateMap.set(r.idRelawan, { 'ID Relawan': r.idRelawan, 'Nama Lengkap': r.namaLengkap, 'Divisi': r.divisi, 'Total Hari Kerja (Hari)': 0 });
      }
      if (r.statusMasuk === 'valid') {
        aggregateMap.get(r.idRelawan)['Total Hari Kerja (Hari)'] += 1;
      }
    });

    const aggregateList = Array.from(aggregateMap.values());
    // Sort by Divisi Rank
    aggregateList.sort((a, b) => getDivisiRank(a['Divisi']) - getDivisiRank(b['Divisi']));

    const wb = XLSX.utils.book_new();

    // Define headers explicitly so the sheet is never completely empty
    const exportHeaders = ['ID Relawan', 'Nama Lengkap', 'Divisi', 'Total Hari Kerja (Hari)'];
    
    // Title rows
    const titleData = [
      ['REKAPAN ABSENSI'],
      ['SPPG TELUKNAGA 03'],
      [`PERIODE: ${dateFrom} s/d ${dateTo}`],
      [] // Empty row before table
    ];

    // Create worksheet with title data
    const wsAggregate = XLSX.utils.aoa_to_sheet(titleData);

    // Add table data starting at row 5 (index 4)
    XLSX.utils.sheet_add_json(wsAggregate, aggregateList, { origin: 'A5', header: exportHeaders });
    
    wsAggregate['!cols'] = [ { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 25 } ];
    
    // Merge cells for titles
    wsAggregate['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }
    ];

    // Style titles
    const titleStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } };
    const subtitleStyle = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } };
    const periodStyle = { font: { italic: true }, alignment: { horizontal: 'center' } };

    if (wsAggregate['A1']) wsAggregate['A1'].s = titleStyle;
    if (wsAggregate['A2']) wsAggregate['A2'].s = subtitleStyle;
    if (wsAggregate['A3']) wsAggregate['A3'].s = periodStyle;

    // Style table (headers and data borders)
    const headerStyle = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "E2EFDA" } },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      },
      alignment: { horizontal: 'center' }
    };

    const dataStyle = {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const range = XLSX.utils.decode_range(wsAggregate['!ref'] || 'A1:A5');
    // Row 4 (index 4) is the header row
    for (let R = 4; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= 3; ++C) { // Up to column 3 (D)
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!wsAggregate[cellRef]) wsAggregate[cellRef] = { t: 's', v: '' }; // Ensure cell exists for border
        if (R === 4) {
          wsAggregate[cellRef].s = headerStyle;
        } else {
          wsAggregate[cellRef].s = dataStyle;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, wsAggregate, 'Total Hari Kerja');

    // Summary sheet
    const summary = [
      { 'Keterangan': 'Periode', 'Nilai': `${dateFrom} s/d ${dateTo}` },
      { 'Keterangan': 'Total Baris Riwayat', 'Nilai': filteredForExport.length },
      { 'Keterangan': 'Total Relawan Aktif', 'Nilai': aggregateList.length },
      { 'Keterangan': 'Diekspor pada', 'Nilai': nowWIB().format('DD/MM/YYYY HH:mm') + ' WIB' },
      { 'Keterangan': 'Diekspor oleh', 'Nilai': 'Admin SPPG' },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    wsSummary['!cols'] = [ { wch: 25 }, { wch: 35 } ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    const filename = `Rekap_Absensi_SPPG_03_${dateFrom}_${dateTo}.xlsx`;
    XLSX.writeFile(wb, filename);

    setLastExport(nowWIB().format('HH:mm DD/MM/YYYY'));
    setIsExporting(false);
  };

  // Preview table
  const filtered = data.filter(
    (r) => r.tanggal >= dateFrom && r.tanggal <= dateTo
  );

  const summaryMap: Record<string, { idRelawan: string; namaLengkap: string; divisi: string; totalHariKerja: number }> = {};
  filtered.forEach(r => {
    if (!summaryMap[r.idRelawan]) {
      summaryMap[r.idRelawan] = {
        idRelawan: r.idRelawan,
        namaLengkap: r.namaLengkap,
        divisi: r.divisi,
        totalHariKerja: 0
      };
    }
    if (r.statusMasuk === 'valid') {
      summaryMap[r.idRelawan].totalHariKerja += 1;
    }
  });

  const summaryData = Object.values(summaryMap);
  summaryData.sort((a, b) => getDivisiRank(a.divisi) - getDivisiRank(b.divisi));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-800 text-2xl font-bold">Laporan & Export</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Export rekapitulasi hari kerja relawan ke format Excel
        </p>
      </div>

      {/* Export Panel */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-slate-700 font-semibold text-sm">Export Excel (Penggajian)</h2>
            <p className="text-slate-400 text-xs">Rekap total hari kerja per relawan</p>
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="space-y-1.5">
            <label htmlFor="date-from" className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
              Dari Tanggal
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="date-to" className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
              Sampai Tanggal
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-100 mb-5">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 space-y-0.5">
            <p className="font-semibold">Format Export Penggajian:</p>
            <p>1 Baris = 1 Relawan. Sudah diurutkan berdasarkan prioritas divisi.</p>
            <p>Kolom: ID Relawan · Nama Lengkap · Divisi · Total Hari Kerja (Hari)</p>
          </div>
        </div>

        {/* Export button */}
        <button
          id="btn-export-excel"
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
                     font-semibold text-sm flex items-center justify-center gap-2
                     hover:from-emerald-400 hover:to-emerald-500 transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-emerald-500/30"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Menyiapkan file...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Excel ({summaryData.length} Relawan)
            </>
          )}
        </button>

        {lastExport && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Terakhir diekspor: {lastExport} WIB
          </p>
        )}
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-700 font-semibold text-sm">Preview Ringkasan Hari Kerja</h2>
          <span className="text-slate-400 text-xs">{summaryData.length} relawan aktif</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                {['ID Relawan', 'Nama Lengkap', 'Divisi', 'Total Hari Kerja'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summaryData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data absensi pada periode ini.
                  </td>
                </tr>
              ) : (
                summaryData.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-emerald-600 font-semibold">{r.idRelawan}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{r.namaLengkap}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">{r.divisi}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-md text-emerald-700 bg-emerald-50 font-bold border border-emerald-100">
                        {r.totalHariKerja} Hari
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
