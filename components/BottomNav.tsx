'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, User, CalendarRange } from 'lucide-react';

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
    <nav className="bottom-nav">
      <div className="flex items-end justify-around px-4 pt-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-4 group"
              aria-label={item.label}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                   style={{ background: isActive ? 'rgba(181,224,234,0.15)' : 'transparent' }}>
                <Icon
                  className="w-5 h-5 transition-colors duration-200"
                  style={{ color: isActive ? '#ffffff' : 'rgba(181,224,234,0.4)' }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className="text-[10px] font-medium tracking-wide transition-colors duration-200"
                    style={{ color: isActive ? '#ffffff' : 'rgba(181,224,234,0.4)' }}>
                {item.label}
              </span>
              {/* Active dot */}
              {isActive && (
                <span className="w-1 h-1 rounded-full -mt-0.5"
                      style={{ background: '#b5e0ea' }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
