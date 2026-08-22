export const DIVISI_OPTIONS = [
  'ASISTEN LAPANGAN', 
  'ADMIN', 
  'STOCKIST', 
  'SECURITY', 
  'DRIVER', 
  'CLEANING SERVICE', 
  'PERSIAPAN', 
  'HEAD CHEF', 
  'PENGOLAHAN', 
  'PEMORSIAN', 
  'PENCUCI TRAY'
] as const;

export type Divisi = typeof DIVISI_OPTIONS[number];

export const STATUS_RELAWAN_OPTIONS = ['Aktif', 'Magang', 'Cuti'] as const;

export type StatusRelawan = typeof STATUS_RELAWAN_OPTIONS[number];
