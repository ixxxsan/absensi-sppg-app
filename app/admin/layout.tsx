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

  // If not admin, we rely on middleware to redirect from /admin/* except /admin/login.
  // However, layout wraps EVERYTHING in /admin, including /admin/login.
  // Wait, if we redirect here, we might cause an infinite loop for /admin/login if we aren't careful.
  // Next.js layouts don't know the pathname easily in Server Components unless we use headers.
  // Instead, the middleware handles /admin/login vs /admin/dashboard.
  // We can just pass the user to the sidebar if they exist.
  // Wait, if it's the login page, we don't want the sidebar.
  // A better way is to move layout.tsx INTO an (admin-protected) route group, or check if user exists.
  // If no user is present, we only render children (assuming it's the login page).
  
  if (!isAdmin) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>
      <AdminSidebar user={session.user} />
      
      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: '#F8FAFC',
        minWidth: 0,
      }}>
        {children}
      </main>
    </div>
  );
}
