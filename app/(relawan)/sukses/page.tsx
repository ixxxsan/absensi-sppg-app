'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, User, XCircle } from 'lucide-react';
import SuccessCheck from '@/components/SuccessCheck';
import { useAbsensiStore, useAuthStore } from '@/lib/stores';

const REDIRECT_DELAY = 5; // seconds

export default function SuksesPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const { statusHariIni, absenMasukToday, absenPulangToday } = useAbsensiStore();
  const { user } = useAuthStore();

  // Determine which record to show
  const lastRecord = statusHariIni === 'lengkap' ? absenPulangToday : absenMasukToday;
  const tipeLabel = statusHariIni === 'lengkap' ? 'Absen Pulang' : 'Absen Masuk';
  const isLengkap = statusHariIni === 'lengkap';
  const isDitolak = lastRecord?.statusValidasi === 'ditolak';

  // Auto-redirect countdown
  useEffect(() => {
    if (isDitolak) return; // Don't auto-redirect if rejected

    if (countdown <= 0) {
      router.replace('/beranda');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router, isDitolak]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-5 py-8 pt-safe"
         style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}>
      {/* ── Top spacer ── */}
      <div />

      {/* ── Success content ── */}
      <div className="flex flex-col items-center gap-6 w-full animate-fade-in-up">
        {/* Animated check / cross */}
        {isDitolak ? (
          <div className="w-24 h-24 rounded-full flex items-center justify-center animate-scale-in"
               style={{ background: 'rgba(248,113,113,0.1)', border: '2px solid #f87171' }}>
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        ) : (
          <SuccessCheck size={90} />
        )}

        {/* Title */}
        <div className="text-center px-4">
          <h1 className="text-white text-3xl font-bold">
            {isDitolak ? 'Absensi Ditolak!' : 'Absensi Berhasil!'}
          </h1>
          <p className="text-sm font-medium mt-2 leading-relaxed"
             style={{ color: isDitolak ? '#f87171' : '#b5e0ea' }}>
            {isDitolak
              ? 'Anda berada di luar radius 500m dari titik tugas. Silakan mendekat dan ulangi absensi.'
              : (isLengkap ? 'Absensi hari ini sudah lengkap' : `${tipeLabel} tercatat`)
            }
          </p>
        </div>

        {/* Record Card */}
        {lastRecord && (
          <div className="w-full rounded-2xl p-5 space-y-3 stagger-2 animate-fade-in-up"
               style={{
                 animationDelay: '0.3s',
                 background: 'rgba(12,40,96,0.6)',
                 border: '1px solid rgba(181,224,234,0.18)',
                 backdropFilter: 'blur(12px)',
               }}>
            {/* Tipe Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={lastRecord.tipe === 'masuk' ? {
                      background: 'rgba(181,224,234,0.15)',
                      color: '#b5e0ea',
                      border: '1px solid rgba(181,224,234,0.3)',
                    } : {
                      background: 'rgba(251,191,36,0.15)',
                      color: '#fde68a',
                      border: '1px solid rgba(251,191,36,0.3)',
                    }}>
                {lastRecord.tipe === 'masuk' ? '● ABSEN MASUK' : '● ABSEN PULANG'}
              </span>
              <span className="text-xs font-semibold" style={{ color: isDitolak ? '#f87171' : '#b5e0ea' }}>
                {isDitolak ? 'TIDAK VALID' : 'TERVERIFIKASI'}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(7,30,73,0.8)' }}>
                  <User className="w-4 h-4" style={{ color: 'rgba(181,224,234,0.5)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(181,224,234,0.5)' }}>Nama Relawan</p>
                  <p className="text-white text-sm font-semibold">{user?.namaLengkap}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(7,30,73,0.8)' }}>
                  <Clock className="w-4 h-4" style={{ color: 'rgba(181,224,234,0.5)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(181,224,234,0.5)' }}>Waktu Absen</p>
                  <p className="text-white text-sm font-semibold font-mono-clock">{lastRecord.waktuAbsen}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(7,30,73,0.8)' }}>
                  <MapPin className="w-4 h-4" style={{ color: 'rgba(181,224,234,0.5)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(181,224,234,0.5)' }}>Koordinat GPS</p>
                  <p className="text-white text-sm font-semibold font-mono-clock">
                    {lastRecord.latitude.toFixed(4)}, {lastRecord.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            {/* Photo thumbnail */}
            {lastRecord.fotoUrl && (
              <div className="mt-2 rounded-xl overflow-hidden h-24">
                <img
                  src={lastRecord.fotoUrl}
                  alt="Foto absensi"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom actions ── */}
      <div className="w-full space-y-3">
        {!isDitolak && (
          <>
            {/* Progress bar countdown */}
            <div className="text-center mb-1">
              <p className="text-xs" style={{ color: 'rgba(181,224,234,0.4)' }}>Kembali otomatis dalam {countdown} detik</p>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden"
                 style={{ background: 'rgba(181,224,234,0.12)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / REDIRECT_DELAY) * 100}%`, background: '#b5e0ea' }}
              />
            </div>
          </>
        )}

        <button
          id="btn-kembali-beranda"
          onClick={() => isDitolak ? router.replace('/kamera') : router.replace('/beranda')}
          className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
          style={isDitolak ? {
            background: '#f87171', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(248,113,113,0.3)'
          } : {
            background: '#FFFFFF', color: '#071e49', boxShadow: '0 4px 20px rgba(255,255,255,0.2)'
          }}
        >
          {isDitolak ? 'Ulangi Absen Sekarang' : (
            <>
              <ArrowLeft className="w-5 h-5" />
              Kembali ke Beranda
            </>
          )}
        </button>
      </div>
    </div>
  );
}
