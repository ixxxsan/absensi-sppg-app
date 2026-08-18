import { getServerSession } from '@/lib/auth-server';
import AdminSidebar from './AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // We can't rely completely on middleware for role check since middleware 
  // might not have full db access if we ever need it, but getServerSession does.
  // Actually, getServerSession fetches the session securely.
  const session = await getServerSession();

  // Basic check for admin role
  const isAdmin = session?.user && (session.user.role === 'admin' || session.user.role === 'super_admin');

  if (!isAdmin) {
    return (
      <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f9fafb]">
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    );
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
