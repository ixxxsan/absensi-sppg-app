'use client';

/**
 * L5: Global Error Boundary — catches unhandled errors in the root layout.
 * This file MUST export a default component and use 'use client'.
 * It replaces the entire HTML document when triggered.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)',
          color: '#fff',
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2rem',
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Terjadi Kesalahan
          </h1>
          <p style={{ color: 'rgba(181,224,234,0.6)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
          </p>
          {error?.digest && (
            <p style={{ color: 'rgba(181,224,234,0.3)', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '1rem' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.875rem 2rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
