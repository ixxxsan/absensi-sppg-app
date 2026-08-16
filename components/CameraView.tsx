'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useCameraStore } from '@/lib/stores';
import { applyWatermark } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { goeyToast } from 'goey-toast';

interface CameraViewProps {
  onCapture: (blob: Blob) => void;
  canShoot: boolean;
  tipeAbsen: 'masuk' | 'pulang';
  userOverride?: { idRelawan?: string, namaLengkap?: string, divisi?: string } | null;
}

export default function CameraView({ onCapture, canShoot, tipeAbsen, userOverride }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { latitude, longitude } = useCameraStore();
  const { data: session } = authClient.useSession();
  const user = session?.user as { name?: string, namaLengkap?: string, idRelawan?: string, divisi?: string } | undefined;
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start front camera stream (locked, no switching)
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: 'user' },   // Front camera, locked
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch {
        // Fallback if 'exact' not supported (some browsers)
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play();
          }
          } catch (err: unknown) {
          const error = err as Error;
          console.error('Camera access denied:', error);
          if (error.name === 'NotAllowedError') {
            setCameraError('Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.');
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            setCameraError('Kamera tidak ditemukan di perangkat ini.');
          } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            setCameraError('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut dan muat ulang.');
          } else {
            setCameraError('Gagal mengakses kamera: ' + (error.message || 'Error tidak diketahui'));
          }
        }
      }
    };

    startCamera();

    return () => {
      // Stop all tracks when leaving page
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !canShoot) return;
    if (latitude === null || longitude === null) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d')!;

    // Mirror horizontally (selfie correction)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const { addressName } = useCameraStore.getState();

    // Apply watermark
    try {
      const watermarkedBlob = await applyWatermark(canvas, {
        latitude,
        longitude,
        addressName,
        namaRelawan: userOverride?.namaLengkap ?? user?.namaLengkap ?? user?.name ?? 'Relawan SPPG',
        idRelawan: userOverride?.idRelawan ?? user?.idRelawan ?? 'SPPG-000',
        divisi: userOverride?.divisi ?? user?.divisi ?? 'Relawan',
        tipeAbsen,
      });

      // Haptic feedback (if supported)
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

      onCapture(watermarkedBlob);
    } catch (err) {
      console.error('Failed to apply watermark:', err);
      goeyToast.error('Gagal memproses gambar. Silakan coba lagi.');
    }
  }, [canShoot, latitude, longitude, tipeAbsen, user, userOverride, onCapture]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}   // Mirror selfie preview
      />

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/80 backdrop-blur-sm z-50">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-white font-bold text-lg mb-2">Kamera Bermasalah</h2>
          <p className="text-red-200 text-sm mb-6">{cameraError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold active:scale-95 transition-transform"
          >
            <RefreshCcw className="w-4 h-4" /> Muat Ulang Halaman
          </button>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Shutter Button Overlay - Bottom Nav style */}
      <div className="absolute bottom-0 left-0 right-0 h-[84px] pb-safe bg-[#071e49]/95 backdrop-blur-md border-t border-[#b5e0ea]/15 flex items-center justify-center z-50">
        <button
          id="shutter-btn"
          onClick={handleCapture}
          disabled={!canShoot}
          aria-label="Ambil foto absensi"
          className={`
            w-20 h-20 rounded-full border-4 transition-all duration-300 active:scale-90
            flex items-center justify-center
            ${canShoot
              ? 'border-white bg-white/20 backdrop-blur-sm shadow-2xl shadow-white/20 active:bg-white/40'
              : 'border-slate-500 bg-slate-700/40 cursor-not-allowed opacity-50'
            }
          `}
        >
          {/* Inner circle */}
          <div className={`
            w-14 h-14 rounded-full transition-all duration-300
            ${canShoot
              ? 'bg-white shadow-inner'
              : 'bg-slate-600'
            }
          `} />
        </button>
      </div>

      {/* Top bar with close-only hint */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe">
        <div className="w-8" />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-white text-xs font-semibold">LIVE</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Camera guide overlay — face oval */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className="border-2 border-white/30 rounded-full"
          style={{ width: '55vw', height: '70vw', maxWidth: 260, maxHeight: 330 }}
        />
      </div>
    </div>
  );
}
