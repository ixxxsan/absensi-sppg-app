'use client';

import { useState } from 'react';
import { ChevronDown, MapPin, Clock, Camera, CheckCircle, XCircle, AlertCircle, ClipboardList } from 'lucide-react';
import { useAbsensiStore } from '@/lib/stores';
import type { AbsenRecord } from '@/lib/stores';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface AttendanceCardProps {
  record: AbsenRecord;
}

function AttendanceCard({ record }: AttendanceCardProps) {
  const [showPhoto, setShowPhoto] = useState(false);

  const statusConfig = {
    valid: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Valid' },
    ditolak: { icon: XCircle, color: '#f87171', bg: 'rgba(248,113,113,0.15)', label: 'Ditolak' },
  };
  const status = statusConfig[record.statusValidasi];
  const StatusIcon = status.icon;

  return (
    <div className="card space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full
            ${record.tipe === 'masuk'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-amber-500/20 text-amber-400'
            }`}>
            {record.tipe === 'masuk' ? 'MASUK' : 'PULANG'}
          </span>
          <p className="text-slate-400 text-xs">{record.tanggalAbsen}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${status.bg}`}>
          <StatusIcon className={`w-3 h-3 ${status.color}`} />
          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Time & Location */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-white text-sm font-semibold font-mono-clock">
            {record.waktuAbsen}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 text-xs font-mono">
            {record.latitude.toFixed(3)}, {record.longitude.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Photo toggle */}
      <button
        onClick={() => setShowPhoto(!showPhoto)}
        className="flex items-center gap-1.5 text-slate-500 text-xs hover:text-slate-300 transition-colors"
      >
        <Camera className="w-3.5 h-3.5" />
        {showPhoto ? 'Sembunyikan foto' : 'Lihat foto bukti'}
        <ChevronDown className={`w-3 h-3 transition-transform ${showPhoto ? 'rotate-180' : ''}`} />
      </button>

      {showPhoto && record.fotoUrl && (
        <div className="rounded-xl overflow-hidden mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={record.fotoUrl}
            alt="Foto absensi dengan watermark"
            className="w-full object-cover max-h-60"
          />
        </div>
      )}
    </div>
  );
}

export default function RiwayatPage() {
  const { riwayat, absenMasukToday, absenPulangToday } = useAbsensiStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Combine today's records with historical
  const allRecords: AbsenRecord[] = [
    ...(absenMasukToday ? [absenMasukToday] : []),
    ...(absenPulangToday ? [absenPulangToday] : []),
    ...riwayat,
  ];

  const filteredRecords = allRecords.filter((r) => {
    const month = new Date(r.tanggalAbsen).getMonth();
    return month === selectedMonth;
  });

  // Group by date
  const grouped = filteredRecords.reduce<Record<string, AbsenRecord[]>>((acc, r) => {
    const date = r.tanggalAbsen;
    if (!acc[date]) acc[date] = [];
    acc[date].push(r);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1));

  return (
    <div className="min-h-dvh gradient-dark">
      {/* Header */}
      <header className="px-5 pt-safe pt-8 pb-4">
        <h1 className="text-white text-xl font-bold">Riwayat Absensi</h1>
        <p className="text-slate-400 text-sm mt-1">Rekap kehadiran Anda</p>
      </header>

      {/* Month filter */}
      <div className="px-5 pb-4">
        <div className="relative">
          <select
            id="month-filter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full input-field appearance-none pr-10 cursor-pointer"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m} {new Date().getFullYear()}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Summary stats */}
      <div className="px-5 pb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Total Hadir', value: sortedDates.length, color: 'text-white' },
          { label: 'Masuk', value: filteredRecords.filter(r => r.tipe === 'masuk').length, color: 'text-blue-400' },
          { label: 'Pulang', value: filteredRecords.filter(r => r.tipe === 'pulang').length, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-3">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      <div className="px-5 space-y-5 pb-6">
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="w-12 h-12 text-slate-500" />
            <p className="text-slate-400 text-sm">Belum ada data absensi di bulan ini</p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{date}</p>
                <div className="flex-1 h-px bg-slate-700/50" />
              </div>
              <div className="space-y-2.5">
                {grouped[date].map((record) => (
                  <AttendanceCard key={`${record.id}-${record.tipe}`} record={record} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
