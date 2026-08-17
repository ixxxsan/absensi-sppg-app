import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────
export type UserRole = 'relawan' | 'admin' | 'super_admin';

export type Divisi = 'ASISTEN LAPANGAN' | 'ADMIN' | 'STOCKIST' | 'SECURITY' | 'DRIVER' | 'CLEANING SERVICE' | 'PERSIAPAN' | 'PENGOLAHAN' | 'PEMORSIAN' | 'PENCUCI TRAY';
export type StatusRelawan = 'Aktif' | 'Magang' | 'Cuti';

// AuthStore has been removed. Use authClient.useSession() or getServerSession() instead.

// ─── Types ────────────────────────────────────────────────
export type AbsensiStatus = 'belum' | 'masuk' | 'lengkap';

export interface AbsenRecord {
  id: number;
  relawanId: number;
  tanggalAbsen: string;   // YYYY-MM-DD
  waktuAbsen: string;     // HH:mm WIB
  fotoUrl: string;
  latitude: number;
  longitude: number;
  tipe: 'masuk' | 'pulang';
  statusValidasi: 'valid' | 'ditolak';
}

interface AbsensiState {
  statusHariIni: AbsensiStatus;
  absenMasukToday: AbsenRecord | null;
  absenPulangToday: AbsenRecord | null;
  riwayat: AbsenRecord[];
  setStatusHariIni: (status: AbsensiStatus) => void;
  setAbsenMasuk: (record: AbsenRecord) => void;
  setAbsenPulang: (record: AbsenRecord) => void;
  setRiwayat: (records: AbsenRecord[]) => void;
  resetHarian: () => void;
}

// ─── Absensi Store ────────────────────────────────────────
export const useAbsensiStore = create<AbsensiState>()(
  persist(
    (set) => ({
      statusHariIni: 'belum',
      absenMasukToday: null,
      absenPulangToday: null,
      riwayat: [],
      setStatusHariIni: (status) => set({ statusHariIni: status }),
      setAbsenMasuk: (record) => set({ absenMasukToday: record, statusHariIni: 'masuk' }),
      setAbsenPulang: (record) => set({ absenPulangToday: record, statusHariIni: 'lengkap' }),
      setRiwayat: (records) => set({ riwayat: records }),
      resetHarian: () => set({
        statusHariIni: 'belum',
        absenMasukToday: null,
        absenPulangToday: null,
      }),
    }),
    {
      name: 'sppg-absensi',
      partialize: (state) => ({
        statusHariIni: state.statusHariIni,
        absenMasukToday: state.absenMasukToday,
        absenPulangToday: state.absenPulangToday,
      }),
    }
  )
);

// ─── Camera State (non-persisted) ─────────────────────────
interface CameraState {
  tipeAbsen: 'masuk' | 'pulang';
  capturedImage: string | null;   // base64 dataURL
  latitude: number | null;
  longitude: number | null;
  addressName: string | null;     // Full address string
  gpsAccuracy: number | null;
  gpsStatus: 'idle' | 'searching' | 'found' | 'error' | 'out_of_range' | 'fake_gps';
  distanceFromTask: number | null;    // meters
  setTipeAbsen: (tipe: 'masuk' | 'pulang') => void;
  setCapturedImage: (img: string | null) => void;
  setGPS: (lat: number, lng: number, accuracy: number) => void;
  setAddressName: (addr: string | null) => void;
  setGpsStatus: (s: CameraState['gpsStatus']) => void;
  setDistanceFromTask: (d: number | null) => void;
  reset: () => void;
}

export const useCameraStore = create<CameraState>()((set) => ({
  tipeAbsen: 'masuk',
  capturedImage: null,
  latitude: null,
  longitude: null,
  addressName: null,
  gpsAccuracy: null,
  gpsStatus: 'idle',
  distanceFromTask: null,
  setTipeAbsen: (tipe) => set({ tipeAbsen: tipe }),
  setCapturedImage: (img) => set({ capturedImage: img }),
  setGPS: (lat, lng, accuracy) => set({ latitude: lat, longitude: lng, gpsAccuracy: accuracy }),
  setAddressName: (addr) => set({ addressName: addr }),
  setGpsStatus: (s) => set({ gpsStatus: s }),
  setDistanceFromTask: (d) => set({ distanceFromTask: d }),
  reset: () => set({
    capturedImage: null,
    latitude: null,
    longitude: null,
    addressName: null,
    gpsAccuracy: null,
    gpsStatus: 'idle',
    distanceFromTask: null,
  }),
}));

// Removed unused stores
