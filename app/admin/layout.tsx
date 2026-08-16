'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, CheckSquare, FileSpreadsheet,
  LogOut, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/relawan',   icon: Users,            label: 'Manajemen Relawan' },
  { href: '/admin/absensi',  icon: CheckSquare,       label: 'Validasi Absensi' },
  { href: '/admin/cuti',     icon: Calendar,          label: 'Persetujuan Cuti' },
  { href: '/admin/laporan',  icon: FileSpreadsheet,   label: 'Laporan & Export' },
];

const APP_NAME = 'SPPG TANGERANG\nTELUKNAGA 03';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* ── Auth guard ── */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
    if (!isAdmin && pathname !== '/admin/login') {
      router.replace('/admin/login');
    } else if (isAdmin && pathname === '/admin/login') {
      router.replace('/admin/dashboard');
    }
  }, [user, router, pathname, mounted]);

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  /* While checking auth, show a loading state */
  if (!mounted) return null;

  // Mock user for testing if none is present
  const displayUser = user || { namaLengkap: 'Demo Admin', role: 'super_admin' };

  const sidebarW = collapsed ? 64 : 240;
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
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

      {/* ── Sidebar (fixed) ── */}
      <aside
        style={{
          position: 'fixed',
          left: 0, top: 0,
          width: sidebarW,
          height: '100%',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          background: '#071e49',
          transition: 'width 0.3s ease',
          overflow: 'visible',
        }}
      >
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '20px 16px',
          borderBottom: '1px solid rgba(181,224,234,0.1)',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 80,
        }}>
          {/* Icon / Logo */}
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            overflow: 'hidden',
            flexShrink: 0,
            border: 'none',
            position: 'relative',
          }}>
            <Image src="/icons/icon-192.png" alt="Logo" fill
                 style={{ objectFit: 'cover' }} />
          </div>

          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, lineHeight: 1.2,
                          whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                {APP_NAME}
              </p>
              <p style={{ color: 'rgba(181,224,234,0.45)', fontSize: 9, marginTop: 2 }}>
                Panel Manajemen
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} title={collapsed ? label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: collapsed ? 0 : 12,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      padding: '10px 12px',
                      borderRadius: 12,
                      textDecoration: 'none',
                      transition: 'all 0.15s',
                      background: isActive ? 'rgba(181,224,234,0.12)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(181,224,234,0.25)' : 'transparent'}`,
                      color: isActive ? '#b5e0ea' : 'rgba(181,224,234,0.45)',
                    }}>
                <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                {!collapsed && (
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden',
                                 textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#b5e0ea', flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(181,224,234,0.1)' }}>
          {!collapsed && (
            <div style={{ padding: '4px 12px 8px' }}>
              <p style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayUser.namaLengkap}
              </p>
              <p style={{ color: 'rgba(181,224,234,0.4)', fontSize: 10 }}>
                {displayUser.role === 'super_admin' ? 'Super Admin' : 'Koordinator'}
              </p>
            </div>
          )}
          <button onClick={handleLogout} id="admin-logout-btn"
                  title={collapsed ? 'Keluar' : undefined}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : 12,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    width: '100%', padding: '10px 12px',
                    borderRadius: 12, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    color: 'rgba(181,224,234,0.45)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget).style.background = 'rgba(248,113,113,0.1)';
                    (e.currentTarget).style.color = '#f87171';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget).style.background = 'transparent';
                    (e.currentTarget).style.color = 'rgba(181,224,234,0.45)';
                  }}>
            <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Keluar</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)} id="sidebar-collapse-btn"
                aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
                style={{
                  position: 'absolute', right: -12, top: 88,
                  width: 24, height: 24, borderRadius: 9999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#0c2860',
                  border: '1px solid rgba(181,224,234,0.25)',
                  color: '#b5e0ea', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
          {collapsed
            ? <ChevronRight style={{ width: 12, height: 12 }} />
            : <ChevronLeft  style={{ width: 12, height: 12 }} />}
        </button>
      </aside>

      {/* ── Main content — pushed right by sidebar width ── */}
      <main style={{
        marginLeft: sidebarW,
        flex: 1,
        overflowY: 'auto',
        background: '#F8FAFC',
        transition: 'margin-left 0.3s ease',
        minWidth: 0,
      }}>
        {children}
      </main>
    </div>
  );
}
