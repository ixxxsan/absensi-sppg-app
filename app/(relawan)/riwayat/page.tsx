'use client';

import { useState } from 'react';
import { ChevronDown, MapPin, Clock, Camera, CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import { useAbsensiStore } from '@/lib/stores';
import Image from 'next/image';
import type { AbsenRecord } from '@/lib/stores';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface AttendanceCardProps {
  record: AbsenRecord;
}

const itemVars: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

function AttendanceCard({ record }: AttendanceCardProps) {
  const [showPhoto, setShowPhoto] = useState(false);

  const statusConfig: Record<string, { icon: unknown, color: string, bg: string, label: string }> = {
    valid: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Valid' },
    ditolak: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Ditolak' },
    menunggu: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Menunggu' },
    invalid: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Tidak Valid' },
    flagged: { icon: CheckCircle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Flagged' },
  };
  const status = statusConfig[record.statusValidasi] || statusConfig.menunggu;
  const StatusIcon = status.icon as React.ElementType;

  return (
    <motion.div 
      variants={itemVars}
      layout
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 space-y-4"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider
            ${record.tipe === 'masuk'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
            {record.tipe === 'masuk' ? 'MASUK' : 'PULANG'}
          </span>
          <p className="text-slate-400 text-xs font-medium">{record.tanggalAbsen}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${status.bg}`}>
          {StatusIcon && typeof StatusIcon !== 'string' ? (
            <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
          ) : null}
          <span className={`text-[10px] font-bold tracking-wide uppercase ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Time & Location */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-white text-base font-bold font-mono">
            {record.waktuAbsen}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 text-xs font-mono">
            {record.latitude.toFixed(3)}, {record.longitude.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Photo toggle */}
      <button
        onClick={() => setShowPhoto(!showPhoto)}
        className="flex items-center gap-2 text-slate-400 text-xs font-medium hover:text-white transition-colors"
      >
        <Camera className="w-4 h-4" />
        {showPhoto ? 'Sembunyikan foto' : 'Lihat foto bukti'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showPhoto ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {showPhoto && record.fotoUrl && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="rounded-[1rem] overflow-hidden"
          >
            <Image
              src={record.fotoUrl}
              alt="Foto absensi dengan watermark"
              width={600}
              height={450}
              className="w-full object-cover max-h-60 mt-1"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div 
      className="min-h-[100dvh] text-white pb-24"
      style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}
    >
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="px-5 pt-safe pt-8 pb-4"
      >
        <h1 className="text-white text-2xl font-bold">Riwayat Absensi</h1>
        <p className="text-slate-400 text-sm mt-1">Rekap kehadiran Anda</p>
      </motion.header>

      {/* Month filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 24 }}
        className="px-5 pb-4"
      >
        <div className="relative">
          <select
            id="month-filter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i} className="text-slate-900">{m} {new Date().getFullYear()}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
      </motion.div>

      {/* Summary stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
        className="px-5 pb-6 grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Total Hadir', value: sortedDates.length, color: 'text-white' },
          { label: 'Masuk', value: filteredRecords.filter(r => r.tipe === 'masuk').length, color: 'text-blue-400' },
          { label: 'Pulang', value: filteredRecords.filter(r => r.tipe === 'pulang').length, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] text-center py-4 flex flex-col items-center justify-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mt-1">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Records */}
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="px-5 space-y-6"
      >
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Belum ada data absensi di bulan ini</p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <motion.div variants={itemVars} key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">{date}</p>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-3">
                {grouped[date].map((record) => (
                  <AttendanceCard key={`${record.id}-${record.tipe}`} record={record} />
                ))}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
