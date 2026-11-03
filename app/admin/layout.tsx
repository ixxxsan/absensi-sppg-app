import { getServerSession } from '@/lib/auth-server';
import AdminSidebar from './AdminSidebar';
import { isAdminRole } from '@/lib/utils';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminSoundProvider } from '@/components/admin/AdminSoundProvider';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const isAdmin = session?.user && isAdminRole(session.user.role);

  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';

  if (!isAdmin) {
    // Only redirect if pathname is known to be a protected admin route (NOT /admin/login)
    // Never redirect if pathname is empty, /admin/login, or unknown to prevent ERR_TOO_MANY_REDIRECTS
    if (pathname && pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      redirect('/admin/login');
    }

    return (
      <AdminSoundProvider>
        <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f9fafb]">
          <main className="flex-1 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
      </AdminSoundProvider>
    );
  }

  return (
    <AdminSoundProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f9fafb] print:h-auto print:overflow-visible print:block print:bg-white">
        <AdminSidebar user={session.user} />
        
        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto min-w-0 print:h-auto print:overflow-visible print:block">
          {children}
        </main>
      </div>
    </AdminSoundProvider>
  );
}
