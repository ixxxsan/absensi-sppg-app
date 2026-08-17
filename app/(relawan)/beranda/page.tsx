'use client';

import { useRouter } from 'next/navigation';
import { Camera, MapPin, Clock, ChevronRight, LogIn, LogOut, Check, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import ClockWidget from '@/components/ClockWidget';
import StatusBadge from '@/components/StatusBadge';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import { useCameraStore, useAbsensiStore } from '@/lib/stores';
import { getGreeting } from '@/lib/utils';
import { getAbsensiHariIni } from '@/app/actions/absensi';
import { authClient } from '@/lib/auth-client';

export default function BerandaPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user as NonNullable<typeof session>['user'] & { idRelawan?: string } | undefined;
  const { setTipeAbsen } = useCameraStore();

  const [hasMasuk, setHasMasuk] = useState(false);
  const [isLengkap, setIsLengkap] = useState(false);
  type AbsensiData = Awaited<ReturnType<typeof getAbsensiHariIni>>;
  const [masukData, setMasukData] = useState<AbsensiData['masuk'] | null>(null);
  const [pulangData, setPulangData] = useState<AbsensiData['pulang'] | null>(null);

  useEffect(() => {
    async function fetchAbsensi() {
      try {
        const data = await getAbsensiHariIni();
        setHasMasuk(data.hasMasuk);
        setIsLengkap(data.isLengkap);
        setMasukData(data.masuk);
        setPulangData(data.pulang);

        // Sync to Zustand store for riwayat/sukses page
        if (data.masuk) {
          useAbsensiStore.getState().setAbsenMasuk({
            ...data.masuk,
            tipe: data.masuk.tipe as 'masuk' | 'pulang',
            latitude: Number(data.masuk.latitude),
            longitude: Number(data.masuk.longitude),
            statusValidasi: data.masuk.statusValidasi as 'valid' | 'invalid' | 'menunggu' | 'flagged' | 'ditolak'
          });
        }
        if (data.pulang) {
          useAbsensiStore.getState().setAbsenPulang({
            ...data.pulang,
            latitude: Number(data.pulang.latitude),
            longitude: Number(data.pulang.longitude),
            tipe: 'pulang',
            statusValidasi: data.pulang.statusValidasi as 'valid' | 'invalid' | 'menunggu' | 'flagged' | 'ditolak'
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchAbsensi();

    // Re-fetch when user returns to this tab (e.g., after absensi or navigation)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchAbsensi();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'Relawan';
  const greeting = getGreeting();

  const handleAbsenMasuk  = () => { setTipeAbsen('masuk');  router.push('/kamera'); };
  const handleAbsenPulang = () => { setTipeAbsen('pulang'); router.push('/kamera'); };

  const statusHariIni = isLengkap ? 'lengkap' : (hasMasuk ? 'masuk' : 'belum');
  const isMasukDitolak = false; // GPS auto-rejects before submission, so no rejected records in DB
  const isPulangDitolak = false;

  return (
    <div className="min-h-dvh flex flex-col"
         style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}>

      {/* ── Header ── */}
      <header className="px-5 pt-safe pt-8 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(181,224,234,0.65)' }}>
              {greeting},
            </p>
            <h1 className="text-white text-xl font-bold leading-tight">{firstName}</h1>
          </div>
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-cover bg-center"
               style={{
                 backgroundImage: user?.image ? `url(${user.image})` : 'linear-gradient(135deg, #b5e0ea, #7ec8d8)',
                 boxShadow: '0 4px 16px rgba(181,224,234,0.3)',
               }}>
            {!user?.image && (
              <span className="font-bold text-sm" style={{ color: '#071e49' }}>
                {firstName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs font-mono" style={{ color: 'rgba(181,224,234,0.4)' }}>
          {user?.idRelawan ?? 'SPPG-000'}
        </p>
      </header>

      {/* ── Clock ── */}
      <section className="px-5 pt-6 pb-4 flex flex-col items-center">
        <ClockWidget />
      </section>

      {/* ── Status Badge ── */}
      <div className="flex justify-center px-5 pb-6">
        <StatusBadge status={statusHariIni} />
      </div>

      {/* ── Absen Summary Cards ── */}
      <section className="px-5 space-y-3 flex-1">
        {/* Masuk */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: hasMasuk ? 'rgba(181,224,234,0.15)' : 'rgba(7,30,73,0.6)' }}>
                <LogIn className="w-5 h-5" style={{ color: hasMasuk ? '#b5e0ea' : 'rgba(181,224,234,0.35)' }} />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Absen Masuk</p>
                {hasMasuk && masukData ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" style={{ color: '#b5e0ea' }} />
                    <span className="text-xs font-medium font-mono-clock" style={{ color: '#b5e0ea' }}>
                      {masukData.waktuAbsen}
                    </span>
                    <MapPin className="w-3 h-3 ml-1" style={{ color: 'rgba(181,224,234,0.45)' }} />
                    <span className="text-xs font-mono" style={{ color: 'rgba(181,224,234,0.45)' }}>
                      {Number(masukData.latitude).toFixed(3)}, {Number(masukData.longitude).toFixed(3)}
                    </span>
                  </div>
                ) : isMasukDitolak ? (
                  <p className="text-xs mt-0.5" style={{ color: '#f87171' }}>Ditolak (Di Luar Radius)</p>
                ) : (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(181,224,234,0.4)' }}>Belum absen masuk</p>
                )}
              </div>
            </div>
            {hasMasuk
              ? <Check className="w-5 h-5 text-white" />
              : <ChevronRight className="w-4 h-4" style={{ color: 'rgba(181,224,234,0.25)' }} />
            }
          </div>
        </div>

        {/* Pulang */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: isLengkap ? 'rgba(251,191,36,0.12)' : 'rgba(7,30,73,0.6)' }}>
                <LogOut className="w-5 h-5"
                        style={{ color: isLengkap ? '#fbbf24' : 'rgba(181,224,234,0.35)' }} />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Absen Pulang</p>
                {isLengkap && pulangData ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" style={{ color: '#fbbf24' }} />
                    <span className="text-xs font-medium font-mono-clock" style={{ color: '#fbbf24' }}>
                      {pulangData.waktuAbsen}
                    </span>
                  </div>
                ) : isPulangDitolak ? (
                  <p className="text-xs mt-0.5" style={{ color: '#f87171' }}>Ditolak (Di Luar Radius)</p>
                ) : (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(181,224,234,0.4)' }}>
                    {hasMasuk ? 'Belum absen pulang' : 'Absen masuk dulu'}
                  </p>
                )}
              </div>
            </div>
            {isLengkap
              ? <Check className="w-5 h-5 text-white" />
              : <ChevronRight className="w-4 h-4" style={{ color: 'rgba(181,224,234,0.25)' }} />
            }
          </div>
        </div>
      </section>

      {/* ── CTA Buttons ── */}
      <section className="px-5 pt-4 pb-4 space-y-3">
        {!hasMasuk && (
          <button
            id="btn-absen-masuk"
            onClick={handleAbsenMasuk}
            className="w-full py-5 rounded-2xl font-bold text-lg
                       flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.97]"
            style={isMasukDitolak ? {
              background: '#f87171', color: '#FFFFFF', boxShadow: '0 4px 32px rgba(248,113,113,0.3)',
              animation: 'none'
            } : {
              background: '#FFFFFF', color: '#071e49', boxShadow: '0 4px 32px rgba(255,255,255,0.2)',
              animation: 'pulse-white 2s ease-in-out infinite',
            }}
          >
            <Camera className="w-7 h-7" strokeWidth={2.5} />
            {isMasukDitolak ? 'ULANGI ABSEN MASUK' : 'ABSEN MASUK'}
          </button>
        )}

        {hasMasuk && !isLengkap && (
          <button
            id="btn-absen-pulang"
            onClick={handleAbsenPulang}
            className="w-full py-5 rounded-2xl font-bold text-lg
                       flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.97]"
            style={isPulangDitolak ? {
              background: '#f87171', color: '#FFFFFF', boxShadow: '0 4px 32px rgba(248,113,113,0.3)',
              animation: 'none'
            } : {
              background: 'linear-gradient(135deg, #b5e0ea, #7ec8d8)', color: '#071e49', boxShadow: '0 4px 32px rgba(181,224,234,0.3)',
              animation: 'pulse-accent 2s ease-in-out infinite',
            }}
          >
            <Camera className="w-7 h-7" strokeWidth={2.5} />
            {isPulangDitolak ? 'ULANGI ABSEN PULANG' : 'ABSEN PULANG'}
          </button>
        )}

        {isLengkap && (
          <div className="w-full py-5 rounded-2xl flex items-center justify-center gap-3"
               style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-lg text-white">Absensi Hari Ini Lengkap!</span>
          </div>
        )}
      </section>

      <PWAInstallBanner />
    </div>
  );
}
