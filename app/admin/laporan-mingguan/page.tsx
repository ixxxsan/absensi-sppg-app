'use client';

import { useState, useMemo, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Printer, Download, Calendar, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Utensils,
  FileSpreadsheet, ArrowLeft, RotateCcw
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { getWeeklyReportMenuData } from '@/app/actions/laporan-mingguan';
import {
  DAFTAR_SASARAN_DEFAULT,
  DayReportData,
  PERSIAPAN_DESCRIPTIONS,
  PENGOLAHAN_DESCRIPTIONS,
  PEMORSIAN_DESCRIPTIONS,
  PENCUCIAN_STEPS,
  DISTRIBUSI_PHOTOS,
  SURAT_JALAN_PHOTOS,
} from '@/lib/constants/laporan-mingguan';

dayjs.locale('id');

const DEFAULT_MENU_DOCX = [
  'Nasi Putih, Chicken Teriyaki, Tahu Cabai Garam, Capcay, Semangka',
  'Nasi Putih, Sate Taichan, Tahu Crispy, Tumis Wortel & Jagung, Kelengkeng',
  'Nasi Putih, Ayam Lada Hitam, Steam Tofu, Sup Kimlo, Semangka',
  'Nasi Putih, Steam Fuyunghai, Tempe Crispy, Nutrijell Strawberry, Anggur Hitam',
  'Kentang Goreng, Dimsum, Kacang Polong, Mix Vegetables, Anggur Merah, Susu Full Cream',
];

export default function LaporanMingguanPage() {
  // Compute default Monday - Friday
  const getDefaultDates = () => {
    const today = dayjs();
    const day = today.day();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = today.add(diff, 'day');
    return [
      monday.format('YYYY-MM-DD'),
      monday.add(1, 'day').format('YYYY-MM-DD'),
      monday.add(2, 'day').format('YYYY-MM-DD'),
      monday.add(3, 'day').format('YYYY-MM-DD'),
      monday.add(4, 'day').format('YYYY-MM-DD'),
    ];
  };

  // State: 5 operational dates (Hari Ke-1 s/d Hari Ke-5)
  const [dates, setDates] = useState<string[]>(getDefaultDates());
  const [exportingDocx, setExportingDocx] = useState<boolean>(false);

  // SWR: auto-fetch menu data whenever the 5 dates change
  const datesKey = dates.join(',');
  const { data: rawReportDays = [], isLoading, error } = useSWR<DayReportData[]>(
    ['weekly-menu-data', datesKey],
    () => getWeeklyReportMenuData(dates),
    { revalidateOnFocus: false }
  );

  // Map 5 operational report days
  const reportDays: DayReportData[] = useMemo(() => {
    return dates.map((d, idx) => {
      const fetched = rawReportDays.find(r => r.dateStr === d);
      if (fetched) return fetched;
      const dayObj = dayjs(d).locale('id');
      return {
        pemberianKe: idx + 1,
        dateStr: d,
        hariTanggalLengkap: dayObj.format('dddd, DD MMMM YYYY'),
        hariTanggalSingkat: dayObj.format('dddd, DD/MM/YYYY'),
        namaMenu: '',
        fotoPorsiBesarUrl: '',
        fotoPorsiKecilUrl: '',
        fotoBumilUrl: '',
        isFilled: false,
      };
    });
  }, [dates, rawReportDays]);

  // Update a single operational day (supports skipping holidays)
  const handleDayChange = (index: number, newDate: string) => {
    if (!newDate) return;
    setDates(prev => {
      const next = [...prev];
      next[index] = newDate;
      return next;
    });
  };

  // Shift all 5 dates by +/- 7 days
  const handleShiftWeek = (offsetDays: number) => {
    setDates(prev => prev.map(d => dayjs(d).add(offsetDays, 'day').format('YYYY-MM-DD')));
  };

  // Reset to current week
  const handleResetCurrentWeek = () => {
    setDates(getDefaultDates());
  };

  // Quick preset: set all 5 days consecutively from a chosen starting date
  const handleSetWeekFromStart = (startDateStr: string) => {
    if (!startDateStr) return;
    const start = dayjs(startDateStr);
    setDates([
      start.format('YYYY-MM-DD'),
      start.add(1, 'day').format('YYYY-MM-DD'),
      start.add(2, 'day').format('YYYY-MM-DD'),
      start.add(3, 'day').format('YYYY-MM-DD'),
      start.add(4, 'day').format('YYYY-MM-DD'),
    ]);
  };

  // Export DOCX directly using master template
  const handleExportDocx = async () => {
    setExportingDocx(true);
    try {
      const res = await fetch('/api/laporan-mingguan/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Gagal mengekspor dokumen Word.');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Laporan_Mingguan_MBG_${dates[0]}_sd_${dates[4]}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      alert((err as Error).message || 'Gagal mengekspor Word.');
    } finally {
      setExportingDocx(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const startFormatted = dates[0] ? dayjs(dates[0]).locale('id').format('DD MMMM') : '';
  const endFormatted = dates[4] ? dayjs(dates[4]).locale('id').format('DD MMMM YYYY') : '';
  const fullDateRangeStr = `${startFormatted} – ${endFormatted}`;
  const closingDateStr = dates[4] ? dayjs(dates[4]).locale('id').format('DD MMMM YYYY') : '';

  // Chunk surat jalan photos into rows of 5
  const suratJalanRows = useMemo(() => {
    const rows: string[][] = [];
    for (let i = 0; i < SURAT_JALAN_PHOTOS.length; i += 5) {
      rows.push(SURAT_JALAN_PHOTOS.slice(i, i + 5));
    }
    return rows;
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 print:p-0 print:bg-white print:text-black">
      {/* ======================================================== */}
      {/* NON-PRINTABLE TOP CONTROLS & DATE CONFIGURATION          */}
      {/* ======================================================== */}
      <div className="max-w-6xl mx-auto mb-8 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/laporan"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
              title="Kembali ke Laporan"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                Laporan Mingguan SPPG
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition cursor-pointer shadow-sm hover:shadow"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              onClick={handleExportDocx}
              disabled={exportingDocx}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium transition cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-60"
            >
              {exportingDocx ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
              <span>{exportingDocx ? 'Membuat Word...' : 'Export Word (.docx)'}</span>
            </button>
          </div>
        </div>

        {/* 5 Operational Days Selectors */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-white">5 Hari Operasional:</span>
              <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg text-sm">
                {fullDateRangeStr || 'Memuat...'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShiftWeek(-7)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition text-xs flex items-center gap-1"
                title="Mundur 1 Minggu"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>-1 Minggu</span>
              </button>
              <button
                onClick={handleResetCurrentWeek}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Minggu Ini</span>
              </button>
              <button
                onClick={() => handleShiftWeek(7)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition text-xs flex items-center gap-1"
                title="Maju 1 Minggu"
              >
                <span>+1 Minggu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="ml-2 pl-3 border-l border-white/10 flex items-center gap-2">
                <label htmlFor="startDateInput" className="text-xs text-slate-400 hidden lg:inline">Mulai Dari:</label>
                <input
                  id="startDateInput"
                  type="date"
                  value={dates[0] || ''}
                  onChange={(e) => handleSetWeekFromStart(e.target.value)}
                  className="bg-slate-800 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  title="Pilih tanggal awal untuk mengisi 5 hari berurutan"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {dates.map((dateStr, idx) => {
              const dayObj = dayjs(dateStr).locale('id');
              const dayName = dayObj.format('dddd');
              const reportInfo = reportDays[idx];
              const isFilled = reportInfo?.isFilled ?? false;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition relative ${
                    isFilled
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-800/60 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Hari Ke-{idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {dayName}
                    </span>
                  </div>

                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => handleDayChange(idx, e.target.value)}
                    className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 mb-2 font-mono"
                    title={`Ubah tanggal Hari Ke-${idx + 1}`}
                  />

                  <div className="pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Menu Hari Ini:</span>
                      {isFilled ? (
                        <span className="text-emerald-400 flex items-center gap-0.5 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Ada
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-0.5 font-medium">
                          <AlertCircle className="w-3 h-3" /> Kosong
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white font-medium line-clamp-1" title={reportInfo?.namaMenu || DEFAULT_MENU_DOCX[idx]}>
                      {reportInfo?.namaMenu || <span className="text-slate-500 italic">Default Docx</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 pt-2 border-t border-white/5">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Tabel 2.3 (Sekolah): <strong>Porsi Besar</strong>.
              <span className="w-2 h-2 rounded-full bg-pink-400 ml-2"></span>
              Tabel 2.4 (Posyandu): <strong>Porsi Bumil/Busui</strong>.
            </span>
            <Link
              href="/admin/menu"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline font-medium"
            >
              <Utensils className="w-3.5 h-3.5" />
              Kelola Menu Hari Ini
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Gagal memuat data menu mingguan.</span>
          </div>
        )}

        {isLoading && (
          <div className="py-2 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Menyelaraskan data menu...</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1:1 MASTER DOCX PRINTABLE CANVAS                         */}
      {/* Exactly mirrors Laporan_Pelaksanaan_Program_MBG_Master   */}
      {/* ======================================================== */}
      <div
        className="max-w-[210mm] mx-auto bg-white text-black shadow-2xl p-[20mm] border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none"
        style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}
      >
        {/* ==================== COVER / HEADER ==================== */}
        <div className="text-center mb-10">
          <p className="font-bold text-[14pt] leading-snug uppercase">
            LAPORAN PELAKSANAAN PROGRAM MAKAN BERGIZI GRATIS
          </p>
          <p className="font-bold text-[14pt] leading-snug uppercase mt-1">
            SATUAN PELAYANAN PEMENUHAN GIZI – YAYASAN AL-FRUQON PANTURA TANGERANG – BANTEN
          </p>

          {/* Centered Single Badan Gizi Nasional Logo */}
          <div className="my-8 flex justify-center">
            <div className="w-[140px] h-[140px] relative">
              <Image
                src="/images/laporan/image1.png"
                alt="Logo Badan Gizi Nasional"
                width={140}
                height={140}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Centered Subtitle */}
          <p className="font-bold text-[12pt] leading-snug">
            LAPORAN MINGGUAN {fullDateRangeStr}
          </p>
        </div>

        {/* ==================== BAB 1 PENDAHULUAN ==================== */}
        <div className="mb-6">
          <p className="font-bold text-[14pt] uppercase mb-3">
            BAB 1 PENDAHULUAN
          </p>

          <p className="font-bold text-[12pt] mb-1.5">
            A. Latar Belakang
          </p>
          <p className="text-[11pt] text-justify leading-relaxed mb-3">
            Masalah gizi buruk masih menjadi tantangan besar di berbagai daerah, terutama di desa terpencil yang memiliki akses terbatas terhadap makanan bergizi. Kondisi ini dapat berdampak negatif pada kesehatan dan perkembangan anak-anak serta produktivitas masyarakat. Oleh karena itu, diperlukan langkah nyata untuk memberikan akses makanan bergizi kepada masyarakat yang membutuhkan, sekaligus meningkatkan kesadaran akan pentingnya pola makan sehat.
          </p>
          <p className="text-[11pt] text-justify leading-relaxed mb-3">
            Indonesia sebagai negara berkembang menghadapi berbagai tantangan di bidang kesehatan masyarakat, salah satunya adalah prevalensi stunting yang tinggi akibat kekurangan gizi kronis. Data dari Kementrian Kesehatan menunjukan bahwa anak-anak di bawah usia lima tahun di beberapa wilayah mengalami kekurangan gizi, yang berdampak pada tingkat kecerdasan dan daya saing mereka di masa depan. Program intervensi yang terfokus pada penyediaan makanan bergizi menjadi solusi yang mendesak untuk diterapkan. Selain itu, kesadaran masyarakat tentang pentingnya pola makan sehat masih rendah. Banyak keluarga, terutama di wilayah pedesaan, belum memahami pentingnya asupan makanan bergizi untuk menunjang kesehatan. Hal ini diperparah oleh keterbatasan ekonomi yang membuat sebagian besar keluarga hanya mampu menyediakan makanan pokok tanpa memikirkan kandungan nutrisi nya.
          </p>
          <p className="text-[11pt] text-justify leading-relaxed mb-4">
            Program ini dirancang untuk memberikan dampak jangka pendek dan jangka panjang. Dalam jangka pendek, diharapkan masyarakat dapat merasakan manfaat langsung dari makanan bergizi yang disediakan. Dalam jangka panjang, program ini bertujuan untuk meningkatkan kualitas hidup masyarakat melalui edukasi berkelanjutan tentang pentingnya pola makan yang sehat.
          </p>

          <p className="font-bold text-[12pt] mb-1.5">
            B. Tujuan
          </p>
          <p className="text-[11pt] mb-1">
            Program ini bertujuan untuk:
          </p>
          <p className="text-[11pt] mb-1">
            Memberikan makanan bergizi secara gratis kepada masyarakat yang membutuhkan.
          </p>
          <p className="text-[11pt] mb-1">
            Meningkatkan kesadaran masyarakat akan pentingnya pola makan sehat.
          </p>
          <p className="text-[11pt] mb-4">
            Memperbaiki akses makanan gizi seimbang dan di lokasi sasaran.
          </p>

          <p className="font-bold text-[12pt] mb-1.5">
            C. Sasaran
          </p>
          <p className="text-[11pt] mb-2">
            Sasaran kegiatan ini adalah:
          </p>
          <table className="w-full text-[11pt] mb-6 border-none">
            <tbody>
              <tr>
                <td className="w-64 py-0.5">1. Siswa TK/PAUD/RA</td>
                <td className="py-0.5">: 95 Siswa</td>
              </tr>
              <tr>
                <td className="py-0.5">2. Siswa SD/MI</td>
                <td className="py-0.5">: 1.921 Siswa</td>
              </tr>
              <tr>
                <td className="py-0.5">3. 3 B (Bumil, Busui, Balita)</td>
                <td className="py-0.5">: 578 Orang</td>
              </tr>
              <tr>
                <td className="py-0.5">4. Kader</td>
                <td className="py-0.5">: 21 Orang</td>
              </tr>
              <tr>
                <td className="py-0.5">5. Guru &amp; Tenaga Pendidik</td>
                <td className="py-0.5">: 93 Orang</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ==================== BAB II PELAKSANAAN KEGIATAN ==================== */}
        <div className="mb-6">
          <p className="font-bold text-[14pt] uppercase mb-3">
            BAB II PELAKSANAAN KEGIATAN
          </p>

          <p className="font-bold text-[12pt] mb-1.5">
            A. Persiapan (Koordinasi Lintas Sektor)
          </p>
          <p className="text-[11pt] mb-1">
            Koordinasi lintas sektor melibatkan berbagai instansi terkait, sebagai berikut:
          </p>
          <p className="text-[11pt] mb-1">
            Dinas pendidikan Kabupaten Tangerang
          </p>
          <p className="text-[11pt] mb-1">
            Dinas Kesehatan Kabupaten Tangerang
          </p>
          <p className="text-[11pt] mb-1">
            Kodim 0510 Kabupaten Tangerang
          </p>
          <p className="text-[11pt] mb-6">
            Koramil Teluk Naga
          </p>

          <p className="font-bold text-[12pt] mb-2">
            B. Lampiran Kegiatan
          </p>

          {/* 1. Persiapan */}
          <p className="font-bold text-[11pt] mb-2">
            1. Persiapan
          </p>
          <table className="w-full text-[10.5pt] border-collapse border border-black mb-6">
            <tbody>
              {reportDays.map((d, i) => (
                <tr key={`persiapan-${i}`} className="border border-black">
                  <td className="w-[140px] p-2 border border-black text-center align-middle bg-slate-50">
                    <div className="w-[110px] h-[146px] mx-auto relative">
                      <Image
                        src={`/images/laporan/image${2 + i}.jpeg`}
                        alt={`Persiapan ${d.hariTanggalLengkap}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="p-3 border border-black align-top text-justify leading-relaxed">
                    <span className="font-bold">{d.hariTanggalLengkap}</span> {PERSIAPAN_DESCRIPTIONS[i]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 2. Pengolahan */}
          <p className="font-bold text-[11pt] mb-2">
            2. Pengolahan
          </p>
          <table className="w-full text-[10.5pt] border-collapse border border-black mb-6">
            <tbody>
              {reportDays.map((d, i) => (
                <tr key={`pengolahan-${i}`} className="border border-black">
                  <td className="w-[140px] p-2 border border-black text-center align-middle bg-slate-50">
                    <div className="w-[110px] h-[146px] mx-auto relative">
                      <Image
                        src={`/images/laporan/image${7 + i}.jpeg`}
                        alt={`Pengolahan ${d.hariTanggalLengkap}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="p-3 border border-black align-top text-justify leading-relaxed">
                    <span className="font-bold">{d.hariTanggalLengkap}</span> {PENGOLAHAN_DESCRIPTIONS[i]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 3. Pemorsian dan Packing */}
          <p className="font-bold text-[11pt] mb-2">
            3. Pemorsian dan Packing
          </p>
          <table className="w-full text-[10.5pt] border-collapse border border-black mb-6">
            <tbody>
              {reportDays.map((d, i) => (
                <tr key={`pemorsian-${i}`} className="border border-black">
                  <td className="w-[140px] p-2 border border-black text-center align-middle bg-slate-50">
                    <div className="w-[110px] h-[146px] mx-auto relative">
                      <Image
                        src={`/images/laporan/image${12 + i}.jpeg`}
                        alt={`Pemorsian ${d.hariTanggalLengkap}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="p-3 border border-black align-top text-justify leading-relaxed">
                    <span className="font-bold">{d.hariTanggalLengkap}</span> {PEMORSIAN_DESCRIPTIONS[i]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 4. Distribusi */}
          <p className="font-bold text-[11pt] mb-1">
            4. Distribusi
          </p>
          <p className="text-[11pt] mb-2">
            Minggu ini pendistribusian Makan Bergizi dimulai pukul 08:00 WIB untuk sekolah, dilanjut dengan pukul 09:00 WIB untuk Posyandu.
          </p>
          <table className="w-full border-collapse border border-black mb-6">
            <tbody>
              <tr className="border border-black">
                <td className="w-1/2 p-2 border border-black text-center align-middle">
                  <div className="w-full h-[180px] relative">
                    <Image
                      src="/images/laporan/image17.jpeg"
                      alt="Distribusi Sekolah"
                      fill
                      sizes="350px"
                      className="object-cover"
                    />
                  </div>
                </td>
                <td className="w-1/2 p-2 border border-black text-center align-middle">
                  <div className="w-full h-[180px] relative">
                    <Image
                      src="/images/laporan/image18.jpeg"
                      alt="Distribusi Posyandu"
                      fill
                      sizes="350px"
                      className="object-cover"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 5. Pencucian Ompreng */}
          <p className="font-bold text-[11pt] mb-2">
            5. Pencucian Ompreng
          </p>
          <table className="w-full text-[10.5pt] border-collapse border border-black mb-6">
            <tbody>
              {PENCUCIAN_STEPS.map((step, idx) => (
                <tr key={`cuci-${idx}`} className="border border-black">
                  <td className="w-[140px] p-2 border border-black text-center align-middle bg-slate-50">
                    <div className="w-[110px] h-[146px] mx-auto relative">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="p-3 border border-black align-top text-justify leading-relaxed">
                    <span className="font-bold">{step.title}</span><br />
                    {step.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ==================== C. Pelaksaan ==================== */}
          <p className="font-bold text-[12pt] mb-3">
            C. Pelaksaan
          </p>

          {/* Tabel 2.1 */}
          <p className="text-center font-bold text-[11pt] mb-0.5">
            Tabel 2.1
          </p>
          <p className="text-center font-bold text-[11pt] mb-3">
            Penerima Menu MBG
          </p>
          <table className="w-full text-[10pt] border-collapse border border-black mb-8">
            <thead>
              <tr className="border border-black font-bold text-center">
                <th className="border border-black p-1.5 w-10">No.</th>
                <th className="border border-black p-1.5 w-40">Kabupaten/Kota</th>
                <th className="border border-black p-1.5">Nama Sekolah</th>
                <th className="border border-black p-1.5">Alamat Sekolah</th>
                <th className="border border-black p-1.5 w-36">
                  Jumlah Siswa/Kel Sasaran lain yang mendapat MBG
                </th>
              </tr>
            </thead>
            <tbody>
              {DAFTAR_SASARAN_DEFAULT.map((item) => (
                <tr key={item.no} className="border border-black">
                  <td className="border border-black p-1.5 text-center">{item.no}.</td>
                  <td className="border border-black p-1.5">{item.kabupaten}</td>
                  <td className="border border-black p-1.5 font-medium">{item.nama}</td>
                  <td className="border border-black p-1.5">{item.alamat}</td>
                  <td className="border border-black p-1.5 text-center">{item.jumlah}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tabel 2.2 */}
          <p className="text-center font-bold text-[11pt] mb-0.5">
            Tabel 2.2
          </p>
          <p className="text-center font-bold text-[11pt] mb-3">
            Jenis Menu MBG yang Diberikan
          </p>
          <table className="w-full text-[9.5pt] border-collapse border border-black mb-8">
            <thead>
              <tr className="border border-black font-bold text-center">
                <th className="border border-black p-1.5 w-32">Kabupaten/Kota</th>
                <th className="border border-black p-1.5 w-36">Nama Sekolah</th>
                <th className="border border-black p-1.5 w-16">Pemberian Ke-</th>
                <th className="border border-black p-1.5 w-40">Hari/Tanggal Pemberian</th>
                <th className="border border-black p-1.5">Jenis Menu MBG</th>
                <th className="border border-black p-1.5 w-12">Ket.</th>
              </tr>
            </thead>
            <tbody>
              {reportDays.map((d, dIdx) => {
                const currentMenu = d.namaMenu || DEFAULT_MENU_DOCX[dIdx];
                return (
                  <Fragment key={`t22-group-${dIdx}`}>
                    {/* 1. PAUD */}
                    <tr className="border border-black">
                      <td className="border border-black p-1">Kabupaten Tangerang</td>
                      <td className="border border-black p-1">PAUD Mathlaul Huda</td>
                      <td className="border border-black p-1 text-center">{d.pemberianKe}</td>
                      <td className="border border-black p-1">{d.hariTanggalLengkap}</td>
                      <td className="border border-black p-1 font-medium">{currentMenu}</td>
                      <td className="border border-black p-1 text-center"></td>
                    </tr>
                    {/* 2. MI */}
                    <tr className="border border-black">
                      <td className="border border-black p-1">Kabupaten Tangerang</td>
                      <td className="border border-black p-1">MI Mathlaul Huda</td>
                      <td className="border border-black p-1 text-center">{d.pemberianKe}</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 text-center"></td>
                    </tr>
                    {/* 3. SD 1 */}
                    <tr className="border border-black">
                      <td className="border border-black p-1">Kabupaten Tangerang</td>
                      <td className="border border-black p-1">SD Kebon Cau I</td>
                      <td className="border border-black p-1 text-center">{d.pemberianKe}</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 text-center"></td>
                    </tr>
                    {/* 4. SD 2 */}
                    <tr className="border border-black">
                      <td className="border border-black p-1">Kabupaten Tangerang</td>
                      <td className="border border-black p-1">SD Kebon Cau II</td>
                      <td className="border border-black p-1 text-center">{d.pemberianKe}</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 text-center"></td>
                    </tr>
                    {/* 5. Posyandu 4 */}
                    <tr className="border border-black">
                      <td className="border border-black p-1">Kabupaten Tangerang</td>
                      <td className="border border-black p-1">Posyandu Teratai 4</td>
                      <td className="border border-black p-1 text-center">{d.pemberianKe}</td>
                      <td className="border border-black p-1">{d.hariTanggalLengkap}</td>
                      <td className="border border-black p-1 font-medium">{currentMenu}</td>
                      <td className="border border-black p-1 text-center"></td>
                    </tr>
                    {/* 6. Posyandu 5 */}
                    <tr className="border border-black">
                      <td className="border border-black p-1">Kabupaten Tangerang</td>
                      <td className="border border-black p-1">Posyandu Teratai 5</td>
                      <td className="border border-black p-1 text-center">{d.pemberianKe}</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 text-center"></td>
                    </tr>
                    {/* 7. Posyandu 6 */}
                    <tr className="border border-black">
                      <td className="border border-black p-1">Kabupaten Tangerang</td>
                      <td className="border border-black p-1">Posyandu Teratai 6</td>
                      <td className="border border-black p-1 text-center">{d.pemberianKe}</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 text-center"></td>
                    </tr>
                    {/* 8. Posyandu 7 */}
                    <tr className="border border-black">
                      <td className="border border-black p-1">Kabupaten Tangerang</td>
                      <td className="border border-black p-1">Posyandu Teratai 7</td>
                      <td className="border border-black p-1 text-center">{d.pemberianKe}</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 text-center"></td>
                    </tr>
                    {/* 9. Posyandu 8 */}
                    <tr className="border border-black">
                      <td className="border border-black p-1">Kabupaten Tangerang</td>
                      <td className="border border-black p-1">Posyandu Teratai 8</td>
                      <td className="border border-black p-1 text-center">{d.pemberianKe}</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 text-center"></td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Tabel 2.3: Dokumentasi Kegiatan Sekolah */}
          <p className="text-center font-bold text-[11pt] mb-0.5">
            Tabel 2.3
          </p>
          <p className="text-center font-bold text-[11pt] mb-3">
            Dokumentasi Kegiatan Sekolah
          </p>
          <table className="w-full text-[10pt] border-collapse border border-black mb-8">
            <thead>
              <tr className="border border-black font-bold text-center">
                <th className="border border-black p-2 w-[35%]">MBG TK/RA, SD/I</th>
                <th className="border border-black p-2 w-[22%]">Hari/Tanggal</th>
                <th className="border border-black p-2 w-[43%]">Menu</th>
              </tr>
            </thead>
            <tbody>
              {reportDays.map((d, i) => {
                const currentMenu = d.namaMenu || DEFAULT_MENU_DOCX[i];
                return (
                  <tr key={`sek-${i}`} className="border border-black">
                    <td className="border border-black p-2.5 align-middle leading-relaxed font-medium">
                      {currentMenu}.
                    </td>
                    <td className="border border-black p-2.5 align-middle text-center font-medium whitespace-nowrap">
                      {d.hariTanggalSingkat}
                    </td>
                    <td className="border border-black p-2 align-middle text-center">
                      <div className="w-[190px] h-[135px] mx-auto relative bg-slate-50">
                        {d.fotoPorsiBesarUrl ? (
                          <Image
                            src={d.fotoPorsiBesarUrl}
                            alt={`Menu Sekolah ${d.hariTanggalSingkat}`}
                            fill
                            sizes="200px"
                            unoptimized
                            className="object-contain"
                          />
                        ) : (
                          <Image
                            src={`/images/laporan/image${27 + i}.png`}
                            alt={`Menu Sekolah ${i + 1}`}
                            fill
                            sizes="200px"
                            className="object-contain"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Tabel 2.4: Dokumentasi Kegiatan Posyandu (3B) */}
          <p className="text-center font-bold text-[11pt] mb-0.5">
            Tabel 2.4
          </p>
          <p className="text-center font-bold text-[11pt] mb-3">
            Dokumentasi Kegiatan Posyandu (3B)
          </p>
          <table className="w-full text-[10pt] border-collapse border border-black mb-8">
            <thead>
              <tr className="border border-black font-bold text-center">
                <th className="border border-black p-2 w-[35%]">Posyandu</th>
                <th className="border border-black p-2 w-[22%]">Hari/Tanggal</th>
                <th className="border border-black p-2 w-[43%]">Menu</th>
              </tr>
            </thead>
            <tbody>
              {reportDays.map((d, i) => {
                const currentMenu = d.namaMenu || DEFAULT_MENU_DOCX[i];
                const fallbackImg = i === 4 ? '/images/laporan/image32.png' : `/images/laporan/image${27 + i}.png`;
                return (
                  <tr key={`pos-${i}`} className="border border-black">
                    <td className="border border-black p-2.5 align-middle leading-relaxed font-medium">
                      {currentMenu}.
                    </td>
                    <td className="border border-black p-2.5 align-middle text-center font-medium whitespace-nowrap">
                      {d.hariTanggalSingkat}
                    </td>
                    <td className="border border-black p-2 align-middle text-center">
                      <div className="w-[190px] h-[135px] mx-auto relative bg-slate-50">
                        {d.fotoBumilUrl ? (
                          <Image
                            src={d.fotoBumilUrl}
                            alt={`Menu Posyandu ${d.hariTanggalSingkat}`}
                            fill
                            sizes="200px"
                            unoptimized
                            className="object-contain"
                          />
                        ) : (
                          <Image
                            src={fallbackImg}
                            alt={`Menu Posyandu ${i + 1}`}
                            fill
                            sizes="200px"
                            className="object-contain"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Dokumentasi Distribusi Sekolah dan Posyandu */}
          <p className="font-bold text-[11pt] mb-2">
            Dokumentasi Distribusi Sekolah dan Posyandu
          </p>
          <table className="w-full border-collapse border border-black mb-8">
            <tbody>
              <tr className="border border-black">
                {DISTRIBUSI_PHOTOS.slice(0, 4).map((img, idx) => (
                  <td key={`dist-r1-${idx}`} className="w-1/4 p-1.5 border border-black text-center align-middle">
                    <div className="w-full h-[110px] relative">
                      <Image
                        src={`/images/laporan/${img}`}
                        alt={`Distribusi ${idx + 1}`}
                        fill
                        sizes="180px"
                        className="object-cover"
                      />
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border border-black">
                {DISTRIBUSI_PHOTOS.slice(4, 8).map((img, idx) => (
                  <td key={`dist-r2-${idx}`} className="w-1/4 p-1.5 border border-black text-center align-middle">
                    <div className="w-full h-[110px] relative">
                      <Image
                        src={`/images/laporan/${img}`}
                        alt={`Distribusi ${idx + 5}`}
                        fill
                        sizes="180px"
                        className="object-cover"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Dokumentasi Surat Jalan Sekolah dan Posyandu */}
          <p className="font-bold text-[11pt] mb-2">
            Dokumentasi Surat Jalan Sekolah dan Posyandu
          </p>
          <table className="w-full border-collapse border border-black mb-8">
            <tbody>
              {suratJalanRows.map((row, rIdx) => (
                <tr key={`sj-row-${rIdx}`} className="border border-black">
                  {row.map((img, cIdx) => (
                    <td key={`sj-col-${cIdx}`} className="w-1/5 p-1 border border-black text-center align-middle">
                      <div className="w-full h-[130px] relative">
                        <Image
                          src={`/images/laporan/${img}`}
                          alt={`Surat Jalan ${rIdx * 5 + cIdx + 1}`}
                          fill
                          sizes="150px"
                          className="object-cover"
                        />
                      </div>
                    </td>
                  ))}
                  {/* Fill empty cells in last row if less than 5 */}
                  {row.length < 5 && Array.from({ length: 5 - row.length }).map((_, emptyIdx) => (
                    <td key={`sj-empty-${emptyIdx}`} className="w-1/5 p-1 border border-black"></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ==================== BAB III PERMASALAHAN & KENDALA ==================== */}
        <div className="mb-6">
          <p className="font-bold text-[14pt] uppercase mb-3">
            BAB III PERMASALAHAN &amp; KENDALA
          </p>

          <p className="font-bold text-[11pt] mb-1">
            Permasalahan &amp; Kendala
          </p>
          <p className="font-bold text-[11pt] mb-3">
            -
          </p>

          <p className="font-bold text-[11pt] mb-1">
            Penanganan Masalah
          </p>
          <p className="text-[11pt] mb-3">
            -
          </p>

          <p className="font-bold text-[11pt] mb-1">
            C. Rencana Tindak Lanjut
          </p>
          <p className="font-bold text-[11pt] mb-6">
            -
          </p>
        </div>

        {/* ==================== BAB IV PENUTUP ==================== */}
        <div>
          <p className="font-bold text-[14pt] uppercase mb-3">
            BAB IV PENUTUP
          </p>

          <p className="text-[11pt] text-justify leading-relaxed mb-3">
            Program Makanan Bergizi Gratis yang dijalankan oleh pemerintah merupakan salah satu upaya strategis dalam meningkatkan kualitas gizi masyarakat, khususnya bagi kelompok yang kurang mampu. Dalam pelaksanaannya, program ini bertujuan untuk mengurangi prevalensi gizi buruk, meningkatkan kesehatan anak-anak, serta memberikan akses yang lebih baik kepada makanan bergizi bagi keluarga-keluarga yang membutuhkan.
          </p>
          <p className="text-[11pt] text-justify leading-relaxed mb-3">
            Berdasarkan hasil pelaksanaan dan evaluasi, dapat disimpulkan bahwa program ini memberikan dampak positif terhadap peningkatan status gizi masyarakat. Melalui distribusi makanan bergizi yang tepat sasaran, program ini berperan penting dalam menurunkan angka stunting, memperbaiki kualitas kesehatan, serta mendorong peningkatan produktivitas di kalangan penerima manfaat.
          </p>
          <p className="text-[11pt] text-justify leading-relaxed mb-3">
            Namun demikian, terdapat beberapa tantangan yang perlu diatasi, seperti distribusi yang belum merata, kendala logistik, serta keterbatasan sumber daya yang mempengaruhi keberlanjutan program. Oleh karena itu, diperlukan kolaborasi yang lebih erat antara pemerintah, pihak swasta, dan masyarakat untuk memperbaiki dan mengoptimalkan pelaksanaan program ini di masa depan.
          </p>
          <p className="text-[11pt] text-justify leading-relaxed mb-3">
            Sebagai rekomendasi, peningkatan sistem distribusi yang lebih efisien dan pemantauan yang lebih ketat terhadap kualitas makanan yang disalurkan harus menjadi prioritas. Selain itu, edukasi mengenai pentingnya gizi seimbang perlu diperluas untuk mendukung keberhasilan program ini secara menyeluruh.
          </p>
          <p className="text-[11pt] text-justify leading-relaxed mb-8">
            Dengan komitmen dan dukungan yang kuat dari berbagai pihak, diharapkan program Makanan Bergizi Gratis ini dapat terus berkembang dan memberikan manfaat yang lebih luas bagi masyarakat Indonesia, serta membantu menciptakan generasi yang lebih sehat dan produktif.
          </p>

          {/* Signature Block matching docx */}
          <div className="flex justify-end mt-8">
            <div className="text-center w-64 text-[11pt]">
              <p>Teluk Naga, {closingDateStr}</p>
              <p className="mt-1">Kepala SPPG Teluk Naga 03</p>
              <div className="h-24"></div>
              <p className="font-bold">Rahmad Diko</p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PRINT-ONLY CSS RULES (A4 page format)                    */}
      {/* ======================================================== */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
              html, body {
                height: auto !important;
                overflow: visible !important;
                background-color: #ffffff !important;
                color: #000000 !important;
                font-family: Calibri, "Segoe UI", Arial, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              aside, nav, .print\\:hidden {
                display: none !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
