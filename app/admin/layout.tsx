import { getServerSession } from '@/lib/auth-server';
import AdminSidebar from './AdminSidebar';
import { isAdminRole } from '@/lib/utils';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const isAdmin = session?.user && isAdminRole(session.user.role);

  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';

  if (!isAdmin) {
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
      return (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f9fafb]">
          <main className="flex-1 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
      );
    }
    redirect('/admin/login');
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f9fafb]">
      <AdminSidebar user={session.user} />
      
      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
