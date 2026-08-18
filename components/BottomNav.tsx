'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, User, CalendarRange } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/beranda', icon: Home, label: 'Beranda' },
  { href: '/riwayat', icon: ClipboardList, label: 'Riwayat' },
  { href: '/cuti', icon: CalendarRange, label: 'Cuti' },
  { href: '/profil', icon: User, label: 'Profil' },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/kamera') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 h-14 outline-none"
              aria-label={item.label}
            >
              <motion.div 
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 z-10"
              >
                <Icon
                  className="w-[22px] h-[22px] transition-colors duration-300"
                  style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span 
                  className="text-[10px] font-medium tracking-wide transition-colors duration-300"
                  style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
                >
                  {item.label}
                </span>
              </motion.div>

              {/* Active Tab Indicator (Blob) */}
              {isActive && (
                <motion.div
                  layoutId="activeNavRelawan"
                  className="absolute inset-0 bg-white/10 rounded-2xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              {/* Subtle Dot under text for extra emphasis (optional) */}
              {isActive && (
                <motion.div 
                  layoutId="activeDotRelawan"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#b5e0ea]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
