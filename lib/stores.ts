import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────
export type UserRole = 'relawan' | 'admin' | 'super_admin';

export type Divisi = 'ASISTEN LAPANGAN' | 'ADMIN' | 'STOCKIST' | 'SECURITY' | 'DRIVER' | 'CLEANING SERVICE' | 'PERSIAPAN' | 'PENGOLAHAN' | 'PEMORSIAN' | 'PENCUCI TRAY';
export type StatusRelawan = 'Aktif' | 'Magang' | 'Cuti';

export interface AuthUser {
  id: number;
  idRelawan?: string;    // e.g. SPPG-001 (for relawan)
  namaLengkap: string;
  email: string;
  role: UserRole;
  token: string;
  fotoProfil?: string;
  divisi?: Divisi;
  status?: StatusRelawan;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

// ─── Auth Store ───────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'sppg-auth',
      // Only persist user + auth status (not loading state)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

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
  gpsStatus: 'idle' | 'searching' | 'found' | 'error' | 'out_of_range';
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

// ─── Relawan Store ─────────────────────────────────────────
export interface Relawan {
  id: number;
  idRelawan: string;
  namaLengkap: string;
  email: string;
  noTelepon: string;
  nik: string;
  status: StatusRelawan;
  divisi: Divisi;
}

const INITIAL_RELAWAN: Relawan[] = [
  { id: 1, idRelawan: 'SPPG-001', namaLengkap: 'Budi Santoso', email: 'budi@sppg.id', noTelepon: '081234567890', nik: '3603010101900001', status: 'Aktif', divisi: 'ASISTEN LAPANGAN' },
  { id: 2, idRelawan: 'SPPG-002', namaLengkap: 'Siti Rahayu', email: 'siti@sppg.id', noTelepon: '081234567891', nik: '3603010202910002', status: 'Aktif', divisi: 'PERSIAPAN' },
  { id: 3, idRelawan: 'SPPG-003', namaLengkap: 'Ahmad Yani', email: 'ahmad@sppg.id', noTelepon: '081234567892', nik: '3603010303920003', status: 'Aktif', divisi: 'PENGOLAHAN' },
  { id: 4, idRelawan: 'SPPG-004', namaLengkap: 'Dewi Lestari', email: 'dewi@sppg.id', noTelepon: '081234567893', nik: '3603010404930004', status: 'Cuti', divisi: 'PEMORSIAN' },
  { id: 5, idRelawan: 'SPPG-005', namaLengkap: 'Rizky Pratama', email: 'rizky@sppg.id', noTelepon: '081234567894', nik: '3603010505940005', status: 'Aktif', divisi: 'PENCUCI TRAY' },
];

interface RelawanState {
  relawanList: Relawan[];
  setRelawanList: (list: Relawan[]) => void;
  updateRelawanStatus: (idRelawan: string, status: StatusRelawan) => void;
  addRelawan: (relawan: Relawan) => void;
  updateRelawan: (id: number, data: Partial<Relawan>) => void;
  deleteRelawan: (id: number) => void;
}

export const useRelawanStore = create<RelawanState>()(
  persist(
    (set) => ({
      relawanList: INITIAL_RELAWAN,
      setRelawanList: (list) => set({ relawanList: list }),
      updateRelawanStatus: (idRelawan, status) => set((state) => ({
        relawanList: state.relawanList.map(r => r.idRelawan === idRelawan ? { ...r, status } : r)
      })),
      addRelawan: (relawan) => set((state) => ({ relawanList: [...state.relawanList, relawan] })),
      updateRelawan: (id, data) => set((state) => ({
        relawanList: state.relawanList.map(r => r.id === id ? { ...r, ...data } : r)
      })),
      deleteRelawan: (id) => set((state) => ({
        relawanList: state.relawanList.filter(r => r.id !== id)
      })),
    }),
    {
      name: 'sppg-relawan-list',
    }
  )
);

// ─── Cuti Store ─────────────────────────────────────────
export type JenisCuti = 'Cuti Tahunan' | 'Sakit' | 'Izin' | 'Keperluan Pribadi';
export type StatusCuti = 'Menunggu' | 'Disetujui' | 'Ditolak';

export interface CutiRequest {
  id: string;
  idRelawan: string;
  namaLengkap: string;
  jenisCuti: JenisCuti;
  tanggalMulai: string;
  tanggalSelesai: string;
  alasan: string;
  status: StatusCuti;
  tanggalPengajuan: string;
}

interface CutiState {
  cutiRequests: CutiRequest[];
  addCutiRequest: (request: CutiRequest) => void;
  updateCutiStatus: (id: string, status: StatusCuti) => void;
}

export const useCutiStore = create<CutiState>()(
  persist(
    (set) => ({
      cutiRequests: [
        {
          id: '1',
          idRelawan: 'SPPG-004',
          namaLengkap: 'Dewi Lestari',
          jenisCuti: 'Cuti Tahunan',
          tanggalMulai: '2026-08-20',
          tanggalSelesai: '2026-08-22',
          alasan: 'Acara keluarga',
          status: 'Menunggu',
          tanggalPengajuan: '2026-08-14'
        }
      ],
      addCutiRequest: (request) => set((state) => ({ cutiRequests: [...state.cutiRequests, request] })),
      updateCutiStatus: (id, status) => set((state) => ({
        cutiRequests: state.cutiRequests.map(c => c.id === id ? { ...c, status } : c)
      })),
    }),
    {
      name: 'sppg-cuti-list',
    }
  )
);
