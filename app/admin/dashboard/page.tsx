import { Suspense } from 'react';
import { Users, UserCheck, UserX, TrendingUp, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { formatDateLong, nowWIB } from '@/lib/utils';
import { db } from '@/lib/db';
import { user, absensi } from '@/lib/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

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

// --- SKELETON COMPONENT ---
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/50 rounded-2xl p-5 shadow-sm border border-slate-100 h-32 flex flex-col justify-between">
            <div className="w-11 h-11 rounded-xl bg-slate-100" />
            <div>
              <div className="w-16 h-8 bg-slate-100 rounded mt-2" />
              <div className="w-24 h-4 bg-slate-50 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart & Table Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white/50 rounded-2xl p-5 shadow-sm border border-slate-100 h-64" />
        <div className="lg:col-span-3 bg-white/50 rounded-2xl shadow-sm border border-slate-100 h-64" />
      </div>
    </div>
  );
}

// --- ASYNC DATA COMPONENT ---
async function DashboardContent() {
  const todayDate = nowWIB().format('YYYY-MM-DD');

  // Fetch totalRelawan and todayAbsensi in PARALLEL
  const [result, todayAbsensi] = await Promise.all([
    db.select({ value: count() }).from(user).where(eq(user.role, 'relawan')),
    db.select({
        id: absensi.id,
        userId: absensi.userId,
        waktuAbsen: absensi.waktuAbsen,
        tipe: absensi.tipe,
        statusValidasi: absensi.statusValidasi,
        namaLengkap: user.name,
        idRelawan: user.idRelawan,
      })
      .from(absensi)
      .leftJoin(user, eq(absensi.userId, user.id))
      .where(eq(absensi.tanggalAbsen, todayDate))
      .orderBy(desc(absensi.id))
  ]);

  const totalRelawan = result[0].value;
  const uniqueUsersToday = new Set(todayAbsensi.map(a => a.userId)).size;
  const tidakHadir = totalRelawan - uniqueUsersToday;
  const persentase = totalRelawan === 0 ? 0 : Math.round((uniqueUsersToday / totalRelawan) * 100);

  const recentAbsensi = todayAbsensi.slice(0, 5);

  const daysIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const chartDaysStr: string[] = [];
  const dateStrs: string[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = nowWIB().subtract(i, 'day');
    chartDaysStr.push(i === 0 ? 'Hari ini' : daysIndo[d.day()]);
    dateStrs.push(d.format('YYYY-MM-DD'));
  }

  // Fetch 7 days in PARALLEL instead of sequentially
  const weeklyData = await Promise.all(
    dateStrs.map(dateStr => 
      db.select({ userId: absensi.userId })
        .from(absensi)
        .where(eq(absensi.tanggalAbsen, dateStr))
    )
  );

  const chartData = weeklyData.map(dayAbsensi => {
    const uniqueUsersDay = new Set(dayAbsensi.map(a => a.userId)).size;
    return totalRelawan === 0 ? 0 : Math.round((uniqueUsersDay / totalRelawan) * 100);
  });

  const maxBar = Math.max(...chartData) || 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Relawan"
          value={totalRelawan}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          color="text-slate-800"
          bgColor="bg-blue-50"
        />
        <KPICard
          title="Hadir Hari Ini"
          value={uniqueUsersToday}
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          trend="—"
        />
        <KPICard
          title="Tidak Hadir"
          value={tidakHadir}
          icon={<UserX className="w-5 h-5 text-red-500" />}
          color="text-red-500"
          bgColor="bg-red-50"
        />
        <KPICard
          title="Kehadiran"
          value={`${persentase}%`}
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
          trend="—"
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
            {chartData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-400">{val}%</span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500
                    ${i === chartData.length - 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  style={{ height: `${(val / maxBar) * 100}%`, minHeight: 4 }}
                />
                <span className="text-[9px] text-slate-400">{chartDaysStr[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Absensi Hari Ini Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-slate-700 font-semibold text-sm">Absensi Hari Ini</h2>
            <span className="text-slate-400 text-xs">{recentAbsensi.length} entri</span>
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
                {recentAbsensi.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                      Belum ada data absensi hari ini.
                    </td>
                  </tr>
                ) : (
                  recentAbsensi.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.idRelawan}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            {row.namaLengkap?.charAt(0) || '?'}
                          </div>
                          <span className="text-slate-700 font-medium text-sm">{row.namaLengkap}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="font-mono text-xs">{row.waktuAbsen}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                          ${row.tipe === 'masuk' ? 'text-blue-700 bg-blue-50' : 'text-amber-700 bg-amber-50'}`}>
                          {row.tipe === 'masuk' ? 'Masuk' : 'Pulang'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${row.statusValidasi === 'valid' ? statusLabel.valid : statusLabel.invalid}`}>
                          {row.statusValidasi === 'valid' ? statusIcon.valid : statusIcon.invalid}
                          {row.statusValidasi === 'valid' ? 'Valid' : 'Ditolak'}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PAGE COMPONENT ---
export default async function AdminDashboard() {
  // Server-side auth guard
  const session = await getServerSession();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    redirect('/admin/login');
  }

  const today = formatDateLong(nowWIB());

  return (
    <div className="p-6 space-y-6">
      {/* Header (Renders instantly) */}
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

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
