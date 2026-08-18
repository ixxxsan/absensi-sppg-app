'use client';

import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, TrendingUp, Clock, CheckCircle, XCircle, Eye, CheckSquare } from 'lucide-react';
import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: string;
}

function KPICard({ title, value, icon, color, bgColor, trend }: KPICardProps) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] border border-slate-200/50 flex flex-col justify-between"
    >
      <div className="flex items-start justify-between mb-8">
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <span className="text-emerald-700 text-xs font-bold tracking-wide bg-emerald-50 px-2.5 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className={`text-4xl sm:text-5xl font-bold tracking-tighter ${color} leading-none mb-3`}>{value}</p>
        <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">{title}</p>
      </div>
    </motion.div>
  );
}

const statusIcon = {
  valid: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  invalid: <XCircle className="w-4 h-4 text-red-500" />,
};
const statusLabel = {
  valid: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  invalid: 'text-red-700 bg-red-50 border-red-100',
};

export interface DashboardAbsensi {
  id: string;
  userId: string;
  waktuAbsen: string;
  tipe: string | null;
  statusValidasi: string | null;
  namaLengkap: string | null;
  idRelawan: string | null;
}

interface DashboardClientProps {
  totalRelawan: number;
  uniqueUsersToday: number;
  tidakHadir: number;
  persentase: number;
  recentAbsensi: DashboardAbsensi[];
  chartData: number[];
  chartDaysStr: string[];
  maxBar: number;
}

export default function DashboardClient({
  totalRelawan,
  uniqueUsersToday,
  tidakHadir,
  persentase,
  recentAbsensi,
  chartData,
  chartDaysStr,
  maxBar
}: DashboardClientProps) {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Relawan"
          value={totalRelawan}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="text-slate-800"
          bgColor="bg-blue-50"
        />
        <KPICard
          title="Hadir Hari Ini"
          value={uniqueUsersToday}
          icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          trend="Live"
        />
        <KPICard
          title="Tidak Hadir"
          value={tidakHadir}
          icon={<UserX className="w-6 h-6 text-red-500" />}
          color="text-red-500"
          bgColor="bg-red-50"
        />
        <KPICard
          title="Tingkat Hadir"
          value={`${persentase}%`}
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Chart & Table */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Bar Chart */}
        <motion.div 
          variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
          className="xl:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] border border-slate-200/50 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-slate-800 font-bold text-lg tracking-tight">Tren 7 Hari</h2>
            <span className="text-slate-400 font-semibold text-xs tracking-wider uppercase bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">% hadir</span>
          </div>
          <div className="flex items-end justify-between flex-1 gap-2 pt-4">
            {chartData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">{val}%</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((val / maxBar) * 100, 4)}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 + i * 0.05 }}
                  className={`w-full rounded-full transition-colors duration-300
                    ${i === chartData.length - 1 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}
                />
                <span className={`text-[10px] font-semibold mt-1 ${i === chartData.length - 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {i === chartData.length - 1 ? 'HARI INI' : chartDaysStr[i].substring(0,3).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Absensi Hari Ini Table */}
        <motion.div 
          variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
          className="xl:col-span-3 bg-white rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] border border-slate-200/50 overflow-hidden flex flex-col"
        >
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-xl">
            <h2 className="text-slate-800 font-bold text-lg tracking-tight">Aktivitas Terkini</h2>
            <span className="text-slate-500 font-medium text-sm bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{recentAbsensi.length} entri</span>
          </div>
          <div className="overflow-x-auto p-4 flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Waktu</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipe</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {recentAbsensi.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                          <CheckSquare className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">Belum ada absensi hari ini</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentAbsensi.map((row, i) => (
                    <motion.tr 
                      key={row.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                      className="hover:bg-slate-50/60 transition-colors group cursor-default"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200/50">
                            {row.namaLengkap?.charAt(0) || '?'}
                          </div>
                          <div>
                            <span className="text-slate-800 font-semibold text-sm block leading-tight">{row.namaLengkap}</span>
                            <span className="text-slate-400 font-mono text-[10px] mt-0.5 block tracking-wide">{row.idRelawan}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-[13px] font-medium">{row.waktuAbsen}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full border
                          ${row.tipe === 'masuk' ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
                          {row.tipe === 'masuk' ? 'MASUK' : 'PULANG'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border ${row.statusValidasi === 'valid' ? statusLabel.valid : statusLabel.invalid}`}>
                          {row.statusValidasi === 'valid' ? statusIcon.valid : statusIcon.invalid}
                          {row.statusValidasi === 'valid' ? 'VALID' : 'DITOLAK'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-auto opacity-0 group-hover:opacity-100"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
