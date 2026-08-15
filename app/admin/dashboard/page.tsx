'use client';

import { Users, UserCheck, UserX, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { formatDateLong } from '@/lib/utils';
import { nowWIB } from '@/lib/utils';

// Mock data — replace with real API fetches
const MOCK_KPI = {
  totalRelawan: 120,
  hadirHariIni: 98,
  tidakHadir: 22,
  persentase: 81.7,
};

const MOCK_RECENT: Array<{
  id: number; idRelawan: string; nama: string; waktu: string;
  tipe: 'masuk' | 'pulang'; status: 'valid' | 'invalid'; lokasi: string;
}> = [
  { id: 1, idRelawan: 'SPPG-001', nama: 'Budi Santoso', waktu: '08:15 WIB', tipe: 'masuk', status: 'valid', lokasi: '-6.208, 106.845' },
  { id: 2, idRelawan: 'SPPG-002', nama: 'Siti Rahayu', waktu: '08:22 WIB', tipe: 'masuk', status: 'invalid', lokasi: '-6.209, 106.846' },
  { id: 3, idRelawan: 'SPPG-003', nama: 'Ahmad Yani', waktu: '08:30 WIB', tipe: 'masuk', status: 'valid', lokasi: '-6.207, 106.847' },
  { id: 4, idRelawan: 'SPPG-001', nama: 'Budi Santoso', waktu: '17:05 WIB', tipe: 'pulang', status: 'valid', lokasi: '-6.208, 106.845' },
  { id: 5, idRelawan: 'SPPG-004', nama: 'Dewi Lestari', waktu: '08:45 WIB', tipe: 'masuk', status: 'invalid', lokasi: '-6.300, 106.900' },
];

const MOCK_CHART = [78, 85, 90, 82, 88, 95, 81.7];
const CHART_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Hari ini'];

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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <span className="text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className={`text-3xl font-bold ${color} leading-tight`}>{value}</p>
      <p className="text-slate-500 text-sm mt-1 font-medium">{title}</p>
    </div>
  );
}

const statusIcon = {
  valid: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  invalid: <XCircle className="w-4 h-4 text-red-500" />,
};
const statusLabel = {
  valid: 'text-emerald-700 bg-emerald-50',
  invalid: 'text-red-700 bg-red-50',
};

export default function AdminDashboard() {
  const today = formatDateLong(nowWIB());
  const maxBar = Math.max(...MOCK_CHART);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 text-sm font-semibold">Live</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Relawan"
          value={MOCK_KPI.totalRelawan}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          color="text-slate-800"
          bgColor="bg-blue-50"
        />
        <KPICard
          title="Hadir Hari Ini"
          value={MOCK_KPI.hadirHariIni}
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          trend="↑ +3"
        />
        <KPICard
          title="Tidak Hadir"
          value={MOCK_KPI.tidakHadir}
          icon={<UserX className="w-5 h-5 text-red-500" />}
          color="text-red-500"
          bgColor="bg-red-50"
        />
        <KPICard
          title="Kehadiran"
          value={`${MOCK_KPI.persentase}%`}
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
          trend="↑ 2.1%"
        />
      </div>

      {/* Chart + Recent Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-700 font-semibold text-sm">Kehadiran 7 Hari</h2>
            <span className="text-slate-400 text-xs">% hadir</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {MOCK_CHART.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-400">{val}%</span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500
                    ${i === MOCK_CHART.length - 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  style={{ height: `${(val / maxBar) * 100}%`, minHeight: 4 }}
                />
                <span className="text-[9px] text-slate-400">{CHART_DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Absensi Hari Ini Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-slate-700 font-semibold text-sm">Absensi Hari Ini</h2>
            <span className="text-slate-400 text-xs">{MOCK_RECENT.length} entri</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Waktu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tipe</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_RECENT.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.idRelawan}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {row.nama.charAt(0)}
                        </div>
                        <span className="text-slate-700 font-medium text-sm">{row.nama}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-xs">{row.waktu}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${row.tipe === 'masuk' ? 'text-blue-700 bg-blue-50' : 'text-amber-700 bg-amber-50'}`}>
                        {row.tipe === 'masuk' ? 'Masuk' : 'Pulang'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${statusLabel[row.status]}`}>
                        {statusIcon[row.status]}
                        {row.status === 'valid' ? 'Valid' : 'Ditolak'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        id={`view-absen-${row.id}`}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Lihat detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
