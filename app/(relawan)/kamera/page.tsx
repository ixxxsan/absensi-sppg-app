'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, Circle, AlertTriangle, Camera } from 'lucide-react';
import CameraView from '@/components/CameraView';
import GPSIndicator from '@/components/GPSIndicator';
import { useCameraStore } from '@/lib/stores';
import { nowWIB, haversineDistance, formatDateLong, formatCoords } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { getLatestUser } from '@/app/actions/user';

type CameraState = 'preview' | 'processing' | 'uploading' | 'onboarding';

export default function KameraPage() {
  const router = useRouter();
  const [uiState, setUiState] = useState<CameraState>('onboarding');
  const [uploadText, setUploadText] = useState('Memproses foto...');

  const [currentTime, setCurrentTime] = useState(nowWIB().format('HH:mm'));

  useEffect(() => {
    const seen = localStorage.getItem('sppg_has_seen_permission');
    if (seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUiState('preview');
    }

    const timer = setInterval(() => {
      setCurrentTime(nowWIB().format('HH:mm'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGrantPermission = () => {
    localStorage.setItem('sppg_has_seen_permission', 'true');
    setUiState('preview');
  };

  const { gpsStatus, tipeAbsen, latitude, longitude, reset } = useCameraStore();
  const { data: session } = authClient.useSession();
  
  const [dbUser, setDbUser] = useState<{ idRelawan?: string, namaLengkap?: string, divisi?: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await getLatestUser();
        if (u) {
          setDbUser({
            idRelawan: u.idRelawan || undefined,
            namaLengkap: u.name || undefined,
            divisi: u.divisi || undefined
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchUser();
  }, []);

  const user = dbUser || (session?.user as { name?: string, idRelawan?: string, divisi?: string } | undefined);

  const canShoot = gpsStatus === 'found' || gpsStatus === 'out_of_range';

  const handleCapture = useCallback(async (blob: Blob) => {
    // Force GPS validation for Absen Masuk
    const dist = haversineDistance(latitude ?? 0, longitude ?? 0, -6.098751, 106.653180);
    if (tipeAbsen === 'masuk' && dist > 500) {
      alert("Anda berada di luar radius tugas. Absensi ditolak. Silakan pindah mendekat ke lokasi.");
      return;
    }

    setUiState('processing');

    try {
      setUploadText('Mengunggah foto...');
      
      const userId = session?.user?.id || 'unknown';
      const fileName = `${userId}-${nowWIB().format('YYYYMMDD-HHmmss')}-${tipeAbsen}.webp`;

      const { supabase } = await import('@/lib/supabase');
      const { error: uploadError } = await supabase.storage
        .from('absensi_fotos')
        .upload(fileName, blob, {
          contentType: 'image/webp',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error('Gagal mengunggah foto ke penyimpanan.');
      }

      const { data: publicUrlData } = supabase.storage
        .from('absensi_fotos')
        .getPublicUrl(fileName);

      setUploadText('Menyimpan data absensi...');
      
      const { submitAbsensi } = await import('@/app/actions/absensi');
      const res = await submitAbsensi(publicUrlData.publicUrl, latitude ?? 0, longitude ?? 0, tipeAbsen, Date.now());
      if (!res || !res.success) {
        throw new Error(res?.error || 'Gagal mengirim absensi.');
      }

      reset(); // Clear camera state
      router.push('/sukses');
    } catch (err: unknown) {
      console.error('Upload error:', err);
      alert(err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah.");
      setUiState('preview'); // Return to camera on error
    }
  }, [tipeAbsen, latitude, longitude, reset, router, session]);

  const handleBack = () => {
    reset();
    router.back();
  };
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* ── Camera or Processing State ── */}
      {uiState === 'onboarding' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center"
             style={{ background: 'linear-gradient(180deg, #071e49 0%, #04122d 100%)' }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl"
               style={{ background: 'rgba(181,224,234,0.1)' }}>
            <Camera className="w-10 h-10" style={{ color: '#b5e0ea' }} />
          </div>
          <h1 className="text-white text-2xl font-bold mb-3">Izin Akses Dibutuhkan</h1>
          <p className="text-sm mb-8 max-w-xs leading-relaxed" style={{ color: 'rgba(181,224,234,0.7)' }}>
            Aplikasi ini memerlukan akses <strong>Kamera</strong> untuk mengambil foto kehadiran, dan <strong>Lokasi (GPS)</strong> untuk memverifikasi area tugas Anda.
          </p>
          <button onClick={handleGrantPermission}
                  className="w-full max-w-xs py-4 rounded-xl font-bold text-lg transition-transform active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #FFFFFF, #b5e0ea)', color: '#071e49' }}>
            Mengerti, Izinkan Akses
          </button>
          <button onClick={handleBack}
                  className="w-full max-w-xs py-4 mt-3 rounded-xl font-bold text-sm transition-colors active:bg-white/5"
                  style={{ color: '#b5e0ea' }}>
            Batal
          </button>
        </div>
      ) : uiState === 'preview' ? (
        <>
          {/* Full-screen camera */}
          <div className="relative flex-1">
            <CameraView
              onCapture={handleCapture}
              canShoot={canShoot}
              tipeAbsen={tipeAbsen}
              userOverride={dbUser}
            />

            {/* Back button */}
            <button
              onClick={handleBack}
              id="camera-back-btn"
              className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full
                         bg-black/40 backdrop-blur-sm flex items-center justify-center
                         text-white active:scale-90 transition-transform"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Tipe absen badge */}
            <div className="absolute top-4 right-4 z-10">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg`}
                      style={{
                        background: '#ffffff',
                        color: '#0c2860',
                      }}>
                  <Circle className={`w-3 h-3 fill-current text-[#0c2860]`} />
                  {tipeAbsen === 'masuk' ? 'ABSEN MASUK' : 'ABSEN PULANG'}
                </span>
            </div>

            {/* GPS Indicator overlay - moved up slightly */}
            <div className="absolute bottom-[240px] left-4 right-4 z-10">
              <GPSIndicator />
            </div>

            {/* Live Timestamp Overlay */}
            <div className="absolute bottom-[100px] left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none drop-shadow-md">
              <div className="flex items-center gap-3">
                {/* Time Box */}
                <div className="px-3 py-1.5 rounded-xl bg-white flex items-center justify-center shadow-lg">
                  <span className="text-[28px] font-black tracking-tight" style={{ color: '#0c2860', lineHeight: 1 }}>
                    {currentTime}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                {/* Green Vertical Line */}
                <div className="w-1 rounded-full bg-emerald-500 shrink-0" />
                
                {/* Info Text */}
                <div className="flex flex-col gap-1 py-1">
                  <span className="text-white font-extrabold text-base drop-shadow-md">
                    {formatDateLong()}
                  </span>
                  <span className="text-slate-200 font-medium text-xs leading-relaxed max-w-[90%] drop-shadow-md">
                    {useCameraStore.getState().addressName || formatCoords(latitude ?? 0, longitude ?? 0)}
                  </span>
                  <span className="text-emerald-400 font-bold text-xs mt-0.5 drop-shadow-md">
                    Divisi: {user?.divisi ?? 'Relawan'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction text */}
            {!canShoot && gpsStatus !== 'error' && (
              <div className="absolute top-1/2 left-4 right-4 -translate-y-8 z-10 flex items-center
                              justify-center gap-2 glass rounded-xl px-4 py-3">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-amber-300 text-sm text-center">
                  Tunggu GPS terkunci sebelum mengambil foto
                </p>
              </div>
            )}

            {/* Out of range warning (can still shoot but will be rejected) */}
            {gpsStatus === 'out_of_range' && (
              <div className="absolute top-1/2 left-4 right-4 -translate-y-8 z-10 flex items-center
                              justify-center gap-2 rounded-xl px-4 py-3 bg-red-500/20 border border-red-500/30">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <p className="text-red-300 text-sm text-center">
                  Anda berada di luar radius tugas. Absensi akan DITOLAK. Pindah mendekat untuk valid.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Processing overlay */
        <div className="flex-1 flex flex-col items-center justify-center gap-6"
             style={{ background: 'rgba(7,30,73,0.95)' }}>
          {/* Spinner */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4"
                 style={{ borderColor: 'rgba(181,224,234,0.15)' }} />
            <div className="absolute inset-0 rounded-full border-4 animate-spin"
                 style={{ borderColor: 'rgba(181,224,234,0.15)', borderTopColor: '#b5e0ea' }} />
            <div className="absolute inset-3 rounded-full flex items-center justify-center"
                 style={{ background: 'rgba(181,224,234,0.08)' }}>
              <Camera className="w-6 h-6" style={{ color: '#b5e0ea' }} />
            </div>
          </div>

          {/* Progress text */}
          <div className="text-center">
            <p className="text-white font-semibold text-lg">{uploadText}</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(181,224,234,0.5)' }}>Jangan tutup aplikasi ini</p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {['Watermark', 'Upload', 'Simpan'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full transition-colors duration-300"
                     style={{
                       background: uploadText.includes(i === 0 ? 'Menerapkan' : i === 1 ? 'Mengunggah' : 'Menyimpan')
                         ? '#b5e0ea'
                         : 'rgba(181,224,234,0.2)',
                     }} />
                {i < 2 && <div className="w-6 h-px" style={{ background: 'rgba(181,224,234,0.15)' }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

