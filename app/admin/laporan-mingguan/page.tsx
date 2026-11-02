'use client';

import { useState, useMemo } from 'react';
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
import { DAFTAR_SASARAN_DEFAULT, DayReportData } from '@/lib/constants/laporan-mingguan';

dayjs.locale('id');

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
  // Non-consecutive operational days supported (e.g. holiday on Tuesday -> Day 2 can be Wednesday)
  const [dates, setDates] = useState<string[]>(getDefaultDates());
  const [exportingDocx, setExportingDocx] = useState<boolean>(false);

  // SWR: auto-fetch menu data whenever the 5 dates change
  const datesKey = dates.join(',');
  const { data: rawReportDays = [], isLoading, error } = useSWR<DayReportData[]>(
    ['weekly-menu-data', datesKey],
    () => getWeeklyReportMenuData(dates),
    { revalidateOnFocus: false }
  );

  // Fallback days map so UI always has 5 rows even during loading/initialization
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

  // Update a single operational day
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

  // Reset to current week Monday-Friday
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

  // Export DOCX
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

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  const startFormatted = dates[0] ? dayjs(dates[0]).locale('id').format('DD MMMM') : '';
  const endFormatted = dates[4] ? dayjs(dates[4]).locale('id').format('DD MMMM YYYY') : '';
  const fullDateRangeStr = `${startFormatted} – ${endFormatted}`;
  const closingDateStr = dates[4] ? dayjs(dates[4]).locale('id').format('DD MMMM YYYY') : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 print:p-0 print:bg-white print:text-black">
      {/* Non-Printable Header & Controls */}
      <div className="max-w-6xl mx-auto mb-8 print:hidden">
        {/* Breadcrumb / Top Bar */}
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
              <p className="text-sm text-slate-400">
                Pilih 5 hari operasional (fleksibel jika ada libur). Menu &amp; foto otomatis terisi dari Menu Hari Ini.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
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

        {/* 5-Day Operational Date Config Card */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-white">5 Hari Operasional:</span>
              <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg text-sm">
                {fullDateRangeStr || 'Memuat...'}
              </span>
            </div>

            {/* Quick Week Controls */}
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

          {/* Individual 5-Day Selectors */}
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

                  {/* Individual Date Picker */}
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => handleDayChange(idx, e.target.value)}
                    className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 mb-2 font-mono"
                    title={`Ubah tanggal Hari Ke-${idx + 1} (bisa lewati hari libur)`}
                  />

                  {/* Status Indicator */}
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
                    <p className="text-[11px] text-white font-medium line-clamp-1" title={reportInfo?.namaMenu || 'Belum diisi'}>
                      {reportInfo?.namaMenu || <span className="text-slate-500 italic">Belum diinput</span>}
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
              <span className="text-slate-500 ml-2 hidden md:inline">
                (Setiap Hari Ke-1 s/d Ke-5 bebas diatur jika ada hari libur di tengah minggu)
              </span>
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

      {/* PRINTABLE / PREVIEW CANVAS */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 shadow-2xl rounded-2xl p-8 md:p-14 border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:text-black">
        {/* DOCUMENT HEADER */}
        <div className="text-center pb-6 border-b-2 border-slate-900/80 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-20 h-20 relative flex items-center justify-center">
              <Image
                src="/logo-bgn.png"
                alt="Logo Badan Gizi Nasional"
                width={80}
                height={80}
                className="object-contain max-h-20"
                priority
              />
            </div>
            <div className="flex-1 px-4">
              <h1 className="text-base md:text-lg font-black tracking-wide uppercase text-slate-950">
                LAPORAN PELAKSANAAN PROGRAM MAKAN BERGIZI GRATIS
              </h1>
              <h2 className="text-xs md:text-sm font-bold tracking-wide uppercase text-slate-800 mt-1">
                SATUAN PELAYANAN PEMENUHAN GIZI – YAYASAN AL-FRUQON PANTURA TANGERANG – BANTEN
              </h2>
              <div className="mt-2 inline-block bg-slate-100 border border-slate-300 text-slate-900 font-extrabold text-xs md:text-sm px-4 py-1 rounded">
                LAPORAN MINGGUAN {fullDateRangeStr.toUpperCase()}
              </div>
            </div>
            <div className="w-20 h-20 relative flex items-center justify-center">
              <Image
                src="/logo-yayasan.png"
                alt="Logo Yayasan Al-Fruqon"
                width={80}
                height={80}
                className="object-contain max-h-20"
                priority
              />
            </div>
          </div>
        </div>

        {/* BAB I: PENDAHULUAN */}
        <section className="mb-8">
          <h2 className="text-sm md:text-base font-bold text-slate-950 uppercase mb-3">
            BAB I PENDAHULUAN
          </h2>

          <div className="mb-4">
            <h3 className="font-bold text-xs md:text-sm text-slate-900 mb-1">A. Latar Belakang</h3>
            <p className="text-xs text-justify leading-relaxed text-slate-800 mb-2">
              Masalah gizi buruk masih menjadi tantangan besar di berbagai daerah, terutama di desa terpencil yang memiliki akses terbatas terhadap makanan bergizi. Kondisi ini dapat berdampak negatif pada kesehatan dan perkembangan anak-anak serta produktivitas masyarakat. Oleh karena itu, diperlukan langkah nyata untuk memberikan akses makanan bergizi kepada masyarakat yang membutuhkan, sekaligus meningkatkan kesadaran akan pentingnya pola makan sehat.
            </p>
            <p className="text-xs text-justify leading-relaxed text-slate-800 mb-2">
              Indonesia sebagai negara berkembang menghadapi berbagai tantangan di bidang kesehatan masyarakat, salah satunya adalah prevalensi stunting yang tinggi akibat kekurangan gizi kronis. Data dari Kementerian Kesehatan menunjukkan bahwa anak-anak di bawah usia lima tahun di beberapa wilayah mengalami kekurangan gizi, yang berdampak pada tingkat kecerdasan dan daya saing mereka di masa depan. Program intervensi yang terfokus pada penyediaan makanan bergizi menjadi solusi yang mendesak untuk diterapkan.
            </p>
            <p className="text-xs text-justify leading-relaxed text-slate-800">
              Program ini dirancang untuk memberikan dampak jangka pendek dan jangka panjang. Dalam jangka pendek, diharapkan masyarakat dapat merasakan manfaat langsung dari makanan bergizi yang disediakan. Dalam jangka panjang, program ini bertujuan untuk meningkatkan kualitas hidup masyarakat melalui edukasi berkelanjutan tentang pentingnya pola makan yang sehat.
            </p>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-xs md:text-sm text-slate-900 mb-1">B. Tujuan</h3>
            <p className="text-xs text-slate-800 mb-1">Program ini bertujuan untuk:</p>
            <ul className="list-disc list-inside text-xs text-slate-800 space-y-0.5 ml-2">
              <li>Memberikan makanan bergizi secara gratis kepada masyarakat yang membutuhkan.</li>
              <li>Meningkatkan kesadaran masyarakat akan pentingnya pola makan sehat.</li>
              <li>Memperbaiki akses makanan gizi seimbang di lokasi sasaran.</li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-xs md:text-sm text-slate-900 mb-1">C. Sasaran</h3>
            <p className="text-xs text-slate-800 mb-2">Sasaran kegiatan ini adalah:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-slate-400">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="py-1 px-3 font-medium w-64 border-r border-slate-300">1. Siswa TK/PAUD/RA</td>
                    <td className="py-1 px-3 font-semibold">: 95 Siswa</td>
                  </tr>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <td className="py-1 px-3 font-medium border-r border-slate-300">2. Siswa SD/MI</td>
                    <td className="py-1 px-3 font-semibold">: 1.921 Siswa</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="py-1 px-3 font-medium border-r border-slate-300">3. 3 B (Bumil, Busui, Balita)</td>
                    <td className="py-1 px-3 font-semibold">: 578 Orang</td>
                  </tr>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <td className="py-1 px-3 font-medium border-r border-slate-300">4. Kader</td>
                    <td className="py-1 px-3 font-semibold">: 21 Orang</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="py-1 px-3 font-medium border-r border-slate-300">5. Guru &amp; Tenaga Pendidik</td>
                    <td className="py-1 px-3 font-semibold">: 93 Orang</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td className="py-1.5 px-3 border-r border-slate-300">TOTAL SASARAN</td>
                    <td className="py-1.5 px-3">: 2.708 Orang</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* BAB II: PELAKSANAAN KEGIATAN */}
        <section className="mb-8">
          <h2 className="text-sm md:text-base font-bold text-slate-950 uppercase mb-3">
            BAB II PELAKSANAAN KEGIATAN
          </h2>

          <div className="mb-4">
            <h3 className="font-bold text-xs md:text-sm text-slate-900 mb-1">
              A. Persiapan (Koordinasi Lintas Sektor)
            </h3>
            <p className="text-xs text-slate-800 mb-1">
              Koordinasi lintas sektor melibatkan berbagai instansi terkait, sebagai berikut:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-800 space-y-0.5 ml-2">
              <li>Dinas Pendidikan Kabupaten Tangerang</li>
              <li>Dinas Kesehatan Kabupaten Tangerang</li>
              <li>Kodim 0510 Kabupaten Tangerang</li>
              <li>Koramil Teluk Naga</li>
            </ul>
          </div>

          {/* Lampiran Kegiatan (Workflow & Process Photos) */}
          <div className="mb-6">
            <h3 className="font-bold text-xs md:text-sm text-slate-900 mb-2">
              B. Lampiran Kegiatan
            </h3>

            {/* 1. Persiapan */}
            <div className="mb-4">
              <h4 className="font-semibold text-xs text-slate-900 mb-1.5">1. Persiapan Bahan Makanan</h4>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { img: '/images/laporan/image2.jpeg', desc: 'Pemotongan labu siam & bahan makanan' },
                  { img: '/images/laporan/image3.jpeg', desc: 'Pemotongan kol & sayuran' },
                  { img: '/images/laporan/image4.jpeg', desc: 'Pemarutan labu siam & bumbu' },
                  { img: '/images/laporan/image5.jpeg', desc: 'Pemotongan halus sayur' },
                  { img: '/images/laporan/image6.jpeg', desc: 'Pemotongan wortel & bahan baku' },
                ].map((item, i) => {
                  const dayLabel = dates[i] ? dayjs(dates[i]).locale('id').format('dddd, DD/MM') : `Hari ${i + 1}`;
                  return (
                    <div key={i} className="border border-slate-300 rounded p-1 text-center bg-slate-50">
                      <div className="h-20 w-full relative mb-1 bg-slate-200">
                        <Image src={item.img} alt={dayLabel} fill sizes="100px" className="object-cover rounded" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-900">{dayLabel}</div>
                      <div className="text-[9px] text-slate-600 line-clamp-2 leading-tight">{item.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Pengolahan */}
            <div className="mb-4">
              <h4 className="font-semibold text-xs text-slate-900 mb-1.5">2. Pengolahan / Memasak</h4>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { img: '/images/laporan/image7.jpeg', desc: 'Memasak olahan ayam' },
                  { img: '/images/laporan/image8.jpeg', desc: 'Menggoreng tahu & lauk nabati' },
                  { img: '/images/laporan/image9.jpeg', desc: 'Pengolahan daging berbumbu' },
                  { img: '/images/laporan/image10.jpeg', desc: 'Penggorengan lauk & protein' },
                  { img: '/images/laporan/image11.jpeg', desc: 'Memasak daging slice & teriyaki' },
                ].map((item, i) => {
                  const dayLabel = dates[i] ? dayjs(dates[i]).locale('id').format('dddd, DD/MM') : `Hari ${i + 1}`;
                  return (
                    <div key={i} className="border border-slate-300 rounded p-1 text-center bg-slate-50">
                      <div className="h-20 w-full relative mb-1 bg-slate-200">
                        <Image src={item.img} alt={dayLabel} fill sizes="100px" className="object-cover rounded" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-900">{dayLabel}</div>
                      <div className="text-[9px] text-slate-600 line-clamp-2 leading-tight">{item.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Pemorsian & Packing */}
            <div className="mb-4">
              <h4 className="font-semibold text-xs text-slate-900 mb-1.5">3. Pemorsian dan Packing</h4>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { img: '/images/laporan/image12.jpeg', desc: 'Pemorsian ompreng 04:22 WIB' },
                  { img: '/images/laporan/image13.jpeg', desc: 'Pemorsian ompreng 04:06 WIB' },
                  { img: '/images/laporan/image14.jpeg', desc: 'Pemorsian ompreng 03:54 WIB' },
                  { img: '/images/laporan/image15.jpeg', desc: 'Pemorsian ompreng 04:10 WIB' },
                  { img: '/images/laporan/image16.jpeg', desc: 'Pemorsian ompreng 04:15 WIB' },
                ].map((item, i) => {
                  const dayLabel = dates[i] ? dayjs(dates[i]).locale('id').format('dddd, DD/MM') : `Hari ${i + 1}`;
                  return (
                    <div key={i} className="border border-slate-300 rounded p-1 text-center bg-slate-50">
                      <div className="h-20 w-full relative mb-1 bg-slate-200">
                        <Image src={item.img} alt={dayLabel} fill sizes="100px" className="object-cover rounded" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-900">{dayLabel}</div>
                      <div className="text-[9px] text-slate-600 line-clamp-2 leading-tight">{item.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Distribusi & 5. Pencucian Ompreng */}
            <div className="mb-4">
              <h4 className="font-semibold text-xs text-slate-900 mb-1.5">4. Distribusi &amp; 5. Pencucian Ompreng Standar Higienis</h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="border border-slate-300 rounded p-1 text-center bg-slate-50">
                  <div className="h-20 w-full relative mb-1 bg-slate-200">
                    <Image src="/images/laporan/image17.jpeg" alt="Distribusi" fill sizes="150px" className="object-cover rounded" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-900">Distribusi Mobil Box</div>
                  <div className="text-[9px] text-slate-600">Pengantaran tepat waktu ke sekolah</div>
                </div>
                <div className="border border-slate-300 rounded p-1 text-center bg-slate-50">
                  <div className="h-20 w-full relative mb-1 bg-slate-200">
                    <Image src="/images/laporan/image19.jpeg" alt="Penyisihan" fill sizes="150px" className="object-cover rounded" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-900">1. Pemisahan Sisa</div>
                  <div className="text-[9px] text-slate-600">Penyortiran sisa makanan dari ompreng</div>
                </div>
                <div className="border border-slate-300 rounded p-1 text-center bg-slate-50">
                  <div className="h-20 w-full relative mb-1 bg-slate-200">
                    <Image src="/images/laporan/image21.jpeg" alt="Pencucian" fill sizes="150px" className="object-cover rounded" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-900">2-4. Pencucian 3 Tahap</div>
                  <div className="text-[9px] text-slate-600">Sabun food-grade &amp; pembilasan bersih</div>
                </div>
                <div className="border border-slate-300 rounded p-1 text-center bg-slate-50">
                  <div className="h-20 w-full relative mb-1 bg-slate-200">
                    <Image src="/images/laporan/image25.jpeg" alt="Sanitasi" fill sizes="150px" className="object-cover rounded" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-900">5-8. Sanitasi &amp; Pengelapan</div>
                  <div className="text-[9px] text-slate-600">Perendaman air panas &amp; lap microfiber</div>
                </div>
              </div>
            </div>
          </div>

          {/* TABEL 2.1: SASARAN PENERIMA MANFAAT */}
          <div className="mb-6">
            <h3 className="font-bold text-xs md:text-sm text-slate-900 mb-1">
              C. Pelaksanaan
            </h3>
            <div className="font-semibold text-xs text-slate-900 mb-1">
              Tabel 2.1 Sasaran Penerima Manfaat
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-900">
                    <th className="border border-slate-300 p-1.5 text-center w-10">No.</th>
                    <th className="border border-slate-300 p-1.5 text-left w-36">Kabupaten/Kota</th>
                    <th className="border border-slate-300 p-1.5 text-left">Nama Sekolah / Posyandu</th>
                    <th className="border border-slate-300 p-1.5 text-left">Alamat</th>
                    <th className="border border-slate-300 p-1.5 text-center w-28">Jumlah Sasaran</th>
                  </tr>
                </thead>
                <tbody>
                  {DAFTAR_SASARAN_DEFAULT.map((item) => (
                    <tr key={item.no} className="border-b border-slate-300 even:bg-slate-50/70">
                      <td className="border border-slate-300 p-1 text-center">{item.no}.</td>
                      <td className="border border-slate-300 p-1">{item.kabupaten}</td>
                      <td className="border border-slate-300 p-1 font-semibold">{item.nama}</td>
                      <td className="border border-slate-300 p-1 text-[11px] text-slate-700">{item.alamat}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold">{item.jumlah}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={4} className="border border-slate-300 p-1.5 text-right">TOTAL SASARAN:</td>
                    <td className="border border-slate-300 p-1.5 text-center text-emerald-800">2.708</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL 2.2: MENU HARIAN MBG 5 HARI */}
          <div className="mb-6">
            <div className="font-semibold text-xs text-slate-900 mb-1">
              Tabel 2.2 Menu Harian MBG 5 Hari Operasional
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-900">
                    <th className="border border-slate-300 p-1.5 text-left w-32">Kabupaten/Kota</th>
                    <th className="border border-slate-300 p-1.5 text-left">Nama Sekolah / Posyandu</th>
                    <th className="border border-slate-300 p-1.5 text-center w-14">Hari Ke-</th>
                    <th className="border border-slate-300 p-1.5 text-left w-44">Hari / Tanggal</th>
                    <th className="border border-slate-300 p-1.5 text-left">Jenis Menu MBG</th>
                    <th className="border border-slate-300 p-1.5 text-center w-12">Ket.</th>
                  </tr>
                </thead>
                <tbody>
                  {reportDays.map((d, dIdx) => (
                    <tr key={`day-hdr-${dIdx}`} className="bg-slate-100/90 font-bold text-slate-900 border-t border-b border-slate-300">
                      <td className="border border-slate-300 p-1 font-semibold text-slate-700">Kabupaten Tangerang</td>
                      <td className="border border-slate-300 p-1 text-emerald-950 font-bold">
                        9 Sasaran (4 Sekolah &amp; 5 Posyandu)
                      </td>
                      <td className="border border-slate-300 p-1 text-center font-extrabold">{d.pemberianKe}</td>
                      <td className="border border-slate-300 p-1 font-semibold text-slate-900">{d.hariTanggalLengkap}</td>
                      <td className="border border-slate-300 p-1 font-bold text-slate-950">
                        {d.namaMenu || <span className="text-amber-700 italic">Belum diinput di Menu Hari Ini</span>}
                      </td>
                      <td className="border border-slate-300 p-1 text-center font-medium text-emerald-700">
                        {d.isFilled ? 'OK' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL 2.3: DOKUMENTASI KEGIATAN SEKOLAH (MBG TK/RA, SD/I) */}
          <div className="mb-6 page-break-inside-avoid">
            <div className="font-semibold text-xs md:text-sm text-slate-900 mb-1 flex items-center justify-between">
              <span>Tabel 2.3 Dokumentasi Kegiatan Sekolah (MBG TK/RA, SD/I)</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300 print:hidden">
                Foto Menu: Porsi Besar Sekolah
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-900">
                    <th className="border border-slate-300 p-2 text-left">Jenis Menu MBG</th>
                    <th className="border border-slate-300 p-2 text-center w-40">Hari/Tanggal</th>
                    <th className="border border-slate-300 p-2 text-center w-52">Menu (Porsi Besar Sekolah)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportDays.map((d, i) => (
                    <tr key={`sek-${d.dateStr}`} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-3 align-middle font-medium text-slate-900 text-xs leading-relaxed">
                        {d.namaMenu || <span className="text-amber-700 italic">Menu belum diinput</span>}
                      </td>
                      <td className="border border-slate-300 p-3 align-middle text-center font-semibold text-slate-800 text-xs whitespace-nowrap">
                        {d.hariTanggalSingkat}
                      </td>
                      <td className="border border-slate-300 p-2 align-middle text-center">
                        <div className="w-48 h-32 mx-auto relative bg-slate-100 border border-slate-300 rounded overflow-hidden flex items-center justify-center">
                          {d.fotoPorsiBesarUrl ? (
                            <Image
                              src={d.fotoPorsiBesarUrl}
                              alt={`Menu Sekolah ${d.hariTanggalSingkat}`}
                              fill
                              sizes="200px"
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full relative">
                              <Image
                                src={`/images/laporan/image${27 + i}.png`}
                                alt={`Sample Menu ${i + 1}`}
                                fill
                                sizes="200px"
                                className="object-cover opacity-80"
                              />
                              <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded text-center">
                                Sample Template
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL 2.4: DOKUMENTASI KEGIATAN POSYANDU (3B) */}
          <div className="mb-6 page-break-inside-avoid">
            <div className="font-semibold text-xs md:text-sm text-slate-900 mb-1 flex items-center justify-between">
              <span>Tabel 2.4 Dokumentasi Kegiatan Posyandu (3B: Bumil, Busui, Balita)</span>
              <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded border border-pink-300 print:hidden">
                Foto Menu: Porsi Bumil/Busui
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-900">
                    <th className="border border-slate-300 p-2 text-left">Jenis Menu MBG</th>
                    <th className="border border-slate-300 p-2 text-center w-40">Hari/Tanggal</th>
                    <th className="border border-slate-300 p-2 text-center w-52">Menu (Porsi Bumil / Busui)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportDays.map((d, i) => (
                    <tr key={`pos-${d.dateStr}`} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-3 align-middle font-medium text-slate-900 text-xs leading-relaxed">
                        {d.namaMenu || <span className="text-amber-700 italic">Menu belum diinput</span>}
                      </td>
                      <td className="border border-slate-300 p-3 align-middle text-center font-semibold text-slate-800 text-xs whitespace-nowrap">
                        {d.hariTanggalSingkat}
                      </td>
                      <td className="border border-slate-300 p-2 align-middle text-center">
                        <div className="w-48 h-32 mx-auto relative bg-slate-100 border border-slate-300 rounded overflow-hidden flex items-center justify-center">
                          {d.fotoBumilUrl ? (
                            <Image
                              src={d.fotoBumilUrl}
                              alt={`Menu Posyandu ${d.hariTanggalSingkat}`}
                              fill
                              sizes="200px"
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full relative">
                              <Image
                                src={i === 4 ? '/images/laporan/image32.png' : `/images/laporan/image${27 + i}.png`}
                                alt={`Sample Menu Posyandu ${i + 1}`}
                                fill
                                sizes="200px"
                                className="object-cover opacity-80"
                              />
                              <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded text-center">
                                Sample Template
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DOKUMENTASI DISTRIBUSI & SURAT JALAN */}
          <div className="mb-6 page-break-inside-avoid">
            <h4 className="font-semibold text-xs text-slate-900 mb-2">Dokumentasi Distribusi Sekolah dan Posyandu</h4>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['image18.jpeg', 'image33.jpeg', 'image34.jpeg', 'image35.jpeg', 'image36.jpeg', 'image37.jpeg', 'image38.jpeg', 'image39.jpeg'].map((img, i) => (
                <div key={i} className="h-24 w-full relative bg-slate-100 border border-slate-300 rounded overflow-hidden">
                  <Image src={`/images/laporan/${img}`} alt={`Distribusi ${i + 1}`} fill sizes="150px" className="object-cover" />
                </div>
              ))}
            </div>

            <h4 className="font-semibold text-xs text-slate-900 mb-2">Dokumentasi Surat Jalan Penerima Manfaat</h4>
            <div className="grid grid-cols-6 gap-2">
              {['image40.jpeg', 'image41.jpeg', 'image42.jpeg', 'image43.jpeg', 'image44.jpeg', 'image45.jpeg'].map((img, i) => (
                <div key={i} className="h-28 w-full relative bg-slate-100 border border-slate-300 rounded overflow-hidden">
                  <Image src={`/images/laporan/${img}`} alt={`Surat Jalan ${i + 1}`} fill sizes="150px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BAB III: PERMASALAHAN & KENDALA */}
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-sm md:text-base font-bold text-slate-950 uppercase mb-3">
            BAB III PERMASALAHAN &amp; KENDALA
          </h2>
          <div className="space-y-2 text-xs text-slate-800">
            <div>
              <span className="font-bold text-slate-900">A. Permasalahan &amp; Kendala:</span>
              <p className="ml-4 text-slate-700">- Pelaksanaan minggu ini berjalan tertib dan lancar tanpa kendala operasional yang signifikan.</p>
            </div>
            <div>
              <span className="font-bold text-slate-900">B. Penanganan Masalah:</span>
              <p className="ml-4 text-slate-700">- Standar operasional prosedur persiapan dini (H-1 malam) dan kontrol suhu makanan konsisten dijalankan.</p>
            </div>
            <div>
              <span className="font-bold text-slate-900">C. Rencana Tindak Lanjut:</span>
              <p className="ml-4 text-slate-700">- Mempertahankan koordinasi intensif dengan kepala sekolah, kader posyandu, dan tim logistik kendaraan box.</p>
            </div>
          </div>
        </section>

        {/* BAB IV: PENUTUP & TANDA TANGAN */}
        <section className="page-break-inside-avoid">
          <h2 className="text-sm md:text-base font-bold text-slate-950 uppercase mb-3">
            BAB IV PENUTUP
          </h2>
          <p className="text-xs text-justify leading-relaxed text-slate-800 mb-3">
            Program Makanan Bergizi Gratis yang dijalankan oleh pemerintah merupakan salah satu upaya strategis dalam meningkatkan kualitas gizi masyarakat, khususnya bagi kelompok yang membutuhkan. Berdasarkan hasil pelaksanaan dan evaluasi mingguan, program ini memberikan dampak positif terhadap asupan nutrisi peserta didik dan penerima sasaran 3B.
          </p>
          <p className="text-xs text-justify leading-relaxed text-slate-800 mb-6">
            Dengan komitmen dan dukungan penuh dari Badan Gizi Nasional, Yayasan Al-Fruqon Pantura Tangerang, serta seluruh stakeholder lintas sektor, diharapkan program ini dapat terus berkelanjutan dalam mewujudkan generasi penerus yang sehat, cerdas, dan tangguh.
          </p>

          {/* SIGNATURE BLOCK */}
          <div className="flex justify-end pt-4">
            <div className="text-center w-64">
              <div className="text-xs text-slate-900">Teluk Naga, {closingDateStr}</div>
              <div className="text-xs font-bold text-slate-900 mt-1">Kepala SPPG Teluk Naga 03</div>
              <div className="h-20 my-2 flex items-center justify-center">
                <div className="w-24 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                  (Tanda Tangan &amp; Cap)
                </div>
              </div>
              <div className="text-xs font-bold text-slate-950 underline">Rahmad Diko</div>
              <div className="text-[10px] text-slate-600">NIP / ID: SPPG-TN-03</div>
            </div>
          </div>
        </section>
      </div>

      {/* PRINT-ONLY CSS STYLES (Clean HTML <style> without styled-jsx requirement) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm 15mm;
              }
              body {
                background-color: #ffffff !important;
                color: #000000 !important;
                font-size: 11pt !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              .page-break-inside-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
