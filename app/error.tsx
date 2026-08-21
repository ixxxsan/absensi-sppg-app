'use client';

import { useEffect } from 'react';

/**
 * L5: Route-level Error Boundary — catches errors in nested routes.
 * Unlike global-error.tsx, this one renders WITHIN the root layout
 * so it has access to CSS and shared layout components.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center text-white px-6"
      style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}
    >
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6 text-3xl">
          ⚠️
        </div>
        <h1 className="text-2xl font-extrabold mb-3">Terjadi Kesalahan</h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(181,224,234,0.6)' }}>
          Halaman ini mengalami error. Coba muat ulang atau kembali ke beranda.
        </p>
        {error?.digest && (
          <p className="text-xs font-mono mb-4" style={{ color: 'rgba(181,224,234,0.3)' }}>
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors"
          >
            Coba Lagi
          </button>
          <a
            href="/beranda"
            className="w-full py-3.5 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-center hover:bg-white/10 transition-colors"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
