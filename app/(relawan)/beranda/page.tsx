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
import { motion } from 'framer-motion';

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

  // Animation variants
  const containerVars: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div 
      className="min-h-[100dvh] flex flex-col text-white"
      style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}
    >
      
      {/* ── Header ── */}
      <header className="px-5 pt-safe pt-8 pb-2">
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <div>
            <p className="text-sm font-medium text-white/60">
              {greeting},
            </p>
            <h1 className="text-white text-2xl font-bold leading-tight">{firstName}</h1>
          </div>
          {/* Avatar */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-cover bg-center border border-white/10"
               style={{
                 backgroundImage: user?.image ? `url(${user.image})` : 'linear-gradient(135deg, #b5e0ea, #7ec8d8)',
                 boxShadow: '0 8px 32px rgba(181,224,234,0.15)',
               }}>
            {!user?.image && (
              <span className="font-bold text-lg text-slate-900">
                {firstName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="mt-1 text-xs font-mono text-white/40"
        >
          {user?.idRelawan ?? 'SPPG-000'}
        </motion.p>
      </header>

      {/* ── Animated Content Container ── */}
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col"
      >
        {/* ── Clock ── */}
        <motion.section variants={itemVars} className="px-5 pt-6 pb-4 flex flex-col items-center">
          <ClockWidget />
        </motion.section>

        {/* ── Status Badge ── */}
        <motion.div variants={itemVars} className="flex justify-center px-5 pb-6">
          <StatusBadge status={statusHariIni} />
        </motion.div>

        {/* ── Absen Summary Cards ── */}
        <section className="px-5 space-y-4 flex-1">
          {/* Masuk */}
          <motion.div variants={itemVars} className="bg-white/5 backdrop-blur-xl rounded-[1.5rem] p-4 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasMasuk ? 'bg-[#b5e0ea]/20' : 'bg-slate-800/80'}`}>
                  <LogIn className="w-6 h-6" style={{ color: hasMasuk ? '#b5e0ea' : 'rgba(255,255,255,0.4)' }} />
                </div>
                <div>
                  <p className="text-white text-base font-semibold">Absen Masuk</p>
                  {hasMasuk && masukData ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5" style={{ color: '#b5e0ea' }} />
                      <span className="text-xs font-semibold font-mono-clock" style={{ color: '#b5e0ea' }}>
                        {masukData.waktuAbsen}
                      </span>
                      <MapPin className="w-3.5 h-3.5 ml-1.5 text-white/40" />
                      <span className="text-[10px] font-mono text-white/40 tracking-wider">
                        {Number(masukData.latitude).toFixed(3)}, {Number(masukData.longitude).toFixed(3)}
                      </span>
                    </div>
                  ) : isMasukDitolak ? (
                    <p className="text-xs mt-1 font-medium text-red-400">Ditolak (Di Luar Radius)</p>
                  ) : (
                    <p className="text-xs mt-1 font-medium text-white/40">Belum absen masuk</p>
                  )}
                </div>
              </div>
              {hasMasuk
                ? <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Check className="w-5 h-5 text-white" /></div>
                : <ChevronRight className="w-5 h-5 text-white/30" />
              }
            </div>
          </motion.div>

          {/* Pulang */}
          <motion.div variants={itemVars} className="bg-white/5 backdrop-blur-xl rounded-[1.5rem] p-4 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLengkap ? 'bg-amber-400/20' : 'bg-slate-800/80'}`}>
                  <LogOut className="w-6 h-6" style={{ color: isLengkap ? '#fbbf24' : 'rgba(255,255,255,0.4)' }} />
                </div>
                <div>
                  <p className="text-white text-base font-semibold">Absen Pulang</p>
                  {isLengkap && pulangData ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold font-mono-clock text-amber-400">
                        {pulangData.waktuAbsen}
                      </span>
                    </div>
                  ) : isPulangDitolak ? (
                    <p className="text-xs mt-1 font-medium text-red-400">Ditolak (Di Luar Radius)</p>
                  ) : (
                    <p className="text-xs mt-1 font-medium text-white/40">
                      {hasMasuk ? 'Belum absen pulang' : 'Absen masuk dulu'}
                    </p>
                  )}
                </div>
              </div>
              {isLengkap
                ? <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Check className="w-5 h-5 text-white" /></div>
                : <ChevronRight className="w-5 h-5 text-white/30" />
              }
            </div>
          </motion.div>
        </section>

        {/* ── CTA Buttons ── */}
        <section className="px-5 pt-6 pb-6 space-y-4">
          {!hasMasuk && (
            <motion.button
              variants={itemVars}
              whileTap={{ scale: 0.96 }}
              id="btn-absen-masuk"
              onClick={handleAbsenMasuk}
              className={`w-full py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 shadow-xl ${
                isMasukDitolak ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-white text-slate-900 shadow-white/20 animate-pulse'
              }`}
            >
              <Camera className="w-7 h-7" strokeWidth={2.5} />
              {isMasukDitolak ? 'ULANGI ABSEN MASUK' : 'ABSEN MASUK'}
            </motion.button>
          )}

          {hasMasuk && !isLengkap && (
            <motion.button
              variants={itemVars}
              whileTap={{ scale: 0.96 }}
              id="btn-absen-pulang"
              onClick={handleAbsenPulang}
              className={`w-full py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 shadow-xl ${
                isPulangDitolak ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-gradient-to-r from-[#b5e0ea] to-[#7ec8d8] text-slate-900 shadow-[#b5e0ea]/30 animate-pulse'
              }`}
            >
              <Camera className="w-7 h-7" strokeWidth={2.5} />
              {isPulangDitolak ? 'ULANGI ABSEN PULANG' : 'ABSEN PULANG'}
            </motion.button>
          )}

          {isLengkap && (
            <motion.div 
              variants={itemVars}
              className="w-full py-5 rounded-[1.5rem] flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border border-white/20"
            >
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <span className="font-bold text-lg text-white">Absensi Hari Ini Lengkap!</span>
            </motion.div>
          )}
        </section>
      </motion.div>

      <PWAInstallBanner />
    </div>
  );
}
