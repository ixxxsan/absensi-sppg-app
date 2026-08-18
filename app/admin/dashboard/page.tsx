import { Suspense } from 'react';
import { formatDateLong, nowWIB } from '@/lib/utils';
import { db } from '@/lib/db';
import { user, absensi } from '@/lib/db/schema';
import { eq, count, desc, inArray } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

// --- SKELETON COMPONENT ---
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* KPI Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/50 rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] border border-slate-200/50 flex flex-col justify-between h-40">
            <div className="w-12 h-12 rounded-2xl bg-slate-100" />
            <div>
              <div className="w-16 h-10 bg-slate-100 rounded-md mt-2" />
              <div className="w-24 h-4 bg-slate-50 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart & Table Skeletons */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 bg-white/50 rounded-[2.5rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] border border-slate-200/50 h-[300px]" />
        <div className="xl:col-span-3 bg-white/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] border border-slate-200/50 h-[300px]" />
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

  // Fetch 7 days data with a single query using IN array
  const allWeeklyData = await db.select({ userId: absensi.userId, tanggalAbsen: absensi.tanggalAbsen })
    .from(absensi)
    .where(inArray(absensi.tanggalAbsen, dateStrs));

  const chartData = dateStrs.map(dateStr => {
    const dayAbsensi = allWeeklyData.filter(a => a.tanggalAbsen === dateStr);
    const uniqueUsersDay = new Set(dayAbsensi.map(a => a.userId)).size;
    return totalRelawan === 0 ? 0 : Math.round((uniqueUsersDay / totalRelawan) * 100);
  });

  const maxBar = Math.max(...chartData) || 1;

  return (
    <DashboardClient 
      totalRelawan={totalRelawan}
      uniqueUsersToday={uniqueUsersToday}
      tidakHadir={tidakHadir}
      persentase={persentase}
      recentAbsensi={recentAbsensi}
      chartData={chartData}
      chartDaysStr={chartDaysStr}
      maxBar={maxBar}
    />
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
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
      {/* Header (Renders instantly) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-800 text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">{today}</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm self-start sm:self-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-emerald-700 text-xs font-bold tracking-wide uppercase">System Live</span>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
