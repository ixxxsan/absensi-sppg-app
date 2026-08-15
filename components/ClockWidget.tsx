'use client';

import { useState, useEffect } from 'react';
import { nowWIB, formatDateLong } from '@/lib/utils';

export default function ClockWidget() {
  const [time, setTime] = useState({ h: '00', m: '00', s: '00', date: '' });

  useEffect(() => {
    const update = () => {
      const now = nowWIB();
      setTime({
        h: now.format('HH'),
        m: now.format('mm'),
        s: now.format('ss'),
        date: formatDateLong(now),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Date */}
      <p style={{ color: 'rgba(181,224,234,0.7)' }} className="text-sm font-medium tracking-wide">
        {time.date}
      </p>

      {/* Clock */}
      <div className="flex items-end gap-1">
        <div className="flex items-baseline gap-0.5">
          {/* Hours */}
          <div className="font-mono-clock text-6xl font-bold text-white leading-none tabular-nums">
            {time.h}
          </div>
          <span className="font-mono-clock text-4xl font-bold leading-none mb-1"
                style={{ color: '#b5e0ea' }}>:</span>
          {/* Minutes */}
          <div className="font-mono-clock text-6xl font-bold text-white leading-none tabular-nums">
            {time.m}
          </div>
          <span className="font-mono-clock text-2xl font-bold leading-none mb-1"
                style={{ color: 'rgba(181,224,234,0.5)' }}>:</span>
          {/* Seconds */}
          <div className="font-mono-clock text-2xl font-bold leading-none mb-0.5 tabular-nums"
               style={{ color: 'rgba(181,224,234,0.7)' }}>
            {time.s}
          </div>
        </div>

        {/* WIB Badge */}
        <span className="ml-2 mb-1 px-2 py-0.5 rounded-md text-xs font-bold tracking-widest"
              style={{
                background: 'rgba(181,224,234,0.15)',
                color: '#b5e0ea',
                border: '1px solid rgba(181,224,234,0.3)',
              }}>
          WIB
        </span>
      </div>
    </div>
  );
}
