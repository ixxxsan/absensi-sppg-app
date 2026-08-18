'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, CheckSquare, FileSpreadsheet,
  LogOut, ChevronLeft, Calendar
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/relawan',   icon: Users,            label: 'Manajemen Relawan' },
  { href: '/admin/absensi',  icon: CheckSquare,       label: 'Validasi Absensi' },
  { href: '/admin/cuti',     icon: Calendar,          label: 'Persetujuan Cuti' },
  { href: '/admin/laporan',  icon: FileSpreadsheet,   label: 'Laporan & Export' },
];

const APP_NAME = 'SPPG\nTELUKNAGA';

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === '/admin/login') {
    return null;
  }

  const handleLogout = async () => {
    await authClient.signOut();
    router.replace('/admin/login');
  };

  const displayUser = {
    namaLengkap: user.name || 'Admin',
    role: user.role || 'admin',
  };

  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col bg-white border-r border-slate-200/60 z-40 h-full flex-shrink-0"
    >
      {/* Logo Area */}
      <div className={`flex items-center gap-3 p-5 border-b border-slate-100 min-h-[88px] ${collapsed ? 'justify-center' : ''}`}>
        <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-emerald-500 shadow-sm">
          <Image src="/icons/icon-192.png" alt="Logo" fill className="object-cover" />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-[13px] font-bold text-slate-800 leading-tight">
                {APP_NAME}
              </h1>
              <p className="text-[9px] font-semibold text-slate-400 mt-0.5 tracking-wider uppercase">
                Panel Manajemen
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto flex flex-col gap-1.5 scrollbar-hide">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${collapsed ? 'justify-center' : ''}
                ${isActive 
                  ? 'text-emerald-700 font-semibold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
                }
              `}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-emerald-50/80 rounded-xl border border-emerald-100/50"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[13px] relative z-10 whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-100">
        <div className={`flex items-center gap-3 mb-2 px-2 ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden"
            >
              <p className="text-[13px] font-semibold text-slate-800 truncate">
                {displayUser.namaLengkap}
              </p>
              <p className="text-[10px] font-medium text-slate-400 capitalize truncate">
                {displayUser.role.replace('_', ' ')}
              </p>
            </motion.div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          title={collapsed ? 'Keluar' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group active:scale-95
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
              >
                Keluar
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-9 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-colors z-50 active:scale-90"
      >
        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.div>
      </button>
    </motion.aside>
  );
}
