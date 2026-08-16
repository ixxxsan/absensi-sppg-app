'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check if dismissed before
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (iOS) setIsIOS(true);

    if (iOS) {
      // Show iOS manual instructions after 3s
      setTimeout(() => setShowBanner(true), 3000);
    } else {
      // Android/Desktop: wait for beforeinstallprompt event
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setShowBanner(true), 3000);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-fade-in-up">
      <div className="glass rounded-2xl p-4 border border-emerald-500/20 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-emerald-400" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className="text-white text-sm font-semibold leading-tight">
              Simpan ke Layar Utama
            </p>
            {isIOS ? (
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Tekan ikon <strong className="text-white">Bagikan</strong> (⎙) lalu pilih{' '}
                <strong className="text-white">&quot;Add to Home Screen&quot;</strong> untuk akses cepat
              </p>
            ) : (
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Pasang aplikasi ini di HP untuk akses lebih cepat tanpa buka browser
              </p>
            )}

            {/* Install button (Android only) */}
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                id="pwa-install-btn"
                className="mt-3 px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold
                           hover:bg-emerald-400 transition-colors duration-200"
              >
                Pasang Sekarang
              </button>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            id="pwa-dismiss-btn"
            aria-label="Tutup notifikasi"
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
