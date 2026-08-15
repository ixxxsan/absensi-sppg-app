'use client';

import { type AbsensiStatus } from '@/lib/stores';

interface StatusBadgeProps {
  status: AbsensiStatus;
  className?: string;
}

const statusConfig = {
  belum: {
    className: 'badge-belum',
    dot: 'bg-amber-400',
    label: 'Belum Absen',
  },
  masuk: {
    className: 'badge-masuk',
    dot: 'bg-blue-400',
    label: 'Sudah Absen Masuk',
  },
  lengkap: {
    className: 'badge-lengkap',
    dot: 'bg-emerald-400',
    label: 'Absensi Lengkap',
  },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`${config.className} ${className}`}>
      {/* Animated dot */}
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
}
