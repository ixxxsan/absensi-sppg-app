import { Suspense } from 'react';
import ClientRelawan from './ClientRelawan';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function TableSkeleton() {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="w-32 h-10 bg-slate-100 rounded-xl" />
          <div className="w-40 h-10 bg-emerald-100/50 rounded-xl" />
        </div>
      </div>

      {/* Search + Filter Skeleton */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
        <div className="h-10 w-40 bg-slate-100 rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[400px] p-4">
        <div className="w-full h-12 bg-slate-50 rounded-lg mb-4" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full h-14 bg-slate-50/50 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function RelawanDataFetcher() {
  const relawans = await db.select().from(user).where(eq(user.role, 'relawan')).orderBy(asc(user.createdAt));
  return <ClientRelawan initialData={relawans} />;
}

export default async function RelawanPage() {
  // Server-side auth guard — prevent unauthorized access to relawan data
  const session = await getServerSession();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect('/admin/login');
  }

  return (
    <Suspense fallback={<TableSkeleton />}>
      <RelawanDataFetcher />
    </Suspense>
  );
}
