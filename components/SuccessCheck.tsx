'use client';

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

interface SuccessCheckProps { size?: number; }

export default function SuccessCheck({ size = 80 }: SuccessCheckProps) {
  const svgCircleRef = useRef<SVGCircleElement>(null);
  const checkRef = useRef<SVGPolylineElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (checkRef.current) checkRef.current.style.strokeDashoffset = '0';
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const c = (size + 32) / 2;

  return (
    <div className="flex items-center justify-center animate-scale-in">
      <div className="relative" style={{ width: size + 32, height: size + 32 }}>
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full animate-ping"
             style={{ background: 'rgba(181,224,234,0.15)', animationDuration: '1.5s' }} />
        <div className="absolute inset-2 rounded-full"
             style={{ background: 'rgba(181,224,234,0.08)' }} />

        <svg viewBox={`0 0 ${size + 32} ${size + 32}`}
             className="absolute inset-0"
             style={{ width: size + 32, height: size + 32 }}>
          {/* Background ring */}
          <circle cx={c} cy={c} r={radius} fill="none"
                  stroke="rgba(181,224,234,0.18)" strokeWidth="3" />
          {/* Animated ring */}
          <circle ref={svgCircleRef}
                  cx={c} cy={c} r={radius} fill="none"
                  stroke="#b5e0ea" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  style={{
                    strokeDashoffset: 0,
                    transition: 'stroke-dashoffset 0.6s ease-out',
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                  }} />
          {/* Check mark */}
          <polyline ref={checkRef}
                    points={`${c - radius * 0.38},${c} ${c - radius * 0.05},${c + radius * 0.38} ${c + radius * 0.45},${c - radius * 0.3}`}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 200,
                      strokeDashoffset: 200,
                      transition: 'stroke-dashoffset 0.5s ease-out 0.6s',
                    }} />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center opacity-0">
          <Check className="text-white" size={size * 0.5} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}
